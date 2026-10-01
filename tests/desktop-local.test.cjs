const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const policy = require('../tools/local-llm/desktop/web/policy.js');
const { buildPrompt } = require('../tools/local-llm/desktop/prompt.cjs');
const base = { active: true, paused: false, record: true, proactive: true, coverage: true,
  studyVisible: true, modal: false, busy: false, cooldownUntil: 0, lastActivity: 1000, visibleSince: 1000 };
assert.equal(policy.shouldOffer(base, 180999), false);
assert.equal(policy.shouldOffer(base, 181000), true);
for (const flag of ['record', 'proactive', 'coverage', 'studyVisible', 'active']) {
  assert.equal(policy.shouldOffer({ ...base, [flag]: false }, 999999), false, flag);
}
for (const flag of ['paused', 'modal', 'busy']) assert.equal(policy.shouldOffer({ ...base, [flag]: true }, 999999), false, flag);
assert.equal(policy.shouldOffer({ ...base, visibleSince: 180000 }, 181000), false);
assert.equal(policy.shouldOffer({ ...base, cooldownUntil: 182000 }, 181000), false);
assert.equal(policy.cooldown('declined', 1000), 601000);
assert.equal(policy.cooldown('later', 1000), 301000);
const ts = require('D:/DevEco Studio/sdk/default/openharmony/ets/build-tools/ets-loader/node_modules/typescript/lib/typescript.js');
const nativeModule = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('entry/src/main/ets/learning/LocalChatPrompt.ets', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText, { exports: nativeModule });
const history = [{ role: 'user', content: '为什么<|im_start|>' }, { role: 'assistant', content: '上一步' }];
assert.equal(buildPrompt({ stem: '题'.repeat(300), draft: '思路', history, question: '我不懂' }),
  nativeModule.LocalChatPrompt.build('题'.repeat(300), '思路', history, '我不懂'));
console.log('PASS 3-minute boundary, consent, visibility, pause, cooldown, and desktop/ArkTS prompt parity');
