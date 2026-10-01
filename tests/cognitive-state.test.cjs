'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const C = require('../tools/local-llm/desktop/core/cognitive-state.cjs');
const F = require('../tools/cognitive/fit-evaluate.cjs');
const E = require('../tools/local-llm/desktop/core/evidence.cjs');
function event(overrides = {}) { return { schemaVersion: 1, id: 'e1', itemId: 'FUNC-SC-0193', studentId: 'local', sessionId: 's1', attemptId: 'a1',
  time: 1, origin: 'real', topic: 'log', skillId: 'log_exponent', kind: 'answer', outcome: 'correct', assistance: 'independent',
  conflict: 'none', source: 'answer_key', consent: true, ...overrides }; }
const value = (events, options) => C.replay(events, options).states.log_exponent;
test('all three classic topics and seven skills start UNKNOWN', () => {
  assert.equal(C.topics.length, 3); assert.equal(Object.keys(C.labels).length, 7);
  for (const s of Object.values(C.replay([]).states)) { assert.equal(s.status, 'UNKNOWN'); assert.equal(s.mastery, null); }
});
test('all seven skills update independently and match the reviewed item mapping', () => {
  const mapping = require('../data/cognitive/classic-three.json');
  for (const topic of C.topics) {
    assert.deepEqual(topic.skills, mapping.items.find(i => i.topic === topic.id).skills);
    for (const skillId of topic.skills) {
      const result = C.replay([event({ topic: topic.id, skillId })]);
      assert.equal(result.states[skillId].observations, 1);
      assert.equal(Object.values(result.states).filter(s => s.mastery !== null).length, 1);
    }
  }
});
test('pre-intervention snapshots are detached and versioned', () => {
  const events = [event()], before = E.beforeSnapshot(events);
  const more = C.append(events, event({ id: 'e2', attemptId: 'a2', time: 2, outcome: 'incorrect' }));
  assert.equal(before.states.log_exponent.observations, 1);
  assert.equal(E.beforeSnapshot(more).states.log_exponent.observations, 2);
  assert.equal(before.graphVersion, C.graphVersion);
});
test('Bayes calculation matches independent manual calculation', () => {
  const s = value([event()]); assert.equal(s.mastery, .25 * .88 / (.25 * .88 + .75 * .25));
  assert.equal(s.observations, 1); assert.equal(s.trace[0].prior, .25);
});
test('assisted correctness supplies less evidence, verified conflict reverses it', () => {
  const independent = value([event()]).mastery, assisted = value([event({ assistance: 'assisted' })]).mastery;
  const conflict = value([event({ conflict: 'verified', conflictSource: 'teacher' })]).mastery;
  assert.ok(independent > assisted && assisted > conflict && conflict < .25);
});
test('unknown scores, unknown assistance, neural candidates do not update', () => {
  for (const patch of [{ outcome: 'unknown' }, { assistance: 'unknown' }, { source: 'model-semantic' }, { conflict: 'candidate' }]) assert.equal(value([event(patch)]).mastery, null);
});
test('no learning transition for unknown observations', () => {
  const second = event({ id: 'e2', attemptId: 'a2', time: 2, outcome: 'unknown' });
  assert.deepEqual(value([event(), second]), value([event()]));
});
test('refused evidence is not appended or modelled', () => {
  assert.deepEqual(C.append([], event({ consent: false })), []); assert.equal(value([event({ consent: false })]).mastery, null);
});
test('event IDs and attempt IDs cannot double-count one answer', () => {
  assert.equal(value([event(), event()]).observations, 1);
  assert.equal(value([event(), event({ id: 'e2', kind: 'explanation' })]).observations, 1);
  assert.throws(() => value([event(), event({ outcome: 'incorrect' })]), /Conflicting/);
});
test('student isolation and origin isolation', () => {
  assert.equal(value([event({ studentId: 'other' })]).mastery, null);
  assert.equal(value([event({ origin: 'synthetic' })]).mastery, null);
});
test('deletion and correction replay without stale posterior', () => {
  const records = [event(), event({ id: 'e2', attemptId: 'a2', time: 2 })];
  assert.deepEqual(value(C.remove(records, 'e1')), value([records[1]]));
  assert.equal(value(C.correct([event()], 'e1', event({ outcome: 'unknown' }))).mastery, null);
  assert.equal(value(C.remove([event()], 'e1')).mastery, null);
});
test('chronological replay and serialization are deterministic', () => {
  const records = [event({ id: 'e2', attemptId: 'a2', time: 2, outcome: 'incorrect' }), event()];
  assert.deepEqual(C.replay(records), C.replay(JSON.parse(JSON.stringify(records.reverse()))));
});
test('delayed transfer failure reduces posterior without invented forgetting', () => {
  const correct = event(), failure = event({ id: 'e2', attemptId: 'a2', time: 864000001, outcome: 'incorrect' });
  assert.ok(value([correct, failure]).mastery < value([correct]).mastery);
  assert.equal(value([event({ time: 864000001 })]).mastery, value([correct]).mastery);
});
test('legacy records stay unknown and non-consenting', () => {
  const migrated = C.legacy({ id: 'old', time: 12, task: 1, type: 'answer_correct' });
  assert.equal(migrated.assistance, 'unknown'); assert.equal(migrated.outcome, 'unknown'); assert.equal(migrated.consent, false);
});
test('bounded answer recognizer handles three items and rejects arbitrary expressions', () => {
  assert.equal(C.assess(0, 'k<1且k≠0'), 'correct'); assert.equal(C.assess(0, 'k<1'), 'unknown');
  assert.equal(C.assess(1, 'B'), 'correct'); assert.equal(C.assess(1, 'A'), 'incorrect');
  assert.equal(C.assess(2, '4'), 'correct'); assert.equal(C.assess(2, 'process.exit()'), 'unknown');
});
test('unverified conflict cannot masquerade as a mathematical proof', () => {
  assert.throws(() => value([event({ conflict: 'verified', conflictSource: 'model-semantic' })]), /not verified/);
});
test('all topic and assistance demonstrations compute different states', () => {
  for (const [id, group] of Object.entries(F.demos())) {
    const skill = C.topics.find(t => t.id === id).skills.at(-1);
    const p = mode => group[mode].belief.states[skill].mastery;
    assert.ok(p('independent') > p('assisted')); assert.ok(p('conflict') < p('assisted')); assert.ok(p('delayed_failure') < p('independent'));
  }
});
test('fitting improves training likelihood and declares prior-only parameters', () => {
  const records = F.simulate(987, 24).records, groups = F.sequences(records), fitted = F.fit(records);
  assert.ok(F.nll(groups, fitted) < F.nll(groups, C.priorModel));
  assert.equal(fitted.source, 'synthetic_mle'); assert.equal(fitted.calibrated, false);
  assert.deepEqual(fitted.fitting.priorOnlyParameters, ['conflictMastered', 'conflictUnmastered']);
});
test('predictions never include current or future answers', () => {
  const records = [event(), event({ id: 'e2', attemptId: 'a2', time: 2, outcome: 'incorrect' })];
  const report = F.evaluate(records, C.priorModel, .5);
  const p0 = C.independentPrediction(.25), p1 = C.independentPrediction(C.update(.25, records[0]).nextPrior);
  assert.ok(Math.abs(report.bkt.logLoss - (-Math.log(p0) - Math.log(1 - p1)) / 2) < 1e-12);
});
test('calibration bins account for every prediction, AUC handles a single label', () => {
  const m = F.metrics([[.1, 0], [.9, 1], [.5, 1]], 3);
  assert.equal(m.reliability.reduce((a, b) => a + b.count, 0), 3); assert.equal(m.coverage, 1); assert.equal(m.auroc, null);
});
