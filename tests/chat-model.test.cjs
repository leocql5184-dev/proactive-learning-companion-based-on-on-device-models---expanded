// Runs the actual pure model from this HarmonyOS project, not a parallel implementation.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('D:/DevEco Studio/sdk/default/openharmony/ets/build-tools/ets-loader/node_modules/typescript/lib/typescript.js');
const sourceFile = path.resolve(process.argv[2] || 'D:/harmonylearningcompanion/entry/src/main/ets/model/ChatModel.ets');
const source = fs.readFileSync(sourceFile, 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: 'ChatModel.ts' });
const context = { exports: {}, Date, JSON, Array };
vm.runInNewContext(compiled.outputText, context);
const { ChatModel } = context.exports;
let passed = 0;
function test(name, run) { run(); passed++; console.log('PASS ' + name); }
test('empty input does not create a conversation', () => {
  const model = new ChatModel(); assert.equal(model.send('  '), false); assert.equal(model.state.conversations.length, 0);
});
test('first message creates and titles a conversation, with a labeled prototype response', () => {
  const model = new ChatModel(); model.send('一道数学题'); const thread = model.active();
  assert.equal(thread.title, '一道数学题'); assert.equal(thread.messages.length, 2);
  assert.equal(thread.messages[0].role, 'user'); assert.match(thread.messages[1].text, /固定的界面示例/);
});
test('multiple conversations retain independent histories and drafts', () => {
  const model = new ChatModel(); model.send('第一题'); const firstId = model.state.activeId;
  model.setDraft('还没有发出的补充'); model.newConversation(); model.send('第二题'); const secondId = model.state.activeId;
  assert.notEqual(firstId, secondId); model.select(firstId);
  assert.equal(model.active().messages[0].text, '第一题'); assert.equal(model.active().draft, '还没有发出的补充');
  model.select(secondId); assert.equal(model.active().messages[0].text, '第二题');
});
test('project creation rejects blank names and groups new conversations', () => {
  const model = new ChatModel(); assert.equal(model.createProject(' '), undefined);
  const project = model.createProject(' 数学学习 '); assert.equal(project.name, '数学学习');
  model.send('项目中的问题'); assert.equal(model.active().projectId, project.id);
});
test('switching projects does not move existing conversations', () => {
  const model = new ChatModel(); const a = model.createProject('A'); model.send('A的问题');
  const b = model.createProject('B'); model.send('B的问题');
  assert.equal(model.state.conversations.filter(t => t.projectId === a.id).length, 1);
  assert.equal(model.state.conversations.filter(t => t.projectId === b.id).length, 1);
});
test('rename and explicit move preserve messages', () => {
  const model = new ChatModel(); model.send('原来的问题'); const id = model.state.activeId;
  const project = model.createProject('几何'); model.select(id); model.rename(id, ' 三角形 '); model.move(id, project.id);
  assert.equal(model.active().title, '三角形'); assert.equal(model.active().projectId, project.id);
  assert.equal(model.active().messages[0].text, '原来的问题');
});
test('delete removes only the selected conversation and survives serialization', () => {
  const model = new ChatModel(); model.send('删除这一条'); const id = model.state.activeId;
  model.newConversation(); model.send('保留这一条'); model.remove(id);
  const restored = new ChatModel(); assert.equal(restored.restore(model.serialize()), true);
  assert.equal(restored.state.conversations.length, 1); assert.equal(restored.active().messages[0].text, '保留这一条');
});
test('round-trip restores projects, selected conversation, draft and dark mode', () => {
  const model = new ChatModel(); model.createProject('代数'); model.send('因式分解'); model.setDraft('待发送'); model.state.dark = true;
  const restored = new ChatModel(); assert.equal(restored.restore(model.serialize()), true);
  assert.equal(restored.serialize(), model.serialize());
});
test('invalid history does not replace a valid current state', () => {
  const model = new ChatModel(); model.send('有效数据'); const before = model.serialize();
  for (const value of ['null', '{broken', '{}', '{"version":2}', '{"version":1,"conversations":[null],"projects":[]}']) {
    assert.equal(model.restore(value), false); assert.equal(model.serialize(), before);
  }
});
test('message and conversation identifiers are unique during rapid input', () => {
  const model = new ChatModel(); for (let i = 0; i < 50; i++) { model.newConversation(); model.send('问题' + i); }
  const ids = model.state.conversations.flatMap(t => [t.id, ...t.messages.map(m => m.id)]);
  assert.equal(new Set(ids).size, ids.length);
});
console.log(`${passed}/10 tests passed. Model source: ${sourceFile}`);
