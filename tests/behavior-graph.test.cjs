// Actual ArkTS code + actual SQLite statements. The Huawei API is simulated, not device-tested.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const ts = require('D:/DevEco Studio/sdk/default/openharmony/ets/build-tools/ets-loader/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '..');
const etsRoot = path.join(root, 'entry/src/main/ets');
const rawRoot = path.join(root, 'entry/src/main/resources/rawfile');
const seed = JSON.parse(fs.readFileSync(path.join(rawRoot, 'behavior_graph_v1.json'), 'utf8'));

function environment() {
  const stores = new Map();
  const cache = new Map();
  const state = { failAfter: -1, writes: 0, openResults: 0, commits: 0, rollbacks: 0, resourceFailure: false, opens: 0 };
  const context = { resourceManager: { getRawFileContent: async (file, callback) => {
    if (state.resourceFailure) throw Error('resource unavailable');
    const bytes = new Uint8Array(fs.readFileSync(path.join(rawRoot, file)));
    if (callback) callback(null, bytes);
    return bytes;
  } } };
  function store(name) {
    if (stores.has(name)) return stores.get(name);
    const db = new DatabaseSync(':memory:');
    const adapter = {
      db, version: 0, closed: false,
      executeSql: async (sql, args = []) => {
        // Official API explicitly rejects transaction SQL; exercise the real RDB API contract.
        if (/^(BEGIN|COMMIT|ROLLBACK)/i.test(sql)) throw Error('executeSql does not support transactions');
        if (state.failSql && sql.includes(state.failSql)) { state.failSql = ''; throw Error('simulated disk failure'); }
        if (/^INSERT INTO behavior_example/.test(sql)) {
          state.writes++;
          if (state.failAfter === state.writes) throw Error('simulated disk failure');
        }
        db.prepare(sql).run(...args);
      },
      querySql: async (sql, args = []) => {
        const statement = db.prepare(sql);
        const columns = statement.columns().map(c => c.name);
        const rows = statement.all(...args);
        let index = -1, closed = false;
        state.openResults++;
        return {
          goToNextRow: () => ++index < rows.length,
          goToFirstRow: () => { index = 0; return rows.length > 0; },
          getColumnIndex: col => columns.indexOf(col),
          getString: col => String(rows[index][columns[col]]),
          getLong: col => Number(rows[index][columns[col]]),
          close: () => { if (!closed) state.openResults--; closed = true; }
        };
      },
      beginTransaction: () => db.exec('BEGIN'),
      commit: () => { db.exec('COMMIT'); state.commits++; },
      rollBack: () => { db.exec('ROLLBACK'); state.rollbacks++; },
      // Keep the underlying in-memory file for restart tests, like an on-device database file.
      close: async () => { adapter.closed = true; }
    };
    stores.set(name, adapter); return adapter;
  }
  const kits = {
    '@kit.ArkData': { relationalStore: { SecurityLevel: { S3: 3 }, getRdbStore: async (_, config) => {
      state.opens++; return store(config.name);
    } } },
    '@kit.ArkTS': { util: { TextDecoder: { create: () => ({ decodeToString: b => Buffer.from(b).toString('utf8') }) } } }
  };
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const source = fs.readFileSync(file, 'utf8');
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const exports = {};
    vm.runInNewContext(js, { exports, require: dep => {
      if (dep.startsWith('@kit.')) return kits[dep] || {};
      return load(path.resolve(path.dirname(file), dep + '.ets'));
    }, Date, Math, JSON, Array, Number, String, Error, Boolean, Promise, Uint8Array }, { filename: file });
    cache.set(file, exports); return exports;
  }
  return { state, store, context, load: name => load(path.join(etsRoot, name + '.ets')),
    reload: () => cache.clear(), dispose: () => stores.forEach(s => s.db.close()) };
}

let passed = 0;
async function test(name, body) { await body(); passed++; console.log('PASS ' + name); }
function createSession(env, task = 'FUNC-SC-0193') {
  const { EventCollector } = env.load('learning/EventCollector');
  const c = new EventCollector(); c.setCollection(true); c.start(task, 1000); return c;
}

module.exports = { environment };
if (require.main === module) (async () => {
  await test('seed is traceable to source and every supplied row is preserved', () => {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, seed.source))).digest('hex');
    assert.equal(hash, seed.sourceHash);
    const original = new DatabaseSync(':memory:');
    original.exec('PRAGMA foreign_keys=OFF'); original.exec(fs.readFileSync(path.join(root, seed.source), 'utf8'));
    const built = new DatabaseSync(':memory:');
    seed.schema.forEach(s => built.exec(s));
    seed.operations.forEach(op => built.prepare(op.sql).run(...op.args));
    for (const item of seed.counts) {
      assert.deepEqual(built.prepare(`SELECT * FROM ${item.table} ORDER BY 1`).all(), original.prepare(`SELECT * FROM ${item.table} ORDER BY 1`).all());
    }
    assert.equal(built.prepare('PRAGMA foreign_key_check').all().length, 0);
    assert.equal(built.prepare('SELECT COUNT(*) n FROM behavior_example WHERE target_question_id IS NOT NULL').get().n, 0);
    original.close(); built.close();
  });
  await test('RDB initializes once under concurrent open; reopen is idempotent; all cursors close', async () => {
    const env = environment(); const { BehaviorEmotionRdb } = env.load('knowledge/BehaviorEmotionRdb');
    const [a, b] = await Promise.all([BehaviorEmotionRdb.open(env.context), BehaviorEmotionRdb.open(env.context)]);
    assert.equal(a, b); assert.equal(env.state.opens, 1);
    const stats = await a.stats();
    assert.equal(stats.patterns, 16); assert.equal(stats.examples, 400); assert.equal(stats.hypotheses, 832);
    assert.ok(stats.emotions > 0); assert.ok(stats.relations > 0);
    env.reload(); await env.load('knowledge/BehaviorEmotionRdb').BehaviorEmotionRdb.open(env.context);
    assert.equal(env.state.commits, 1); assert.equal(env.state.writes, 400); assert.equal(env.state.openResults, 0);
    env.dispose();
  });
  await test('partial import rolls back and a later open retries successfully', async () => {
    const env = environment(); const { BehaviorEmotionRdb } = env.load('knowledge/BehaviorEmotionRdb');
    env.state.failAfter = 18;
    await assert.rejects(BehaviorEmotionRdb.open(env.context), /导入失败/);
    const native = env.store('behavior_emotion_graph.db');
    assert.equal(native.db.prepare('SELECT COUNT(*) n FROM graph_meta').get().n, 0);
    assert.equal(env.state.rollbacks, 1); assert.equal(native.closed, true);
    env.state.failAfter = -1;
    assert.equal((await (await BehaviorEmotionRdb.open(env.context)).stats()).examples, 400);
    env.dispose();
  });
  await test('resource failure retries; corrupt persisted row count fails rather than claiming ready', async () => {
    const env = environment(); const { BehaviorEmotionRdb } = env.load('knowledge/BehaviorEmotionRdb');
    env.state.resourceFailure = true; await assert.rejects(BehaviorEmotionRdb.open(env.context));
    env.state.resourceFailure = false; await BehaviorEmotionRdb.open(env.context);
    env.store('behavior_emotion_graph.db').db.exec('DELETE FROM example_emotion_hypothesis WHERE hypothesis_id=1');
    env.reload(); await assert.rejects(env.load('knowledge/BehaviorEmotionRdb').BehaviorEmotionRdb.open(env.context), /计数/);
    assert.equal(env.state.openResults, 0); env.dispose();
  });
  await test('references keep uncertainty/provenance; parameters cannot inject SQL; legacy model is not inferred', async () => {
    const env = environment(); const graph = await env.load('knowledge/BehaviorEmotionRdb').BehaviorEmotionRdb.open(env.context);
    const refs = await graph.references('repeated_failed'); assert.ok(refs.length);
    for (const r of refs) {
      assert.equal(r.reviewStatus, 'UNVERIFIED'); assert.equal(r.origin, 'behavior_inference');
      assert.ok(['LOW', 'VERY_LOW'].includes(r.strength)); assert.ok(r.sourceId && r.evidence && r.sequence);
    }
    assert.equal((await graph.references("' OR 1=1 --")).length, 0);
    assert.equal((await graph.references('model_bored_only')).length, 0);
    assert.equal(env.state.openResults, 0); env.dispose();
  });
  await test('math RDB also uses the native transaction interface and still imports 48 questions', async () => {
    const env = environment(); const { MathKnowledgeRdb } = env.load('knowledge/MathKnowledgeRdb');
    const math = await MathKnowledgeRdb.open(env.context);
    assert.equal(await math.count('math_question'), 48);
    await MathKnowledgeRdb.open(env.context); assert.equal(env.state.commits, 1);
    assert.equal(env.state.openResults, 0); env.dispose();
  });
  await test('three demo requests stay distinct; split does not diagnose overload', () => {
    const env = environment(); const { BehaviorInterpreter: I } = env.load('knowledge/BehaviorInterpreter');
    for (const [kind, action] of [['hint', 'hint'], ['split', 'split_task'], ['break', 'suggest_break']]) {
      const c = createSession(env); c.request(kind, 2000);
      let result = I.inspect(c.active(), true, 2100); assert.equal(result.action, action);
      assert.equal(result.state, kind === 'break' ? 'SELF_REPORTED_TIRED' : 'UNKNOWN');
      c.acknowledge(c.active().pendingRequestId, 2200);
      assert.equal(I.inspect(c.active(), true, 2300).action, action);
      if (kind === 'break') { c.resume(2400); assert.equal(I.inspect(c.active(), true, 2500).state, 'UNKNOWN'); }
    }
    env.dispose();
  });
  await test('repeated errors suggest asking; success clears failure, ungraded answers and silence stay unknown', () => {
    const env = environment(); const { BehaviorInterpreter: I } = env.load('knowledge/BehaviorInterpreter');
    const c = createSession(env); c.updateDraft('A'); [2000, 3000, 4000].forEach(t => c.submit(t));
    const before = c.serialize(); const r = I.inspect(c.active(), true, 4100);
    assert.equal(r.pattern, 'repeated_failed'); assert.equal(r.action, 'offer_help'); assert.equal(r.state, 'UNKNOWN');
    assert.equal(c.serialize(), before); assert.ok(r.eventIds.every(id => c.active().events.some(e => e.eventId === id)));
    c.updateDraft('B'); c.submit(5000); assert.equal(I.inspect(c.active(), true, 5100).action, 'stay_quiet');
    const free = createSession(env, 'FUNC-FB-0032'); free.updateDraft('未判分'); [2000, 3000, 4000].forEach(t => free.submit(t));
    assert.equal(I.inspect(free.active(), true, 4500).pattern, '');
    assert.equal(I.inspect(createSession(env).active(), true, 300000).state, 'UNKNOWN'); env.dispose();
  });
  await test('consent, incomplete history, future events, age, clear and session boundaries gate inference', () => {
    const env = environment(); const { BehaviorInterpreter: I } = env.load('knowledge/BehaviorInterpreter');
    const c = createSession(env); c.request('break', 2000);
    assert.equal(I.inspect(c.active(), true, 1500).ready, false);
    assert.equal(I.inspect(c.active(), true, 603000).ready, false);
    assert.equal(I.inspect(c.active(), false, 2500).ready, false);
    c.setCollection(false); c.setCollection(true); assert.equal(I.inspect(c.active(), true, 2500).ready, false);
    c.clear(); assert.equal(I.inspect(c.active(), true, 3000).ready, false);
    c.setCollection(true); c.start('FUNC-SC-0193', 4000);
    assert.equal(I.inspect(c.active(), true, 5000).state, 'UNKNOWN'); env.dispose();
  });
  console.log(`${passed}/${passed} behavior graph tests passed (host SQLite + simulated Huawei API; not a device test).`);
})().catch(error => { console.error(error); process.exitCode = 1; });
