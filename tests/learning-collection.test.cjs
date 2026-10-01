// Execute the actual ArkTS domain modules using the installed SDK compiler.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('D:/DevEco Studio/sdk/default/openharmony/ets/build-tools/ets-loader/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'entry/src/main/ets/learning');
const cache = new Map();
const disk = new Map();
let failDisk = '';
const fileIo = {
  OpenMode: { CREATE: 1, WRITE_ONLY: 2, TRUNC: 4 },
  accessSync: p => disk.has(p), readTextSync: p => disk.get(p),
  openSync: p => { disk.set(p, ''); return { fd: p }; },
  writeSync: (p, value) => { if (failDisk === 'write') throw Error('write'); disk.set(p, value); },
  fsyncSync: () => { if (failDisk === 'flush') throw Error('flush'); }, closeSync: () => {},
  renameSync: (from, to) => { if (failDisk === 'rename') throw Error('rename'); disk.set(to, disk.get(from)); disk.delete(from); },
  unlinkSync: p => disk.delete(p)
};
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const text = fs.readFileSync(path.join(source, name + '.ets'), 'utf8');
  const compiled = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const exports = {};
  vm.runInNewContext(compiled.outputText, { exports, require: dep => dep === '@kit.CoreFileKit' ? { fileIo } : load(dep.replace('./', '')),
    Date, Math, JSON, Array, Number, Error, String, Boolean }, { filename: name + '.ets' });
  cache.set(name, exports); return exports;
}
const { EventCollector } = load('EventCollector');
const { FeatureBuilder, FEATURE_ORDER } = load('FeatureBuilder');
const { ModelInputAdapter } = load('ModelInputAdapter');
const { LearningRepository } = load('LearningRepository');
const { LearningFileStore } = load('LearningFileStore');
const { ProactivePolicy } = load('ProactivePolicy');
const { CompanionGuidance } = load('CompanionGuidance');
const plain = value => JSON.parse(JSON.stringify(value));
const make = (id = 'FUNC-SC-0193') => { const c = new EventCollector(); c.setCollection(true); c.start(id, 1000); return c; };
const features = (c, time) => FeatureBuilder.build(c.active(), time, c.state.collectionEnabled);
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }

test('consent defaults off; basic work and progress still function without events', () => {
  const c = new EventCollector(); c.start('FUNC-SC-0193', 1000); c.updateDraft('B'); c.submit(2000);
  assert.equal(c.active().events.length, 0); assert.match(c.active().lastResult, /正确/);
  const s = features(c, 2000); assert.equal(s.ready, false); assert.throws(() => ModelInputAdapter.fromSnapshot(s, 'action'));
});
test('feature order exactly matches the frozen training contract', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(root, 'outputs/guidance-model-v2/data/feature_schema.json'), 'utf8'));
  assert.deepEqual(plain(FEATURE_ORDER), schema.feature_order);
});
test('only app operations affect timing; future events are excluded', () => {
  const c = make(); c.updateDraft('A'); c.submit(2000); c.updateDraft('C'); c.submit(4000); c.updateDraft('B'); c.submit(8000);
  let s = features(c, 5000);
  assert.deepEqual(plain(s.values.slice(0, 13)), [2,2,0,0,2,1,1000,4000,3000,2000,2000,null,1]);
  assert.equal(s.eventIds.length, 3);
  s = features(c, 9000);
  assert.deepEqual(plain(s.values.slice(0, 13)), [3,2,1,0,0,2,1000,8000,7000,4000,3000,null,2/3]);
  assert.equal(s.values[28], null); assert.equal(s.values[26], null);
});
test('hint request captures depth; display counts exactly once and clears pending request', () => {
  const c = make(); c.request('hint', 2000, 2); const id = c.active().pendingRequestId;
  c.request('hint', 2000, 2);
  assert.equal(c.active().events.length, 2);
  let s = features(c, 2100); assert.equal(s.values[13], 1); assert.equal(s.values[14], 2); assert.equal(s.values[3], 0);
  c.acknowledge('wrong-id', 2200); assert.equal(c.active().events.length, 2);
  c.acknowledge(id, 3000); c.acknowledge(id, 3000);
  s = features(c, 4000);
  assert.equal(s.values[3], 1); assert.equal(s.values[13], 0); assert.equal(s.values[14], null);
  assert.equal(s.values[11], 1000); assert.equal(s.values[5], 3); assert.equal(c.active().events.length, 3);
});
test('a hint and a request break the consecutive-error suffix', () => {
  const c = make(); c.updateDraft('A'); c.submit(2000); c.submit(3000); c.request('hint', 4000);
  assert.equal(features(c, 4000).values[4], 0);
  c.acknowledge(c.active().pendingRequestId, 4500); c.submit(5000);
  assert.equal(features(c, 5000).values[4], 1);
});
test('split is a request, not a fake observed hint', () => {
  const c = make(); c.request('split', 2000);
  assert.equal(features(c, 2000).values[19], 1);
  c.acknowledge(c.active().pendingRequestId, 3000);
  const s = features(c, 3000); assert.equal(s.values[19], 0); assert.equal(s.values[13], 0); assert.equal(s.values[3], 0);
});
test('self-reported break is captured before response; pause and resume clear the request', () => {
  const c = make(); c.updateDraft('my progress'); c.request('break', 2000);
  let s = features(c, 2000); assert.equal(s.values[15], 1); assert.equal(s.values[16], 1); assert.equal(s.values[5], 5);
  c.acknowledge(c.active().pendingRequestId, 3000);
  assert.equal(c.active().status, 'paused'); assert.equal(features(c, 3000).values[15], 0);
  assert.throws(() => c.submit(4000)); c.resume(5000);
  assert.equal(c.active().draft, 'my progress'); assert.equal(features(c, 5000).values[16], null);
  assert.equal(features(c, 5000).values[28], null);
});
test('rest supersedes a pending unseen hint and rejects its delayed callback', () => {
  const c = make(); c.request('hint', 2000); const old = c.active().pendingRequestId;
  c.request('break', 3000); const current = c.active().pendingRequestId;
  assert.notEqual(old, current); c.acknowledge(old, 3100); assert.equal(c.active().pendingRequestId, current);
  c.acknowledge(current, 3200); assert.equal(c.active().status, 'paused'); assert.equal(features(c, 3200).values[3], 0);
});
test('ungraded math remains unknown, not incorrect', () => {
  const c = make('FUNC-FB-0032'); c.updateDraft('k<1 且 k≠0'); c.submit(2000);
  const f = features(c, 2000).values;
  assert.equal(f[0], 1); for (const i of [1,2,4,5,12]) assert.equal(f[i], null);
});
test('disabling stops events immediately, re-enabling does not repair missing evidence', () => {
  const c = make(); c.request('hint', 2000); const n = c.active().events.length;
  c.setCollection(false); c.acknowledge(c.active().pendingRequestId, 3000); c.updateDraft('B'); c.submit(4000);
  assert.equal(c.active().events.length, n); c.setCollection(true); assert.equal(features(c, 5000).ready, false);
  c.finish(6000); c.start('FUNC-SC-0193', 7000); assert.equal(features(c, 8000).ready, true);
});
test('sessions isolate cumulative counts and request states', () => {
  const c = make(); c.updateDraft('A'); c.submit(2000); c.finish(3000); c.start('FUNC-SA-0139', 4000);
  const s = features(c, 5000); assert.equal(s.values[0], 0); assert.equal(s.eventIds.length, 1);
});
test('clock reversal and invalid requests do not change state', () => {
  const c = make(); c.request('hint', 2000); const before = c.serialize();
  assert.throws(() => c.acknowledge(c.active().pendingRequestId, 1500)); assert.equal(c.serialize(), before);
  assert.throws(() => c.request('bad', 3000)); assert.equal(c.serialize(), before);
});
test('restart restores draft, pause, events and consent without double counting', () => {
  const c = make(); c.updateDraft('C'); c.submit(2000); c.pause(3000);
  const restored = new EventCollector(); assert.equal(restored.restore(c.serialize()), true);
  assert.equal(restored.serialize(), c.serialize()); restored.resume(5000);
  assert.equal(features(restored, 5000).values[0], 1); assert.equal(restored.active().draft, 'C');
});
test('malformed persistence is rejected without overwriting valid state', () => {
  const c = make(); const before = c.serialize();
  for (const raw of ['null', '{}', '{bad', '{"version":2}']) { assert.equal(c.restore(raw), false); assert.equal(c.serialize(), before); }
  const bad = JSON.parse(before); bad.sessions[0].events.push(bad.sessions[0].events[0]);
  assert.equal(c.restore(JSON.stringify(bad)), false); assert.equal(c.serialize(), before);
  const staleCounter = JSON.parse(before); staleCounter.sequence = 0;
  assert.equal(c.restore(JSON.stringify(staleCounter)), false);
});
test('transaction rolls back failed writes; corruption prevents silent overwrite', () => {
  let stored = ''; let fail = false;
  const store = { read: () => stored, write: text => { if (fail) throw Error('disk full'); stored = text; } };
  const repo = new LearningRepository(store); repo.load();
  repo.change(c => { c.setCollection(true); c.start('FUNC-SC-0193', 1000); }); const before = stored;
  fail = true; assert.throws(() => repo.change(c => c.request('hint', 2000))); assert.equal(repo.collector.serialize(), before);
  assert.equal(stored, before); fail = false; stored = '{bad'; const broken = new LearningRepository(store);
  assert.throws(() => broken.load()); assert.throws(() => broken.change(c => c.clear())); assert.equal(stored, '{bad');
  broken.clear(); assert.equal(broken.writable, true); assert.equal(broken.collector.state.collectionEnabled, false);
});
test('clear removes event evidence, requests and drafts across reload', () => {
  let stored = ''; const store = { read: () => stored, write: v => { stored = v; } };
  const repo = new LearningRepository(store); repo.load(); repo.change(c => { c.setCollection(true); c.start('FUNC-SC-0193', 1000); c.updateDraft('B'); c.request('hint', 2000); });
  repo.clear(); const reload = new LearningRepository(store); reload.load();
  assert.equal(reload.collector.state.sessions.length, 0); assert.equal(reload.collector.active(), undefined);
  assert.equal(reload.collector.state.collectionEnabled, false);
  const oldId = 'request-3';
  reload.change(c => { c.setCollection(true); c.start('FUNC-SC-0193', 4000); c.request('hint', 5000); });
  assert.notEqual(reload.collector.active().pendingRequestId, oldId);
});
test('atomic file writer ignores stale pending and preserves committed data on write/flush/rename errors', () => {
  const store = new LearningFileStore(); store.configure('/sandbox'); store.write('committed');
  disk.set('/sandbox/learning-behavior-v1.json.pending', 'stale'); assert.equal(store.read(), 'committed');
  for (const failure of ['write', 'flush', 'rename']) {
    failDisk = failure; assert.throws(() => store.write('uncommitted')); assert.equal(store.read(), 'committed');
    assert.equal(disk.has('/sandbox/learning-behavior-v1.json.pending'), false);
  }
  failDisk = ''; store.write('cleared'); assert.equal(store.read(), 'cleared');
});
test('input adapter rejects invalid fields, dimensions, masks and incomplete snapshots', () => {
  const c = make(); const s = features(c, 2000);
  assert.equal(ModelInputAdapter.fromSnapshot(s, 'action').length, 58);
  assert.equal(ModelInputAdapter.fromSnapshot(s, 'state').length, 58);
  assert.throws(() => ModelInputAdapter.transform([1], 'action'));
  const invalid = new Array(29).fill(null); invalid[0] = -1;
  assert.throws(() => ModelInputAdapter.transform(invalid, 'action'));
  invalid[0] = Infinity; assert.throws(() => ModelInputAdapter.transform(invalid, 'action'));
  s.mask[0] = 0; assert.throws(() => ModelInputAdapter.fromSnapshot(s, 'action'));
});

test('proactive help appears at three minutes of visible inactivity, never earlier', () => {
  const c = make(); c.setProactive(true);
  const eligible = now => ProactivePolicy.helpForPause(c.active(), c.state.collectionEnabled,
    c.state.proactiveEnabled, 1000, now);
  assert.equal(eligible(180999), false);
  assert.equal(eligible(181000), true);
  c.offer('help', 'long_pause', 181000);
  assert.equal(eligible(181001), false);
  assert.equal(c.active().events.at(-1).reasonCode, 'long_pause');
  c.respondOffer('later', 181100);
  assert.equal(c.active().offerResponse, 'later');
  assert.equal(eligible(481099), false);
  assert.equal(eligible(481100), true);
});

test('proactive offer needs consent and visible active task; self-report only drives rest', () => {
  const c = make();
  const help = (visible, now) => ProactivePolicy.helpForPause(c.active(), c.state.collectionEnabled,
    c.state.proactiveEnabled, visible, now);
  assert.equal(help(1000, 181000), false);
  c.setProactive(true);
  assert.equal(help(100000, 181000), false);
  assert.equal(ProactivePolicy.restForReport(c.active(), true, true, 'emotion', 'tired', 2000), 'self_report_tired');
  assert.equal(ProactivePolicy.restForReport(c.active(), true, true, 'emotion', 'frustrated', 2000), 'self_report_frustrated');
  assert.equal(ProactivePolicy.restForReport(c.active(), true, true, 'emotion', 'calm', 2000), '');
  assert.equal(ProactivePolicy.restForReport(c.active(), true, false, 'emotion', 'tired', 2000), '');
  c.pause(2000); assert.equal(help(1000, 400000), false);
});

test('companion gives task-specific teaching without claiming ungraded answers are correct', () => {
  const { taskById } = load('LearningTypes');
  const task = taskById('FUNC-SC-0193');
  assert.match(CompanionGuidance.afterSubmission(task, '本次选择正确'), /x = 100/);
  assert.match(CompanionGuidance.afterSubmission(task, '本次选择不正确，可以继续尝试'), /先别急着重选/);
  assert.match(CompanionGuidance.afterSubmission(taskById('FUNC-FB-0032'), '已记录作答，未自动判分'), /不能自动判断/);
});

test('proactive response, rejection cooldown and consent survive reload', () => {
  const c = make(); c.setProactive(true); c.offer('rest', 'self_report_tired', 2000);
  assert.equal(c.active().events.at(-1).source, 'user_self_report');
  c.respondOffer('rejected', 2100);
  assert.equal(c.active().events.at(-1).response, 'rejected');
  const restored = new EventCollector(); assert.equal(restored.restore(c.serialize()), true);
  assert.equal(restored.state.proactiveEnabled, true);
  assert.equal(ProactivePolicy.restForReport(restored.active(), true, true, 'emotion', 'frustrated', 602099), '');
  assert.equal(ProactivePolicy.restForReport(restored.active(), true, true, 'emotion', 'frustrated', 602100), 'self_report_frustrated');
  restored.setProactive(false);
  assert.equal(ProactivePolicy.helpForPause(restored.active(), true, restored.state.proactiveEnabled, 1000, 1000000), false);
});

// Export actual ArkTS outputs for independent Python/NumPy comparison on all 390 test vectors.
const files = ['outputs/training-data-v1/synthetic_test_120.jsonl', 'outputs/training-data-v1/synthetic_test_150.jsonl',
  'outputs/video-readiness-20260922/user_zip_120.jsonl'];
const allRows = files.flatMap(file => fs.readFileSync(path.join(root, file), 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse));
const exportsToCheck = allRows.map(r => ({ sample_id: r.sample_id,
  action: plain(ModelInputAdapter.transform(r.input.feature_vector, 'action')),
  state: plain(ModelInputAdapter.transform(r.input.feature_vector, 'state')) }));
const output = path.join(root, 'outputs/behavior-collection-verification'); fs.mkdirSync(output, { recursive: true });
const traces = [];
for (let scenario = 0; scenario < 3; scenario++) {
  const c = make();
  c.updateDraft('A'); c.submit(2000); c.submit(3000);
  c.request(scenario === 0 ? 'hint' : scenario === 1 ? 'split' : 'break', 4000);
  traces.push({ session: plain(c.active()), time: 4500, values: plain(features(c, 4500).values) });
  c.acknowledge(c.active().pendingRequestId, 5000);
  traces.push({ session: plain(c.active()), time: 5500, values: plain(features(c, 5500).values) });
}
fs.writeFileSync(path.join(output, 'event-traces.json'), JSON.stringify(traces));
fs.writeFileSync(path.join(output, 'arkts-preprocessed.json'), JSON.stringify(exportsToCheck));
fs.writeFileSync(path.join(output, 'domain-tests.json'), JSON.stringify({ passed, oracle_vectors: allRows.length, scope: 'Actual ArkTS domain code transpiled in Node; native filesystem API simulated, not device verification.' }, null, 2));
console.log(`${passed}/${passed} domain tests passed; exported ${allRows.length} vectors for independent NumPy comparison.`);
