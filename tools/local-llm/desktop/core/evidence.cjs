'use strict';
const C = require('./cognitive-state.cjs');
module.exports = {
  schemaVersion: 1,
  validate: C.validate, append: C.append, remove: C.remove, correct: C.correct, migrateLegacy: C.legacy,
  beforeSnapshot(events, options) {
    const belief = C.replay(events, options);
    return { status: belief.status, evidenceIds: belief.evidenceIds, modelVersion: belief.modelVersion,
      graphVersion: belief.graphVersion, uncertainty: belief.uncertainty,
      states: Object.fromEntries(Object.entries(belief.states).map(([id, s]) => [id, { mastery: s.mastery, observations: s.observations }])) };
  }
};
