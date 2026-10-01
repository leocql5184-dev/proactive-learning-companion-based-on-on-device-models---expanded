const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const policy = require('../tools/local-llm/desktop/web/policy.js');
let now = 1000;
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
const nodes = new Map(), storage = new Map(), callbacks = [];
const timeouts = new Map(); let timeoutId = 0;
const advance = ms => { now += ms; for (const [id, timer] of [...timeouts]) if (timer.due <= now) { timeouts.delete(id); timer.fn(); } };
const document = { hidden: false, hasFocus: () => true, addEventListener() {}, getElementById(id) {
  if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', value: '', focus() { this.focused = true; }, scrollIntoView(options) { this.scroll = options; }, remove() { this.removed = true; }, classList: { add() {}, remove() {}, toggle() {} } });
  return nodes.get(id);
} };
const scope = vm.createContext({ matchMedia: () => ({ matches: false }), document, Date: Clock, CompanionPolicy: policy,
  LearningFlow: require('../tools/local-llm/desktop/web/learning-flow.js'),
  TutoringPolicy: require('../tools/local-llm/desktop/web/tutoring-policy.js'), window: { addEventListener() {} },
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  fetch: async () => ({ json: async () => ({ ready: true, status: 'ready' }) }),
  setInterval: fn => callbacks.push(fn), setTimeout: (fn, ms) => { const id = ++timeoutId; timeouts.set(id, { fn, due: now + ms }); return id; },
  clearTimeout: id => timeouts.delete(id), AbortController, AbortSignal, TextDecoder, alert() {}, confirm: () => true });
vm.runInContext(fs.readFileSync('tools/local-llm/desktop/web/app.js', 'utf8'), scope);
const run = code => vm.runInContext(code, scope);
(async () => {
const reviewed = JSON.parse(run('JSON.stringify(reviewedCatalog)'));
const sourceItems = fs.readFileSync('data/knowledge_graph/fixed60/adjudicated-kept48.jsonl', 'utf8').trim().split(/\r?\n/).map(JSON.parse);
assert.equal(reviewed.length, 48);
assert.equal(new Set(reviewed.map(item => item.id)).size, 48);
for (const source of sourceItems) {
  const item = reviewed.find(row => row.id === source.canonical_item_id);
  assert.ok(item, source.canonical_item_id);
  assert.equal(item.stem, source.item.stem);
  assert.deepEqual(item.options, source.item.options);
  assert.ok(['keep', 'edited_keep'].includes(source.adjudicated_fields.item_action));
}
assert.deepEqual(reviewed.filter(item => item.core >= 0).sort((a,b) => a.core-b.core).map(item => item.id), ['FUNC-FB-0032', 'FUNC-SC-0193', 'FUNC-SA-0139']);
assert.equal(run('tasks.length'), 48);
const catalogHtml = run('renderCatalog()');
assert.equal((catalogHtml.match(/class="catalog-question"/g) || []).length, 48);
assert.equal((catalogHtml.match(/class="catalog-chapter"/g) || []).length, 7);
assert.doesNotMatch(catalogHtml, /先把这三道想明白|从条件判断|核心学习主线|含上方 3 道/);
const chapterTitles = [...catalogHtml.matchAll(/class="chapter-number">(\d+)<\/span><span>([^<]+)<\/span>/g)];
assert.equal(chapterTitles[0][2], '条件、概念与推理');
assert.match(catalogHtml, /条件、概念与推理<\/span><small>3 题/);
assert.equal(chapterTitles[1][1], '02');
assert.equal(chapterTitles[1][2], '函数基础与表示');
assert.equal((catalogHtml.match(/和学伴一起练这道题/g) || []).length, 48);
assert.doesNotMatch(catalogHtml, /查看参考答案/);
assert.doesNotMatch(catalogHtml, /第二阶段|\\frac|\\log|\\ln/);
assert.match(run("catalogMath('<script>')"), /&lt;script&gt;/);
run("openWork('settings');toggleSetting('record',true);toggleSetting('proactive',true);start(0);updateAnswer('草稿内容');");
now = 180999; callbacks[0](); assert.equal(run('modal'), false);
now = 181000; callbacks[0](); assert.equal(run('modal'), true);
run("closeModal('declined');tab('catalog');start(0)"); assert.equal(run('state.answer'), '草稿内容');
assert.equal(run('state.cooldownUntil'), 781000);
run('rest()'); now += 900000; callbacks[0](); assert.equal(run('modal'), false);
run("resumeStudy();toggleSetting('record',false)"); now += 180000; callbacks[0](); assert.equal(run('modal'), false);
run("toggleSetting('record',true)"); now += 180000; callbacks[0](); assert.equal(run('modal'), false);
await run("finishStudy();start(1);updateAnswer('B');submitAnswer()");
assert.match(run('state.result'), /你做对了/);
assert.equal(run('CompanionPolicy.shouldOffer({active:true,tutor:state.tutor,record:true,proactive:true,coverage:true,studyVisible:true,cooldownUntil:0,lastActivity:0,visibleSince:0},999999)'), false);
assert.match(nodes.get('content').innerHTML, /answer-feedback correct/);
assert.equal(nodes.get('answer-feedback').scroll.behavior, 'smooth');
assert.equal(nodes.get('answer-feedback').focused, true);
for (const [answer, explanation] of [['A', '真数'], ['C', '符号相反'], ['D', '自然对数']]) {
  await run('updateAnswer(' + JSON.stringify(answer) + ');submitAnswer()');
  assert.match(nodes.get('content').innerHTML, /这次答案不正确/);
  assert.ok(nodes.get('content').innerHTML.includes(explanation));
}
run('editSubmittedAnswer()'); assert.equal(nodes.get('study-answer').focused, true);
run("updateAnswer('')"); assert.equal(nodes.get('answer-feedback').removed, true);
await run('submitAnswer()'); assert.match(nodes.get('content').innerHTML, /先写下你的想法/);
assert.doesNotMatch(nodes.get('content').innerHTML, /id="submission-hint"/);
assert.ok(JSON.parse(storage.get('zh伴-desktop-v1')).events.some(e => e.type === 'answer_correct'));
run("tab('growth');toggleSetting('profile',true);reportFeeling('有点累')"); assert.equal(run('offer'), 'rest');
run("closeModal('later');reportFeeling('有点累')"); assert.equal(run('modal'), false);
run("clearRecords()"); assert.equal(run('state.active'), false); assert.equal(run('state.events.length'), 0);
// Draft care is driven by input alone and waits exactly five seconds.
for (const task of [0, 1, 2, 3, 47]) {
  run(`start(${task});openChat();updateChatDraft('好难啊，不想做了');document.getElementById('chat-input').value='好难啊，不想做了'`);
  assert.equal(run('modal'), false);
  advance(4999); assert.equal(run('modal'), false);
  advance(1); assert.equal(run('modal'), true, `task ${task}: unsent input opens care after five seconds`);
  assert.equal(run('messages.length'), 0);
  assert.equal(run('chatInput'), '好难啊，不想做了');
  run("closeModal('later');finishStudy()");
}
run("openChat();updateChatDraft('好难啊，不想做了');document.getElementById('chat-input').value='好难啊，不想做了'");
advance(5000); assert.equal(run('modal'), true, 'chat without an active exercise also responds to unsent input');
run("closeModal('later');updateChatDraft('先看看');document.getElementById('chat-input').value='先看看'");
for (const text of ['B', '我不觉得好难啊', '我不想放弃了', '他说不想做了']) {
  run(`updateChatDraft(${JSON.stringify(text)});document.getElementById('chat-input').value=${JSON.stringify(text)}`);
  advance(5000); assert.equal(run('modal'), false);
}
run("updateChatDraft('好难啊',true);document.getElementById('chat-input').value='好难啊'");
advance(5000); assert.equal(run('modal'), false, 'unfinished IME does not trigger');
run("updateChatDraft('好难啊')");
advance(4999); assert.equal(run('modal'), false);
advance(1); assert.equal(run('modal'), true, 'composition completion starts the five-second delay');
run("closeModal('later');updateChatDraft('不想做了');document.getElementById('chat-input').value='不想做了';tab('growth')");
advance(5000); assert.equal(run('modal'), false, 'leaving chat cancels the pending popup');
console.log('PASS five-second unsent care: catalog coverage, standalone chat, IME, negation, preserved input, navigation');
run("navigationHistory.length=0;showHome();openWork('growth');document.getElementById('content').scrollTop=240;openLocalRecords('emotion')");
assert.equal(run('current'),'records');
run('goBack()');assert.equal(run('current'),'growth');assert.equal(nodes.get('content').scrollTop,240);
run('goBack()');assert.equal(run('workVisible'),false,'growth returns to home only after its child is popped');
run("openWork('growth');tab('causal');openLocalRecords('help');goBack()");
assert.equal(run('current'),'causal','records return to their actual source page');
run('goBack()');assert.equal(run('current'),'growth');
run("tab('study');openChat();goBack()");assert.equal(run('current'),'study','chat returns to study');
run("tab('catalog');tab('study');goBack()");assert.equal(run('catalog'),true,'catalog remains distinct from study');
run("openLocalRecords('emotion');restoreStudentDemoRecords();recordPage=1;document.getElementById('content').scrollTop=180;tab('growth');goBack()");
assert.equal(run('current'),'records');assert.equal(run('recordFilter'),'emotion');assert.equal(run('recordPage'),1);
assert.equal(nodes.get('content').scrollTop,180);
const depth=run('navigationHistory.length');run("tab('records')");assert.equal(run('navigationHistory.length'),depth,'same page does not duplicate history');
console.log('PASS previous-page navigation: nested records, growth, causal, chat, catalog, filters, pages and scroll');
console.log('PASS actual UI state: 3-minute trigger, decline cooldown, draft preservation, pause, consent coverage, scoring, rest cooldown, clear');
})().catch(error => { console.error(error); process.exitCode = 1; });
