'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../tools/local-llm/desktop/core/intervention-estimator.cjs');
for (const s of E.scenarios) {
  test(s.topic + ': recover confounded synthetic effect with IPS and cross-fitted DR', () => {
    for (const seed of [1, 42, 2026]) {
      const data = E.simulate(s.topic, seed, 8000), r = E.estimate(data.rows, { topic: s.topic });
      assert.equal(r.status, 'simulation_estimate'); assert.ok(r.naive < 0);
      assert.ok(Math.abs(r.dr.value - data.truth) < .06);
      assert.ok(Math.abs(r.ips.value - data.truth) < .06);
      assert.ok(r.effectiveSampleSize.every(n => n > 30));
      assert.deepEqual(r, E.estimate(data.rows.concat(data.rows[0]), { topic: s.topic }));
    }
  });
  test(s.topic + ': independent posttest, skip, repeated exposure, timeout and snapshot isolation', () => {
    const snapshot = { time: 10, evidenceIds: ['e1'], states: { knowledge: { mastery: .3 } } };
    const d = E.decision({ id:'d', topic:s.topic, time:10, snapshot, action:'concept_check', consent:true });
    snapshot.states.knowledge.mastery = .9;
    assert.equal(d.snapshot.states.knowledge.mastery, .3);
    for (let i=0;i<s.options.length;i++) {
      const r = E.recordOutcome(d, { time:20, choice:i, independent:true, firstExposure:true });
      assert.equal(r.outcome.y, Number(i === s.correct));
      assert.deepEqual(E.recordOutcome(r, { time:21, choice:s.correct, independent:true, firstExposure:true }), r);
    }
    for (const args of [{ choice:null }, { independent:false }, { firstExposure:false }, { time:1800011 }]) {
      const r = E.recordOutcome(d, { time:20, choice:s.correct, independent:true, firstExposure:true, ...args });
      assert.equal(r.outcome.y,null); assert.ok(r.outcome.missingReason);
    }
    assert.equal(E.estimate([d],{topic:s.topic,origin:'real'}).reason,'observational_not_identified');
  });
}
test('refuses unsupported, incomplete, non-overlapping, dependent or leaked data', () => {
  const rows = E.simulate('quadratic').rows;
  const check = (mutate, reason) => { const input = structuredClone(rows); mutate(input); assert.equal(E.estimate(input, {topic:'quadratic'}).reason,reason); };
  check(r => r[0].propensity = {concept_check:1, step_hint:0}, 'no_overlap');
  check(r => r[0].outcome = null, 'missing_outcomes');
  check(r => r[0].outcome.independent = false, 'invalid_outcome');
  check(r => r[0].snapshot.time = r[0].time+1, 'invalid_design');
  check(r => r[0].studentId = r[1].studentId, 'dependent_units');
  check(r => r.push({...r[0], action:'other'}), 'conflicting_id');
  assert.equal(E.estimate(rows,{topic:'unsupported'}).reason,'unsupported_topic');
  assert.equal(E.estimate(rows.slice(0,50),{topic:'quadratic'}).reason,'insufficient_samples');
  assert.equal(E.estimate(rows,{topic:'log'}).reason,'no_data');
  assert.equal(E.estimate(rows,{topic:'quadratic',origin:'real'}).reason,'no_data');
  assert.throws(() => E.decision({id:'d',topic:'log',time:1,snapshot:{time:1},action:'concept_check',consent:false}));
});
