'use strict';
(function (root) {
  const version = 'causal-classic-three-v1';
  const actions = ['concept_check', 'step_hint'];
  const actionLabels = ['概念核查', '分步提示'];
  // Teaching variants are engineering drafts; no claim of expert or student validation.
  const scenarios = [
    { topic: 'quadratic', itemId: 'FUNC-FB-0032', title: '二次方程的实根', effect: .10,
      help: ['先核查两个条件：二次项系数能否为零？两个不相等的实根要求判别式满足什么条件？最后说明为什么要同时满足。',
        '第一步列出二次项系数不为零；第二步用 b²−4ac>0 求参数范围；第三步取两个条件的交集，并检查边界。'],
      test: '迁移核查：关于 x 的一元二次方程 mx²−4x+2=0 有两个不相等的实根，m 的范围是？',
      options: ['m<2', 'm<2 且 m≠0', 'm≤2 且 m≠0', 'm>2'], correct: 1 },
    { topic: 'log', itemId: 'FUNC-SC-0193', title: '对数与指数', effect: .15,
      help: ['先说明 logₐb=c 中底数、真数和指数各是谁，再把它写成指数等式。底数和真数必须满足哪些条件？',
        '第一步识别底数 a、真数 b、结果 c；第二步改写为 aᶜ=b；第三步检查 a>0、a≠1、b>0，再求未知量。'],
      test: '迁移核查：log₃x=4，x 等于多少？', options: ['12', '64', '81', '1/81'], correct: 2 },
    { topic: 'maximum', itemId: 'FUNC-SA-0139', title: '区间上的最值', effect: .08,
      help: ['把绝对值理解为数轴上的距离。区间内哪里可能最远？候选点是否属于区间，最大值能否真正取到？',
        '第一步找绝对值表达式的分段点；第二步在各段和区间端点计算候选值；第三步比较候选值，并核对取值点是否在区间内。'],
      test: '迁移核查：f(x)=|x−2|，x∈[−1,4]，最大值是多少？', options: ['2', '4', '3', '6'], correct: 2 }
  ];
  const clone = x => JSON.parse(JSON.stringify(x));
  function scenario(topic) { const s = scenarios.find(s => s.topic === topic); if (!s) throw Error('unsupported_topic'); return s; }
  function decision({ id, topic, time, snapshot, action, consent, origin = 'real', studentId = 'local', propensity = null }) {
    const s = scenario(topic);
    if (!id || !Number.isFinite(time) || !actions.includes(action) || consent !== true || !snapshot || !Number.isFinite(snapshot.time) || snapshot.time > time || !['real','synthetic'].includes(origin)) throw Error('invalid_decision');
    return clone({ schemaVersion: 1, id, topic, itemId: s.itemId, studentId, origin, consent,
      time, snapshot, action, allowedActions: actions, propensity, policyVersion: version,
      assignment: origin === 'synthetic' ? 'simulated_known_assignment' : 'user_choice',
      outcomeWindowMs: 30 * 60000, outcome: null });
  }
  function recordOutcome(d, { time, choice, independent, firstExposure }) {
    const s = scenario(d.topic);
    if (d.outcome) return clone(d);
    if (!Number.isFinite(time) || time < d.time) throw Error('invalid_outcome_time');
    const reason = time > d.time + d.outcomeWindowMs ? 'outside_window' : !independent ? 'assisted_or_unknown' : !firstExposure ? 'repeat_posttest' :
      !Number.isInteger(choice) || choice < 0 || choice >= s.options.length ? 'skipped' : null;
    return { ...clone(d), outcome: { time, testId: d.topic + '-transfer-v1', y: reason ? null : Number(choice === s.correct),
      independent: independent === true, firstExposure: firstExposure === true, missingReason: reason, source: 'draft_answer_key' } };
  }
  function rng(seed) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
  function simulate(topic, seed = 42, count = 4000) {
    const s = scenario(topic), random = rng(seed), rows = [];
    for (let i = 0; i < count; i++) {
      const hard = random() < .5, p = hard ? .85 : .15;
      const action = random() < p ? actions[0] : actions[1];
      const base = hard ? .2 : .75;
      const d = decision({ id: topic + '-' + i, topic, time: i * 1000, snapshot: { time: i * 1000, stratum: hard ? 'hard' : 'easy', evidenceIds: [] },
        action, consent: true, origin: 'synthetic', studentId: 'sim-' + i, propensity: { concept_check: p, step_hint: 1 - p } });
      d.outcome = { time: d.time + 100, y: Number(random() < base + (action === actions[0] ? s.effect : 0)), independent: true, firstExposure: true, missingReason: null };
      rows.push(d);
    }
    return { rows, truth: s.effect, seed, population: 'synthetic_half_hard_half_easy' };
  }
  const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
  function interval(scores) {
    const value = mean(scores), variance = scores.reduce((s, x) => s + (x - value) ** 2, 0) / (scores.length - 1);
    const se = Math.sqrt(variance / scores.length);
    return { value, interval95: [value - 1.96 * se, value + 1.96 * se], standardError: se };
  }
  function estimate(input, { topic, origin = 'synthetic' } = {}) {
    const refuse = (reason, extra = {}) => ({ status: 'not_estimable', reason, modelVersion: version, topic, origin, ...extra });
    if (!scenarios.some(s => s.topic === topic)) return refuse('unsupported_topic');
    const ids = new Map();
    for (const row of input) {
      if (!row || row.topic !== topic || row.origin !== origin || row.consent !== true) continue;
      if (typeof row.id !== 'string' || !row.id) return refuse('invalid_record');
      if (ids.has(row.id) && JSON.stringify(ids.get(row.id)) !== JSON.stringify(row)) return refuse('conflicting_id');
      ids.set(row.id, row);
    }
    const rows = [...ids.values()].sort((a,b) => a.id.localeCompare(b.id));
    const missing = rows.filter(r => !r.outcome || r.outcome.y === null).length;
    const counts = { count: rows.length, missing, missingRate: rows.length ? missing / rows.length : null };
    if (!rows.length) return refuse('no_data', counts);
    // Self-selected real actions and estimated BKT states do not identify a causal effect.
    if (origin !== 'synthetic') return refuse('observational_not_identified', counts);
    if (rows.some(r => r.assignment !== 'simulated_known_assignment' || r.schemaVersion !== 1 || !actions.includes(r.action) ||
      r.policyVersion !== version || r.outcomeWindowMs !== 30 * 60000 || !Number.isFinite(r.time) || !Number.isFinite(r.snapshot?.time) || r.snapshot.time > r.time ||
      !['hard','easy'].includes(r.snapshot.stratum))) return refuse('invalid_design', counts);
    if (rows.some(r => !r.propensity || actions.some(a => !Number.isFinite(r.propensity[a]) || r.propensity[a] < .05 || r.propensity[a] > .95) ||
      Math.abs(r.propensity.concept_check + r.propensity.step_hint - 1) > 1e-9)) return refuse('no_overlap', counts);
    if (missing) return refuse('missing_outcomes', counts);
    if (rows.some(r => ![0,1].includes(r.outcome.y) || r.outcome.independent !== true || r.outcome.firstExposure !== true ||
      !Number.isFinite(r.outcome.time) || r.outcome.time < r.time || r.outcome.time > r.time + r.outcomeWindowMs)) return refuse('invalid_outcome', counts);
    if (new Set(rows.map(r => r.studentId)).size !== rows.length || rows.some(r => !r.studentId)) return refuse('dependent_units', counts);
    if (rows.length < 100) return refuse('insufficient_samples', counts);
    // Two-fold cross-fitting: each prediction uses only the other fold's outcomes.
    const predictions = [];
    for (let fold = 0; fold < 2; fold++) {
      const train = rows.filter((_, i) => i % 2 !== fold), table = {};
      for (const stratum of ['hard', 'easy']) for (const action of actions) {
        const group = train.filter(r => r.snapshot.stratum === stratum && r.action === action);
        if (group.length < 5) return refuse('sparse_strata', counts);
        table[stratum + action] = mean(group.map(r => r.outcome.y));
      }
      rows.forEach((r,i) => { if (i % 2 === fold) predictions[i] = actions.map(a => table[r.snapshot.stratum + a]); });
    }
    const ips = [], dr = [], dm = [], weights = actions.map(() => []);
    rows.forEach((r,i) => {
      const a = actions.indexOf(r.action), p = r.propensity[r.action], y = r.outcome.y, m = predictions[i];
      const sign = a === 0 ? 1 : -1;
      weights[a].push(1 / p); ips.push(sign * y / p);
      dm.push(m[0] - m[1]); dr.push(m[0] - m[1] + sign * (y - m[a]) / p);
    });
    const ess = weights.map(w => w.reduce((s,x) => s+x,0) ** 2 / w.reduce((s,x) => s+x*x,0));
    if (ess.some(n => !Number.isFinite(n) || n < 30)) return refuse('low_effective_sample_size', counts);
    const arms = actions.map(a => rows.filter(r => r.action === a).map(r => r.outcome.y));
    return { status: 'simulation_estimate', topic, origin, modelVersion: version, ...counts,
      target: 'concept_check_minus_step_hint', naive: mean(arms[0]) - mean(arms[1]),
      ips: interval(ips), dr: interval(dr), direct: mean(dm), effectiveSampleSize: ess,
      uncertainty: 'iid_asymptotic_95_percent; simulation_only', evidenceIds: rows.map(r => r.id) };
  }
  function simulatePolicyEvidence(topic, {seed=42,count=4000,timingBenefit=.10}={}) {
    if(!Number.isFinite(timingBenefit)||timingBenefit<-.15||timingBenefit>.20)throw Error('invalid_simulated_benefit');
    const methodData=simulate(topic,seed,count),timingData=simulate(topic,seed+1000,count),random=rng(seed+2000);
    // Internal binary action encoding is reused, but this is a separate synthetic experiment:
    // concept_check encodes invitation now; step_hint encodes defer throughout the outcome window.
    timingData.rows.forEach(r=>{const base=r.snapshot.stratum==='hard'?.2:.75;
      r.outcome.y=Number(random()<base+(r.action==='concept_check'?timingBenefit:0));});
    return {origin:'synthetic',seed,count,
      method:{...estimate(methodData.rows,{topic}),comparison:'concept_check_vs_step_hint',truth:methodData.truth},
      timing:{...estimate(timingData.rows,{topic}),target:'offer_now_minus_defer',comparison:'invitation_now_vs_defer',
        actionMapping:{concept_check:'offer_now',step_hint:'defer'},truth:timingBenefit}};
  }
  const api = { version, actions, actionLabels, scenarios, scenario, decision, recordOutcome, simulate, estimate, simulatePolicyEvidence };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.InterventionEstimator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
