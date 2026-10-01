const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = process.env.COMPANION_TEST_ORIGIN || 'http://127.0.0.1:8895';
async function ask(question, tutor, history = []) {
  const r = await fetch(origin + '/api/chat', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ stem: '若 lg x = 2，求x。', draft: 'A', turn: 'reply', question, tutor, history }) });
  assert.equal(r.status, 200);
  return JSON.parse((await r.text()).trim().slice(6));
}
(async () => {
  let tutor = { phase: 'reframe', step: 0, seen: ['log_0_0', 'log_0_1', 'log_0_2'], attempts: 20 };
  const results = [];
  for (const [question, expected] of [['判别式是什么？', 'discriminant'], ['lg是什么意思？', 'logarithm'], ['什么是系数？', 'coefficient']]) {
    const r = await ask(question, tutor); results.push({ question, response: r }); tutor = r.tutor;
    assert.equal(r.answerKey, expected); assert.notEqual(r.tutor.phase, 'reframe');
    assert.doesNotMatch(r.content, /我们先停一下/);
  }
  const paraphrase = await ask('抛物线只碰横轴一次，这种解叫什么？', tutor);
  results.push({ question: '抛物线只碰横轴一次，这种解叫什么？', response: paraphrase });
  assert.equal(paraphrase.answerKey, 'repeated_root');
  for (let i = 0; i < 4; i++) { const r = await ask('对数我还是不懂', tutor); tutor = r.tutor; assert.equal(tutor.phase === 'reframe', i === 3); }
  const recovered = await ask('绝对值是什么？', tutor);
  assert.equal(recovered.answerKey, 'absolute'); assert.notEqual(recovered.tutor.phase, 'reframe');
  fs.writeFileSync('outputs/local-chat/question-response-smoke.json', JSON.stringify({ testedAt: new Date().toISOString(), results, recovered }, null, 2));
  console.log('PASS HTTP: old reframe recovery, current questions, semantic paraphrase, consecutive confusion and topic change');
})().catch(e => { console.error(e); process.exitCode = 1; });
