'use strict';
(function (root) {
  const graphVersion = 'classic-three-v1';
  const topics = [
    { id: 'quadratic', itemId: 'FUNC-FB-0032', title: '二次方程的实根', skills: ['quadratic_definition', 'discriminant', 'joint_conditions'] },
    { id: 'log', itemId: 'FUNC-SC-0193', title: '对数与指数', skills: ['log_exponent'] },
    { id: 'maximum', itemId: 'FUNC-SA-0139', title: '区间上的最值', skills: ['absolute_distance', 'piecewise_extrema', 'attainable_maximum'] }
  ];
  const labels = { quadratic_definition: '二次项系数与退化', discriminant: '判别式与实根', joint_conditions: '条件交集与边界',
    log_exponent: '对数定义与指数互化', absolute_distance: '绝对值距离与端点', piecewise_extrema: '分段与区间最值', attainable_maximum: '候选比较与可达性' };
  // Explicit engineering priors. Offline fitting returns a separate, versioned model.
  const priorModel = { modelVersion: 'bkt-prior-v1', source: 'engineering_prior', calibrated: false,
    initial: .25, learn: .08, slip: .12, guess: .25, assistedSlip: .08, assistedGuess: .65,
    conflictMastered: .08, conflictUnmastered: .55 };
  const clone = x => JSON.parse(JSON.stringify(x));
  function validateModel(m) {
    for (const k of ['initial', 'learn', 'slip', 'guess', 'assistedSlip', 'assistedGuess', 'conflictMastered', 'conflictUnmastered']) {
      if (!Number.isFinite(m[k]) || m[k] <= 0 || m[k] >= 1) throw Error('Invalid model parameter: ' + k);
    }
    if (m.guess >= 1 - m.slip || m.assistedGuess >= 1 - m.assistedSlip || m.conflictMastered >= m.conflictUnmastered) throw Error('Non-identifiable observation ordering');
    if (!m.modelVersion || !m.source) throw Error('Missing model provenance');
    return m;
  }
  function validate(e) {
    if (!e || e.schemaVersion !== 1 || typeof e.id !== 'string' || !e.id || typeof e.studentId !== 'string' || !e.studentId ||
      typeof e.sessionId !== 'string' || !e.sessionId || typeof e.attemptId !== 'string' || !e.attemptId ||
      typeof e.itemId !== 'string' || !e.itemId ||
      !Number.isFinite(e.time) || !['real', 'synthetic', 'legacy'].includes(e.origin) ||
      !topics.some(t => t.id === e.topic && t.skills.includes(e.skillId)) ||
      !['correct', 'incorrect', 'unknown'].includes(e.outcome) || !['independent', 'assisted', 'unknown'].includes(e.assistance) ||
      !['answer', 'explanation'].includes(e.kind) || typeof e.source !== 'string' ||
      !['none', 'candidate', 'verified'].includes(e.conflict) || typeof e.consent !== 'boolean') throw Error('Invalid cognitive evidence');
    if (e.conflict === 'verified' && !['teacher', 'symbolic_verified', 'synthetic_truth'].includes(e.conflictSource)) throw Error('Conflict is not verified');
    return e;
  }
  function eligible(e) {
    return e.consent && e.outcome !== 'unknown' && e.assistance !== 'unknown' && e.conflict !== 'candidate' &&
      ['answer_key', 'teacher', 'symbolic_verified', 'synthetic_truth'].includes(e.source);
  }
  function observation(e, m) {
    // One joint emission per attempt. A verified conflict replaces the answer signal;
    // answer + explanation are never multiplied as if independent observations.
    if (e.conflict === 'verified') return [m.conflictMastered, m.conflictUnmastered];
    const s = e.assistance === 'assisted' ? m.assistedSlip : m.slip;
    const g = e.assistance === 'assisted' ? m.assistedGuess : m.guess;
    return e.outcome === 'correct' ? [1 - s, g] : [s, 1 - g];
  }
  function update(p, e, model = priorModel) {
    const [masteredLikelihood, unmasteredLikelihood] = observation(e, model);
    const evidenceLikelihood = p * masteredLikelihood + (1 - p) * unmasteredLikelihood;
    const posterior = p * masteredLikelihood / evidenceLikelihood;
    return { prior: p, masteredLikelihood, unmasteredLikelihood, evidenceLikelihood, posterior,
      nextPrior: posterior + (1 - posterior) * model.learn };
  }
  function independentPrediction(p, m = priorModel) { return p * (1 - m.slip) + (1 - p) * m.guess; }
  function entropy(p) { return p === 0 || p === 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p); }
  function canonical(events, studentId, origin) {
    const ids = new Map();
    for (const raw of events) {
      const e = validate(raw);
      if (e.studentId !== studentId || e.origin !== origin || !e.consent) continue;
      if (ids.has(e.id) && JSON.stringify(ids.get(e.id)) !== JSON.stringify(e)) throw Error('Conflicting evidence ID: ' + e.id);
      ids.set(e.id, e);
    }
    const attempts = new Set();
    return [...ids.values()].sort((a, b) => a.time - b.time || a.id.localeCompare(b.id)).filter(e => {
      const key = JSON.stringify([e.sessionId, e.attemptId]);
      if (attempts.has(key)) return false;
      attempts.add(key); return true;
    });
  }
  function replay(events, { studentId = 'local', origin = 'real', model = priorModel } = {}) {
    validateModel(model);
    const states = Object.fromEntries(Object.keys(labels).map(id => [id, { skillId: id, label: labels[id], status: 'UNKNOWN',
      mastery: null, nextIndependentCorrect: null, uncertainty: null, observations: 0, evidenceIds: [], trace: [],
      modelVersion: model.modelVersion, graphVersion, parameterSource: model.source, calibrated: model.calibrated === true }]));
    const priors = Object.fromEntries(Object.keys(labels).map(id => [id, model.initial]));
    const selected = canonical(events, studentId, origin);
    const ignored = [], currentCandidates = [], process = { assistedAttempts: 0, independentAttempts: 0, corrections: 0 };
    let lastSkill = '', lastOutcome = '';
    for (const e of selected) {
      if (e.assistance === 'assisted') process.assistedAttempts++;
      if (e.assistance === 'independent') process.independentAttempts++;
      if (lastSkill === e.skillId && lastOutcome === 'incorrect' && e.outcome === 'correct') process.corrections++;
      lastSkill = e.skillId; lastOutcome = e.outcome;
      const s = states[e.skillId];
      if (e.conflict !== 'none') currentCandidates.push({ status: 'needs_check', candidate: 'concept_conflict', evidenceIds: [e.id], verified: e.conflict === 'verified' });
      if (!eligible(e)) { ignored.push({ id: e.id, reason: e.outcome === 'unknown' ? 'unknown_score' : e.assistance === 'unknown' ? 'unknown_assistance' : 'unverified_observation' }); continue; }
      const trace = update(priors[e.skillId], e, model);
      priors[e.skillId] = trace.nextPrior;
      s.mastery = trace.posterior; s.nextIndependentCorrect = independentPrediction(trace.nextPrior, model);
      s.uncertainty = { kind: 'binary_state_entropy_bits', value: entropy(trace.posterior), parameterUncertainty: 'not_estimated' };
      s.observations++; s.evidenceIds.push(e.id); s.trace.push({ evidenceId: e.id, time: e.time, assistance: e.assistance, source: e.source,
        emissionParameterSource: e.conflict === 'verified' && model.fitting?.priorOnlyParameters?.includes('conflictMastered') ? 'engineering_prior' : model.source, ...trace });
      s.status = origin === 'synthetic' ? 'DEMO_POSTERIOR' : model.source === 'engineering_prior' ? 'PRIOR_BASED_POSTERIOR' : 'ESTIMATED';
    }
    return { status: selected.length ? 'computed' : 'UNKNOWN', modelVersion: model.modelVersion, graphVersion,
      uncertainty: 'uncalibrated_without_independent_real_validation', evidenceIds: selected.map(e => e.id), states,
      currentCandidates: currentCandidates.slice(-3), process, ignored, legacyPolicy: 'unknown assistance and score; no inferred mastery' };
  }
  function append(events, e) {
    validate(e); if (!e.consent) return events.slice();
    const old = events.find(x => x.id === e.id);
    if (old) { if (JSON.stringify(old) !== JSON.stringify(e)) throw Error('Conflicting evidence ID'); return events.slice(); }
    return events.concat(clone(e));
  }
  function remove(events, id) { return events.filter(e => e.id !== id); }
  function correct(events, id, replacement) {
    const old = events.find(e => e.id === id); if (!old) throw Error('Missing evidence');
    validate(replacement);
    for (const key of ['id', 'studentId', 'sessionId', 'attemptId', 'time', 'origin', 'topic', 'skillId']) if (replacement[key] !== old[key]) throw Error('Cannot change evidence identity');
    // Erase superseded content. No private raw text is retained in the audit metadata.
    return events.map(e => e.id === id ? { ...clone(replacement), revision: (old.revision || 0) + 1 } : e);
  }
  function legacy(record) {
    const topic = topics[record.task]; if (!topic) return null;
    return { schemaVersion: 1, id: 'legacy-' + record.id, studentId: 'local', sessionId: 'legacy', attemptId: record.id,
      time: record.time, origin: 'legacy', topic: topic.id, itemId: topic.itemId, skillId: topic.skills.at(-1), kind: 'answer',
      outcome: 'unknown', assistance: 'unknown', conflict: 'none', source: 'legacy_unverified', consent: false };
  }
  // Deliberately narrow answer recognition; everything else remains UNKNOWN.
  function assess(task, raw) {
    const text = String(raw).normalize('NFKC').replace(/[\s`$。]/g, '').replace(/−/g, '-');
    if (task === 0 && /^(?:k<1(?:且|,|，|并且)k(?:≠|!=|不等于)0|\(-∞,0\)[∪U]\(0,1\))$/.test(text)) return 'correct';
    if (task === 1 && /^(?:B|100|x=100)$/i.test(text)) return 'correct';
    if (task === 1 && /^[ACD]$/i.test(text)) return 'incorrect';
    if (task === 2 && /^(?:4|最大值(?:为|是|=)4)$/.test(text)) return 'correct';
    return 'unknown';
  }
  const api = { graphVersion, topics, labels, priorModel, validateModel, validate, eligible, observation, update,
    independentPrediction, replay, append, remove, correct, legacy, assess, canonical };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CognitiveState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
