const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const policy = require('../tools/local-llm/desktop/web/policy.js');
let now = 1000;
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
const nodes = new Map(), storage = new Map(), callbacks = [];
const timers = new Map(); let timerId = 0;
const document = { hidden: false, hasFocus: () => true, addEventListener() {}, getElementById(id) {
  if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', value: '', focus() { this.focused = true; }, scrollIntoView(options) { this.scroll = options; }, remove() { this.removed = true; }, classList: { add() {}, remove() {}, toggle() {} } });
  return nodes.get(id);
} };
const scope = vm.createContext({ matchMedia: () => ({ matches: false }), document, Date: Clock, CompanionPolicy: policy,
  LearningFlow: require('../tools/local-llm/desktop/web/learning-flow.js'),
  TutoringPolicy: require('../tools/local-llm/desktop/web/tutoring-policy.js'), window: { addEventListener() {} },
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  fetch: async () => ({ json: async () => ({ ready: true, status: 'ready' }) }),
  setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
  setInterval: fn => callbacks.push(fn), AbortController, AbortSignal, TextDecoder, alert() {}, confirm: () => true });
vm.runInContext(fs.readFileSync('tools/local-llm/desktop/web/app.js', 'utf8'), scope);
const run = code => vm.runInContext(code, scope);

run('openLocalRecords()');
assert.equal(run('state.demoRecords.length'),150);
assert.equal(run('new Set(state.demoRecords.map(r=>r.id)).size'),150);
for(const [kind,total] of [['study',48],['emotion',27],['habit',27]]) assert.equal(run('state.demoRecords.filter(r=>r.category==='+JSON.stringify(kind)+').length'),total);
assert.equal(run('state.events.length'),0);
assert.equal(run('state.demoRecords.every(r=>reviewedCatalog.some(q=>q.id===r.questionId))'),true);
assert.equal((nodes.get('content').innerHTML.match(/class="record-row"/g)||[]).length,20);
assert.match(nodes.get('content').innerHTML, /把每一步留下，由你决定保留，只在当前设备离线保存。/);
assert.doesNotMatch(nodes.get('content').innerHTML, /record-toolbar|删除此条|演示内容不参与|数据仅保存在当前浏览器/);
run('toggleRecordSelection()');
assert.match(nodes.get('content').innerHTML, /record-toolbar/);
run("selectLocalRecord('demo-001',true);pageLocalRecords(1)");
assert.equal(run('recordSelection.size'),1);
run('toggleRecordSelection()');
assert.equal(run('recordSelection.size'),0);
run("beginRecordPress({button:0,clientX:0,clientY:0,target:{closest:()=>null}},'demo-001');moveRecordPress({clientX:20,clientY:0})");
assert.equal(timers.size,0);
run("beginRecordPress({button:0,clientX:0,clientY:0,target:{closest:()=>null}},'demo-001');cancelRecordPress()");
assert.equal(timers.size,0);
run("beginRecordPress({button:0,clientX:0,clientY:0,target:{closest:()=>null}},'demo-001')");
const longPress = [...timers.values()][0]; timers.clear(); longPress();
assert.equal(run('recordMenu'),'demo-001');
assert.match(nodes.get('content').innerHTML,/删除记录/);
assert.equal(run('recordPending.length'),0);
run('closeRecordMenu();toggleRecordSelection()');
run("beginRecordPress({button:0,clientX:0,clientY:0,target:{closest:()=>null}},'demo-001')");
assert.equal(timers.size,0);
run('toggleRecordSelection()');
run("selectLocalRecord('demo-001',true);pageLocalRecords(1)");
assert.equal(run('recordSelection.size'),1);
run("askDeleteLocalRecords('demo-001');cancelDeleteLocalRecords()");
assert.equal(run('state.demoRecords.length'),150);
run("askDeleteLocalRecords('demo-001');deleteLocalRecords()");
assert.equal(run('state.demoRecords.length'),149);
run('openLocalRecords()');assert.equal(run('state.demoRecords.length'),149);
run("filterLocalRecords('emotion');selectAllLocalRecords(true)");assert.equal(run('recordSelection.size'),27);
run('askDeleteLocalRecords();deleteLocalRecords()');assert.equal(run('state.demoRecords.length'),122);
const stored=JSON.parse(storage.get('zh伴-desktop-v1'));assert.equal(stored.demoRecords.length,122);assert.equal(stored.recordsSeeded,true);
// Actual events are independently removable and progress/settings remain intact.
run("state.record=true;state.active=true;state.answer='保留草稿';event('feeling','有点累');openLocalRecords()");
assert.equal(run('localRecordRows().filter(r=>!r.demo).length'),1);
run("askDeleteLocalRecords('real-'+state.events[0].id);deleteLocalRecords()");
assert.equal(run('state.events.length'),0);assert.equal(run('state.answer'),'保留草稿');assert.equal(run('state.record'),true);
// A failed write must not claim deletion or change memory.
const originalWrite=scope.localStorage.setItem;
scope.localStorage.setItem=()=>{throw Error('quota');};
run("askDeleteLocalRecords('demo-002');deleteLocalRecords()");assert.equal(run('state.demoRecords.length'),122);assert.match(run('recordNotice'),/失败/);
scope.localStorage.setItem=originalWrite;
run("cancelDeleteLocalRecords();filterLocalRecords('all');selectAllLocalRecords(true);askDeleteLocalRecords();deleteLocalRecords()");
assert.equal(run('state.demoRecords.length'),0);
run('openLocalRecords()');assert.equal(run('state.demoRecords.length'),0);
// Re-evaluate full application against saved storage to verify reload persistence.
vm.runInContext('(function(){'+fs.readFileSync('tools/local-llm/desktop/web/app.js','utf8')+';openLocalRecords();if(state.demoRecords.length!==0)throw Error("reseeded");})()',scope);
run('clearRecords();openLocalRecords()');assert.equal(run('state.demoRecords.length'),0);
run("start(47);updateAnswer('最后一题的推导草稿')");
vm.runInContext('(function(){' + fs.readFileSync('tools/local-llm/desktop/web/app.js', 'utf8') + ';if(state.task!==47||state.answer!=="最后一题的推导草稿"||!state.active)throw Error("extended task restore failed");})()', scope);
run('openLocalRecords();restoreStudentDemoRecords()');
assert.equal(run('state.demoRecords.length'),150);
for (const kind of ['study','emotion','habit','help','companion']) {
  assert.ok(run(`state.demoRecords.filter(r=>r.category==='${kind}').length`)>=20,kind);
}
assert.equal(run('state.demoRecords.every(r=>{const h=new Date(r.time).getHours();return h>=14&&h<=19})'),true);
assert.equal(run('new Set(state.demoRecords.map(r=>r.id)).size'),150);
run('restoreStudentDemoRecords()');assert.equal(run('state.demoRecords.length'),150,'restore is idempotent');
vm.runInContext('(function(){'+fs.readFileSync('tools/local-llm/desktop/web/app.js','utf8')+';if(state.demoRecords.length!==150)throw Error("support records lost on reload");})()',scope);
run("openLocalRecords('help')");assert.equal(run('filteredRecordRows().length'),24);
assert.match(run("recordCategoryPanel('companion','学伴陪伴记录')"),/24 条/);
run('selectAllLocalRecords(true);askDeleteLocalRecords();deleteLocalRecords()');
assert.equal(run("state.demoRecords.filter(r=>r.category==='help').length"),0);
run("openLocalRecords('help')");assert.equal(run('filteredRecordRows().length'),0,'deletion does not automatically refill');
scope.CognitiveState = require('../tools/local-llm/desktop/web/cognitive-state.js');
run('state.profile=true');
assert.equal(run('state.demoRecords.filter(r=>r.knowledge).length'),35);
assert.deepEqual(JSON.parse(run("JSON.stringify(['quadratic_definition','discriminant','joint_conditions','log_exponent','absolute_distance','piecewise_extrema','attainable_maximum'].map(id=>state.demoRecords.filter(r=>r.knowledge?.skillId===id).length))")),[4,5,3,11,5,3,4]);
assert.equal(run('new Set(state.demoRecords.filter(r=>r.knowledge).map(r=>r.knowledge.skillId)).size'),7);
const knowledgeHtml=run('renderCognitive()');
assert.doesNotMatch(knowledgeHtml,/待了解|模拟|虚假/);
assert.match(knowledgeHtml,/基本理解/);
assert.match(knowledgeHtml,/仍需检查边界/);
assert.equal(run('cognitiveBelief().evidenceIds.length'),0,'authored records do not become real model evidence');
run("askDeleteLocalRecords('demo-001');deleteLocalRecords()");
assert.equal(run("state.demoRecords.filter(r=>r.knowledge?.skillId==='quadratic_definition').length"),3);
console.log('PASS records and knowledge: varied counts 4/5/3/11/5/3/4, real evidence isolation, deletion and persistence');
