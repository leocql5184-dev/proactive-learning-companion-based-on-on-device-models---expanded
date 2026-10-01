'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = process.env.COMPANION_TEST_ORIGIN || 'http://127.0.0.1:8875';
const backend = process.env.TEST_BACKEND || 'gguf';
async function post(route, input) {
  const started = performance.now();
  const response = await fetch(origin + route, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(input), signal: AbortSignal.timeout(55000) });
  assert.equal(response.status, 200);
  const text = await response.text();
  return { packet: JSON.parse(route === '/api/chat' ? text.trim().slice(6) : text), milliseconds: Math.round(performance.now() - started) };
}
(async () => {
  let health;
  for (let attempt = 0; attempt < 90; attempt++) {
    health = await (await fetch(origin + '/api/health')).json();
    assert.equal(health.backend, backend);
    if (health.ready) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.equal(health.ready, true); assert.equal(health.appVersion, 'hcl-desktop-v2');
  const chat = await post('/api/chat', { question: '两个解重合在一起是什么意思', stem: '', draft: '', history: [] });
  assert.equal(chat.packet.backend, backend); assert.equal(chat.packet.inference, backend);
  assert.equal(chat.packet.answerKey, 'repeated_root');
  const evidence = await post('/api/active-evidence', { task: 1, text: '10²=x', consent: true, features: {} });
  assert.equal(evidence.packet.neural.status, 'quoted_candidates');
  assert.equal(evidence.packet.neural.claims[0].quote, '10²=x');
  assert.ok(evidence.packet.neural.modelVersion.startsWith(backend + '/'));
  assert.equal(evidence.packet.trained.status, 'inferred');
  const report = { status: 'passed', testedAt: new Date().toISOString(), health, chat, evidence };
  fs.writeFileSync('outputs/local-chat/dual-backend-' + backend + '.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ backend, status: report.status, chatMs: chat.milliseconds, evidenceMs: evidence.milliseconds }));
})().catch(error => { console.error(error); process.exitCode = 1; });
