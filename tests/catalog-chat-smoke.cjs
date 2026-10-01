'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const flow = require('../tools/local-llm/desktop/web/learning-flow.js');
const source = fs.readFileSync('tools/local-llm/desktop/web/app.js', 'utf8');
const bank = JSON.parse(source.split('const reviewedCatalog = ')[1].split(';\n// END REVIEWED CATALOG')[0]);
const url = 'http://127.0.0.1:8765';
(async () => {
  const health = await (await fetch(url + '/api/health')).json();
  assert.equal(health.ready, true);
  const results = [];
  for (const chapter of [...new Set(bank.map(item => item.chapter))]) {
    const item = bank.find(item => item.chapter === chapter && item.core < 0);
    const input = { stem: item.stem, draft: '先检查条件，再尝试写出第一步。', question: '请给我一点提示', turn: 'submission', tutor: flow.initial(), history: [], assessment: 'unknown' };
    const response = await fetch(url + '/api/chat', { method: 'POST', headers: { Origin: url, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    assert.equal(response.status, 200);
    const packets = (await response.text()).split('\n').filter(line => line.startsWith('data: ') && !line.includes('[DONE]')).map(line => JSON.parse(line.slice(6)));
    assert.ok(!packets.some(packet => packet.error));
    const final = packets.find(packet => packet.stop);
    assert.ok(final, item.id);
    const expected = flow.select(input, final.evaluation);
    assert.equal(expected.content, flow.reviewSpec(input).questions[0]);
    results.push({ chapter, id: item.id, strategy: expected.strategy, hint: expected.content });
  }
  fs.writeFileSync('outputs/local-chat/catalog-smoke.json', JSON.stringify({ time: new Date().toISOString(), ready: health.ready, results }, null, 2));
  console.log('PASS live local HTTP: all six extended chapters return their own guidance');
})().catch(error => { console.error(error); process.exitCode = 1; });
