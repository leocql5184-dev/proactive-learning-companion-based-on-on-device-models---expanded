const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { environment } = require('./behavior-graph.test.cjs');
const policy = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../entry/src/main/resources/rawfile/profile_skill_v2.json')));
let passed = 0;
async function test(name, body) { await body(); passed++; console.log('PASS ' + name); }
function input(id, kind, value, time, sid = 'session-1') {
  return { id, kind, value, timestamp: time, sessionId: sid, taskId: 'FUNC-SC-0193', requestId: '', context: '' };
}
async function fixture() {
  const env = environment();
  const { ProfileRdb } = env.load('profile/ProfileRdb');
  const db = await ProfileRdb.open(env.context, policy);
  let current = await db.execute({ action: 'enable', now: 1000, epoch: 0, inputs: [], observationId: '' });
  return { env, db, current, async run(action, inputs = [], now = 5000, observationId = '') {
    current = await db.execute({ action, inputs, now, observationId, epoch: current.epoch }); return current;
  }, sql() { return env.store('growth_profile.db').db; } };
}

(async () => {
  await test('three dimensions, ungraded remains unknown, correct is not mastery; idempotent ingest/reopen', async () => {
    const f = await fixture(); const rows = [input('a', 'answer_submitted', 'unknown', 1500)];
    let result = await f.run('ingest', rows);
    assert.equal(new Set(result.observations.map(o => o.dimension)).size, 3);
    assert.match(result.observations.find(o => o.dimension === 'knowledge').description, /未判分/);
    const version = result.version;
    assert.equal((await f.run('ingest', rows)).version, version);
    result = await f.run('ingest', [input('b', 'answer_submitted', 'correct', 2000)]);
    assert.match(result.observations.find(o => o.dimension === 'knowledge').description, /待观察/);
    f.env.reload();
    const reopened = await f.env.load('profile/ProfileRdb').ProfileRdb.open(f.env.context, policy);
    assert.equal((await reopened.execute({action:'refresh', now:5000, inputs:[]})).version, result.version);
    assert.equal(f.env.state.openResults, 0); f.env.dispose();
  });
  await test('invalid or future input rolls back entire transaction and later calls recover', async () => {
    const f = await fixture();
    await assert.rejects(f.run('ingest', [input('good','report:emotion','calm',1500), input('bad','report:emotion','invented',1600)]));
    assert.equal(f.sql().prepare('SELECT COUNT(*) n FROM profile_evidence').get().n, 0);
    await assert.rejects(f.run('ingest', [input('future','report:emotion','calm',9000)]));
    f.env.state.failSql = 'INSERT INTO profile_observation';
    await assert.rejects(f.run('ingest', [input('good','report:emotion','calm',1500)]), /disk/);
    assert.equal(f.sql().prepare('SELECT COUNT(*) n FROM profile_evidence').get().n, 0);
    assert.ok((await f.run('ingest', [input('good','report:emotion','calm',1500)])).observations.some(o=>o.facet==='current_emotion'));
    assert.equal(f.env.state.openResults,0); f.env.dispose();
  });
  await test('self-report expires on resume/TTL; history counts one latest report per session', async () => {
    const f = await fixture();
    await f.run('ingest', [input('r1','report:emotion','tense',1100),input('r2','report:emotion','calm',1200)]);
    let result = await f.run('ingest', [input('resume','task_resumed','',1500)]);
    assert.ok(!result.observations.some(o=>o.facet==='current_emotion'));
    const recurring = result.observations.filter(o=>o.facet==='recurring_emotion');
    assert.equal(recurring.length,1); assert.match(recurring[0].description,/1 个有自报/);
    assert.match(recurring[0].description,/心情平静/);
    await f.run('ingest', [input('r3','report:emotion','tired',3000,'session-2')]);
    result = await f.run('refresh', [], 3000 + policy.currentTtlMs);
    assert.ok(!result.observations.some(o=>o.facet==='current_emotion'));
    assert.ok(result.observations.some(o=>o.facet==='recurring_emotion')); f.env.dispose();
  });
  await test('repeated wrong answers imply neither distraction nor inflexibility nor personality', async () => {
    const f = await fixture();
    const result = await f.run('ingest', [1,2,3].map(n=>input('wrong'+n,'answer_submitted','wrong',1000+n)));
    assert.ok(!result.observations.some(o=>['attention','strategy_flexibility','personality_tendency','resilience'].includes(o.facet)));
    f.env.dispose();
  });
  await test('cross-day split preference is supported; contrary feedback lowers it', async () => {
    const f = await fixture(); const day = 86400000;
    const rows = [input('s1','task_split_requested','',1000), input('s2','task_split_requested','',day+1000,'session-2'),
      input('s3','task_split_requested','',day+2000,'session-3')];
    let result = await f.run('ingest', rows, day+3000);
    assert.equal(result.observations.find(o=>o.facet==='guidance_preference').status,'SUPPORTED');
    const feedback = input('fb','feedback:split','unhelpful',day+3500,'session-3'); feedback.requestId='request-1';
    result = await f.run('ingest',[feedback],day+4000);
    assert.equal(result.observations.find(o=>o.facet==='guidance_preference').status,'OBSERVING'); f.env.dispose();
  });
  await test('correction excludes evidence through re-ingest and restart, but new independent evidence remains usable', async () => {
    const f = await fixture(); const row = input('r','report:attention','distracted',1500);
    let result = await f.run('ingest',[row]);
    const id = result.observations.find(o=>o.facet==='attention').id;
    await f.run('correct',[],5000,id);
    result = await f.run('ingest',[row]);
    assert.ok(!result.observations.some(o=>o.facet==='attention'));
    f.env.reload(); const db = await f.env.load('profile/ProfileRdb').ProfileRdb.open(f.env.context,policy);
    assert.ok(!(await db.execute({action:'refresh',now:5000,inputs:[]})).observations.some(o=>o.facet==='attention'));
    result = await f.run('ingest',[input('new','report:attention','focused',5100)],5200);
    assert.match(result.observations.find(o=>o.facet==='attention').description,/回到题目/); f.env.dispose();
  });
  await test('disabled consent blocks writes; stale queued epoch cannot repopulate after clear', async () => {
    const f = await fixture(); const epoch = f.current.epoch;
    await f.run('disable');
    await assert.rejects(f.run('ingest',[input('r','report:emotion','tired',1500)]));
    await f.run('enable'); await f.run('ingest',[input('r','report:emotion','tired',1500)]);
    const pending = await f.run('begin_clear'); assert.equal(pending.clearPending,true);
    f.env.reload(); const db = await f.env.load('profile/ProfileRdb').ProfileRdb.open(f.env.context,policy);
    assert.equal((await db.execute({action:'refresh',now:5000,inputs:[]})).clearPending,true);
    await assert.rejects(f.run('enable'),/清除/);
    await f.run('end_clear'); await f.run('enable');
    await assert.rejects(f.db.execute({action:'ingest',epoch,now:5000,inputs:[input('stale','report:emotion','calm',1500)]}));
    for(const table of ['profile_evidence','profile_correction','intervention_feedback']) {
      assert.equal(f.sql().prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,0);
    }
    f.env.dispose();
  });
  await test('concurrent writes serialize, both evidence survive, duplicate ids cannot mutate facts', async () => {
    const f = await fixture(); const base = {action:'ingest',epoch:f.current.epoch,now:5000};
    await Promise.all([f.db.execute({...base,inputs:[input('a','report:emotion','tired',1500)]}),
      f.db.execute({...base,inputs:[input('b','report:attention','focused',1600)]})]);
    assert.equal(f.sql().prepare('SELECT COUNT(*) n FROM profile_evidence').get().n,2);
    await assert.rejects(f.db.execute({...base,inputs:[input('a','report:emotion','happy',1500)]}),/不一致/);
    f.env.dispose();
  });
  await test('app Agent loads Skill, uses actual math RDB and feedback; incomplete collection is excluded', async () => {
    const env = environment(); const { ProfileAgent } = env.load('profile/ProfileAgent');
    const agent = await ProfileAgent.open(env.context); await agent.enable(true);
    const math = await env.load('knowledge/MathKnowledgeRdb').MathKnowledgeRdb.open(env.context);
    const c = new (env.load('learning/EventCollector').EventCollector)();
    const now = Date.now()-10000; c.setCollection(true); c.start('FUNC-SC-0193',now); c.updateDraft('B'); c.submit(now+1000);
    await agent.sync(c.state,math);
    assert.match(agent.state.observations.find(o=>o.dimension==='knowledge').description,/题目关联/);
    await agent.report(c.active(),'emotion','calm');
    assert.ok(agent.state.observations.some(o=>o.facet==='current_emotion'));
    c.request('hint',now+2000); c.acknowledge(c.active().pendingRequestId,now+3000);
    await agent.feedback(c.active(),c.active().cardRequestId,'hint','accepted');
    await agent.feedback(c.active(),c.active().cardRequestId,'hint','helpful');
    assert.equal(agent.state.feedback.length,2);
    await assert.rejects(agent.feedback(c.active(),'stale-request','hint','helpful'));
    c.setCollection(false); c.updateDraft('A'); c.submit(now+4000);
    await agent.sync(c.state,math);
    const db = env.store('growth_profile.db').db;
    assert.ok(!db.prepare('SELECT payload FROM profile_evidence').all().some(r=>JSON.parse(r.payload).value==='wrong'));
    env.dispose();
  });
  await test('app Agent cancels in-flight graph read when consent or data generation changes', async () => {
    const env = environment(); const agent = await env.load('profile/ProfileAgent').ProfileAgent.open(env.context);
    await agent.enable(true);
    const c = new (env.load('learning/EventCollector').EventCollector)(); c.setCollection(true); c.start('FUNC-SC-0193',Date.now()-1000);
    let release; const pendingGraph = {knowledgeContext:()=>new Promise(r=>release=r)};
    const pending = agent.sync(c.state,pendingGraph);
    await agent.beginClear(); await agent.finishClear(); await agent.enable(true);
    release('旧图谱读取'); await pending;
    assert.equal(env.store('growth_profile.db').db.prepare('SELECT COUNT(*) n FROM profile_evidence').get().n,0); env.dispose();
  });
  await test('self-reports work without behavior collection; task finish expires current state', async () => {
    const env = environment(); const agent = await env.load('profile/ProfileAgent').ProfileAgent.open(env.context);
    await agent.enable(true); const c = new (env.load('learning/EventCollector').EventCollector)();
    c.start('FUNC-SC-0193',Date.now()-1000);
    await agent.report(c.active(),'emotion','tired');
    assert.ok(agent.state.observations.some(o=>o.facet==='current_emotion'));
    c.finish(Date.now()); await agent.sync(c.state,undefined);
    assert.ok(!agent.state.observations.some(o=>o.facet==='current_emotion'));
    assert.ok(agent.state.observations.some(o=>o.facet==='recurring_emotion')); env.dispose();
  });
  await test('revised feedback keeps immutable history and only latest outcome in the read model', async () => {
    const f = await fixture(); const a=input('fb1','feedback:hint','unhelpful',1500); a.requestId='request-7';
    const b=input('fb2','feedback:hint','helpful',2000); b.requestId='request-7';
    await f.run('ingest',[a]); const result=await f.run('ingest',[b]);
    assert.equal(result.feedback.length,1); assert.equal(result.feedback[0].value,'helpful');
    assert.equal(f.sql().prepare('SELECT COUNT(*) n FROM profile_evidence').get().n,2); f.env.dispose();
  });
  console.log(`${passed}/${passed} profile tests passed (actual ArkTS logic + SQLite, simulated Huawei API; not a phone test).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
