'use strict';
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), { test } = require('node:test');
function app(saved) {
  const nodes = new Map(), storage = new Map(saved ? [['zh伴-desktop-v1', saved]] : []);
  const scope = vm.createContext({ matchMedia: () => ({ matches: true }),
    document: { hidden: false, hasFocus: () => true, addEventListener() {}, getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { innerHTML: '', value: '', focus() {}, scrollIntoView() {}, remove() {}, classList: { add() {}, remove() {}, toggle() {} } });
      return nodes.get(id);
    } }, window: { addEventListener() {} },
    CompanionPolicy: require('../tools/local-llm/desktop/web/policy.js'),
    LearningFlow: require('../tools/local-llm/desktop/web/learning-flow.js'),
    TutoringPolicy: require('../tools/local-llm/desktop/web/tutoring-policy.js'),
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    fetch: async url => { if (url === '/api/chat') throw Error('offline test'); return { json: async () => ({ ready: false }) }; },
    setInterval() {}, AbortController, AbortSignal, TextDecoder, alert() {}, confirm: () => true });
  for (const file of ['cognitive-state.js', 'intervention-estimator.js', 'app.js', 'causal-ui.js']) vm.runInContext(fs.readFileSync('tools/local-llm/desktop/web/' + file, 'utf8'), scope);
  return { scope, storage, nodes, run: code => vm.runInContext(code, scope) };
}
test('three actual submit flows record consent, assistance, reload and deletion', async () => {
  for (const [task, answer, skill] of [[0, 'k<1且k≠0', 'joint_conditions'], [1, 'B', 'log_exponent'], [2, '4', 'attainable_maximum']]) {
    const a = app(); a.run(`state.record=true;state.profile=true;start(${task});updateAnswer(${JSON.stringify(answer)})`);
    await a.run('submitAnswer()');
    assert.equal(a.run(`cognitiveBelief().states.${skill}.observations`), 1);
    assert.equal(a.run('state.events.find(e=>e.cognitive).cognitive.assistance'), 'independent');
    assert.equal(a.run('state.cognitiveAssistance'), 'independent', 'a correct answer that ends locally has not received help');
    await a.run('submitAnswer()');
    assert.equal(a.run(`cognitiveBelief().states.${skill}.observations`), 1, 'retry not counted twice');
    a.run("tab('growth')"); assert.match(a.nodes.get('content').innerHTML, /掌握后验|次学习记录/);
    const b = app(a.storage.get('zh伴-desktop-v1'));
    assert.equal(b.run(`cognitiveBelief().states.${skill}.observations`), 1);
    b.run("recordPending=['real-'+state.events.find(e=>e.cognitive).id];deleteLocalRecords()");
    assert.equal(b.run(`cognitiveBelief().states.${skill}.mastery`), null);
    assert.equal(app(b.storage.get('zh伴-desktop-v1')).run(`cognitiveBelief().states.${skill}.mastery`), null);
  }
});
test('disabled recording or profile never captures cognitive evidence', () => {
  for (const flags of ['state.record=true', 'state.profile=true', '']) {
    const a = app(); a.run(flags + ";start(1);state.answer='B';cognitiveRecord('answer')");
    assert.equal(a.run('state.events.filter(e=>e.cognitive).length'), 0);
  }
});
test('partially observed sessions do not become independent evidence after enabling collection', () => {
  const a = app(); a.run("start(1);toggleSetting('record',true);toggleSetting('profile',true);state.answer='B';cognitiveRecord('answer')");
  assert.equal(a.run('state.events.filter(e=>e.cognitive).length'), 0);
});
test('unknown open answers and uncalibrated explanations do not update subskills', async () => {
  const a = app(); a.run("state.record=true;state.profile=true;start(2);state.answer='应该先看距离'"); await a.run('submitAnswer()');
  assert.equal(a.run('cognitiveBelief().states.attainable_maximum.mastery'), null);
  a.run("cognitiveRecord('explanation',{question:'绝对值是两点之间的距离',tutor:{step:0}},{verdict:'understood',source:'model-semantic'})");
  assert.equal(a.run('cognitiveBelief().states.absolute_distance.mastery'), null);
});
test('correction and full clear revoke derived state', async () => {
  const a = app(); a.run("state.record=true;state.profile=true;start(1);state.answer='B'"); await a.run('submitAnswer()');
  a.run('retractCognitive(state.events.find(e=>e.cognitive).id)');
  assert.equal(a.run('cognitiveBelief().states.log_exponent.mastery'), null);
  a.run('clearRecords()'); assert.equal(a.run('state.events.length'), 0);
  assert.equal(a.run('cognitiveBelief().evidenceIds.length'), 0);
});
test('legacy active session and revisit do not pretend to be independent', () => {
  const a = app(JSON.stringify({ version: 1, task: 1, active: true, record: true, profile: true, events: [{ id: 'old', type: 'answer_correct', time: 1, task: 1 }] }));
  a.run("state.answer='B';cognitiveRecord('answer')"); assert.equal(a.run('cognitiveBelief().states.log_exponent.mastery'), null);
  a.run("finishStudy();start(1);state.answer='B';cognitiveRecord('answer')");
  assert.equal(a.run('state.cognitiveAssistance'), 'unknown'); assert.equal(a.run('cognitiveBelief().states.log_exponent.mastery'), null);
});

test('habit facts survive reload, deduplicate and recalculate after deletion', () => {
  const a = app();
  a.run("state.record=true;state.profile=true;start(1);event('answer_correct');event('help_requested');event('split_requested');rest();resumeStudy();finishStudy()");
  const h = a.run('habitSummary()');
  for (const key of ['sessions', 'ended', 'days', 'submissions', 'hints', 'splits', 'pauses', 'returns']) assert.equal(h[key], 1, key);
  const b = app(a.storage.get('zh伴-desktop-v1'));
  assert.equal(b.run('habitSummary().submissions'), 1);
  b.run("state.events.push({...state.events.find(e=>e.type==='answer_correct')})");
  assert.equal(b.run('habitSummary().submissions'), 1);
  b.run("recordPending=['real-'+state.events.find(e=>e.type==='answer_correct').id];deleteLocalRecords()");
  assert.equal(b.run('habitSummary().submissions'), 0);
  b.run('clearRecords()');
  assert.equal(b.run('habitSummary().evidenceIds.length'), 0);
});

test('legacy and partially authorized habit sessions explain missing data without inventing counts', () => {
  const a = app(JSON.stringify({ version: 1, task: 1, active: true, record: true, profile: true,
    events: [{ id: 'old', type: 'answer_correct', time: Date.now(), task: 1 }] }));
  assert.equal(a.run('habitSummary().submissions'), 0);
  assert.match(a.run('renderHabits()'), /1 条记录/);
  assert.match(a.run('renderHabits()'), /先结束本轮/);
  assert.match(a.run('renderCognitive()'), /查看学习过程/);
  assert.equal(a.run('cognitiveBelief().evidenceIds.length'),0,'display records do not invent authorized observations');
  a.run("finishStudy();start(1);event('help_requested');toggleSetting('profile',false);toggleSetting('profile',true);event('help_requested')");
  assert.equal(a.run('habitSummary().hints'), 1);
});

test('all three causal practice pages preserve consent, posttest, reload and removal', () => {
  for (const [topic, choice] of [['quadratic',1],['log',2],['maximum',2]]) {
    const a=app(); a.run(`selectCausalTopic('${topic}');startCausalPractice('concept_check')`);
    assert.equal(a.run('state.events.filter(e=>e.causal).length'),0);
    a.run("state.record=true;state.profile=true;startCausalPractice('concept_check');revealCausalPosttest()");
    a.run(`el('causal-answer').value='${choice}';el('causal-independent').checked=true;completeCausalPractice()`);
    assert.equal(a.run('causalRows()[0].outcome.y'),1);
    assert.equal(a.run('causalRows()[0].propensity'),null);
    a.run('runCausalSimulation()');
    assert.equal(a.run('state.events.length'),1,'simulation never persists');
    const b=app(a.storage.get('zh伴-desktop-v1'));
    b.run(`selectCausalTopic('${topic}');startCausalPractice('step_hint');revealCausalPosttest()`);
    b.run(`el('causal-answer').value='${choice}';el('causal-independent').checked=true;completeCausalPractice()`);
    assert.equal(b.run('causalRows()[1].outcome.missingReason'),'repeat_posttest');
    b.run("recordPending=state.events.filter(e=>e.causal).map(e=>'real-'+e.id);deleteLocalRecords()");
    assert.equal(b.run('causalRows().length'),0);
    assert.equal(app(b.storage.get('zh伴-desktop-v1')).run('causalRows().length'),0);
  }
});
test('revoking recording closes pending causal posttest as unknown', () => {
  const a=app(); a.run("state.record=true;state.profile=true;startCausalPractice('step_hint');toggleSetting('record',false);toggleSetting('record',true)");
  assert.equal(a.run('causalRows()[0].outcome.missingReason'),'consent_revoked');
  assert.equal(a.run('causalPending()'),undefined);
});
