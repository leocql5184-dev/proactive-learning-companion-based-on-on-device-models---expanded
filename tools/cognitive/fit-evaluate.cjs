'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const C = require('../local-llm/desktop/core/cognitive-state.cjs');
function rng(seed) { return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; }; }
function simulate(seed = 731, students = 120) {
  const random = rng(seed), records = [];
  const truth = { ...C.priorModel, initial: .19, learn: .13, slip: .10, guess: .22, assistedSlip: .07, assistedGuess: .63 };
  for (let n = 0; n < students; n++) for (const topic of C.topics) for (const skillId of topic.skills) {
    let mastered = random() < truth.initial;
    for (let t = 0; t < 12; t++) {
      const assistance = random() < .3 ? 'assisted' : 'independent';
      const p = assistance === 'assisted' ? (mastered ? 1 - truth.assistedSlip : truth.assistedGuess) : (mastered ? 1 - truth.slip : truth.guess);
      const id = `sim-${n}-${skillId}-${t}`;
      records.push({ schemaVersion: 1, id, studentId: `sim-${String(n).padStart(3, '0')}`, familyId: `independent-simulation-${n}`,
        sessionId: `sim-${n}`, attemptId: id, itemId: 'simulated-probe-' + skillId, time: 1700000000000 + t * 86400000, origin: 'synthetic', topic: topic.id, skillId,
        kind: 'answer', outcome: random() < p ? 'correct' : 'incorrect', assistance, conflict: 'none', source: 'synthetic_truth', consent: true });
      if (!mastered && random() < truth.learn) mastered = true;
    }
  }
  return { records, truth };
}
function sequences(records) {
  const groups = new Map();
  for (const e of records) {
    if (!C.eligible(e)) continue;
    const key = JSON.stringify([e.studentId, e.skillId]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return [...groups.values()].map(s => s.sort((a, b) => a.time - b.time || a.id.localeCompare(b.id)));
}
function nll(groups, model) {
  let loss = 0;
  for (const seq of groups) {
    let p = model.initial;
    for (const e of seq) { const u = C.update(p, e, model); loss -= Math.log(u.evidenceLikelihood); p = u.nextPrior; }
  }
  return loss;
}
function fit(records) {
  // Constrained maximum likelihood using deterministic multi-start coordinate search.
  // Only answer emissions are trained; conflict parameters remain explicitly prior-only.
  const groups = sequences(records.filter(e => e.kind === 'answer' && e.conflict === 'none'));
  if (groups.length < 10 || !records.some(e => e.assistance === 'assisted') || !records.some(e => e.assistance === 'independent')) throw Error('Insufficient training trajectories / assistance coverage');
  const keys = ['initial', 'learn', 'slip', 'guess', 'assistedSlip', 'assistedGuess'];
  let best = null;
  for (const start of [.15, .35, .6]) {
    let model = { ...C.priorModel, initial: start }, loss = nll(groups, model);
    for (const step of [.12, .06, .03, .015, .0075, .003]) {
      for (let pass = 0; pass < 12; pass++) {
        let changed = false;
        for (const key of keys) for (const direction of [-1, 1]) {
          const candidate = { ...model, [key]: model[key] + direction * step };
          try { C.validateModel(candidate); } catch { continue; }
          const value = nll(groups, candidate);
          if (value < loss - 1e-8) { model = candidate; loss = value; changed = true; }
        }
        if (!changed) break;
      }
    }
    if (!best || loss < best.loss) best = { model, loss };
  }
  const digest = crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex');
  return { ...best.model, modelVersion: 'bkt-mle-' + digest.slice(0, 12), source: records.every(e => e.origin === 'synthetic') ? 'synthetic_mle' : 'trajectory_mle',
    calibrated: false, fitting: { method: 'constrained_multistart_maximum_likelihood', loss: best.loss, trainingSha256: digest,
      fittedParameters: keys, priorOnlyParameters: ['conflictMastered', 'conflictUnmastered'], studentIds: [...new Set(records.map(e => e.studentId))] } };
}
function metrics(pairs, eligibleCount) {
  if (!pairs.length) return { count: 0, coverage: 0, logLoss: null, brier: null, auroc: null, reliability: [] };
  let logLoss = 0, brier = 0;
  const bins = Array.from({ length: 10 }, (_, i) => ({ lower: i / 10, upper: (i + 1) / 10, count: 0, predicted: 0, observed: 0 }));
  for (const [p0, y] of pairs) {
    const p = Math.max(1e-9, Math.min(1 - 1e-9, p0));
    logLoss -= y * Math.log(p) + (1 - y) * Math.log(1 - p); brier += (p - y) ** 2;
    const bin = bins[Math.min(9, Math.floor(p * 10))]; bin.count++; bin.predicted += p; bin.observed += y;
  }
  const positives = pairs.filter(p => p[1] === 1), negatives = pairs.filter(p => p[1] === 0);
  let wins = 0;
  for (const p of positives) for (const n of negatives) wins += p[0] > n[0] ? 1 : p[0] === n[0] ? .5 : 0;
  return { count: pairs.length, coverage: pairs.length / eligibleCount, logLoss: logLoss / pairs.length, brier: brier / pairs.length,
    auroc: positives.length >= 10 && negatives.length >= 10 ? wins / (positives.length * negatives.length) : null,
    reliability: bins.map(b => ({ ...b, predicted: b.count ? b.predicted / b.count : null, observed: b.count ? b.observed / b.count : null })) };
}
function evaluate(records, model, baseline) {
  const pairs = [], staticPairs = [], perTopic = {};
  for (const seq of sequences(records)) {
    let p = model.initial;
    for (const e of seq) {
      if (e.assistance === 'independent' && e.kind === 'answer' && e.conflict === 'none') {
        const pair = [C.independentPrediction(p, model), Number(e.outcome === 'correct')];
        pairs.push(pair); staticPairs.push([baseline, pair[1]]); (perTopic[e.topic] ||= []).push(pair);
      }
      p = C.update(p, e, model).nextPrior;
    }
  }
  const count = records.filter(e => e.assistance === 'independent' && e.kind === 'answer' && e.conflict === 'none' && e.outcome !== 'unknown').length;
  return { bkt: metrics(pairs, count), staticAccuracy: metrics(staticPairs, count),
    perTopic: Object.fromEntries(Object.entries(perTopic).map(([k, v]) => [k, metrics(v, v.length)])),
    unscoredOrUnsupported: records.filter(e => !C.eligible(e)).length };
}
function demos(model = C.priorModel) {
  const output = {};
  for (const topic of C.topics) {
    output[topic.id] = {};
    for (const mode of ['independent', 'assisted', 'conflict', 'delayed_failure']) {
      const base = { schemaVersion: 1, id: `${topic.id}-${mode}`, studentId: 'demo', sessionId: 'demo', attemptId: `${topic.id}-${mode}`,
        time: 1700000000000, origin: 'synthetic', topic: topic.id, itemId: topic.itemId, skillId: topic.skills.at(-1), kind: 'answer',
        outcome: 'correct', assistance: mode === 'assisted' ? 'assisted' : 'independent', conflict: mode === 'conflict' ? 'verified' : 'none',
        conflictSource: 'synthetic_truth', source: 'synthetic_truth', consent: true };
      const records = [base];
      if (mode === 'delayed_failure') records.push({ ...base, id: base.id + '-transfer', attemptId: base.id + '-transfer', itemId: 'simulated-transfer-' + topic.id, time: base.time + 7 * 86400000, outcome: 'incorrect', transfer: true });
      output[topic.id][mode] = { records, belief: C.replay(records, { studentId: 'demo', origin: 'synthetic', model }) };
    }
  }
  return output;
}
function run(records, output) {
  for (const e of records) C.validate(e);
  if (new Set(records.map(e => e.origin)).size !== 1) throw Error('Do not mix synthetic and real data');
  const allIds = [...new Set(records.map(e => e.studentId))].sort();
  records = allIds.flatMap(id => C.canonical(records, id, records[0].origin));
  if (allIds.length < 15) throw Error('Need at least 15 isolated student trajectories');
  const trainIds = allIds.slice(0, Math.floor(allIds.length * .6)), validationIds = allIds.slice(trainIds.length, Math.floor(allIds.length * .8)), testIds = allIds.slice(trainIds.length + validationIds.length);
  const select = ids => records.filter(e => ids.includes(e.studentId));
  const train = select(trainIds), validation = select(validationIds), test = select(testIds);
  const families = [train, validation, test].map(rows => new Set(rows.map(e => e.familyId).filter(Boolean)));
  if (families.some((set, i) => families.some((other, j) => i !== j && [...set].some(x => other.has(x))))) throw Error('Source family leakage across splits');
  const model = fit(train), independent = train.filter(e => C.eligible(e) && e.assistance === 'independent' && e.conflict === 'none' && e.kind === 'answer');
  const baseline = (1 + independent.filter(e => e.outcome === 'correct').length) / (2 + independent.length);
  const report = { dataStatus: records[0].origin, model, split: { trainIds, validationIds, testIds, seed: 731, chronologicalWithinStudent: true },
    observations: records.length, validation: evaluate(validation, model, baseline), test: evaluate(test, model, baseline),
    limits: ['Simulation validates mechanism, not real learning improvement.', 'No fitted forgetting, difficulty or calibrated neural emissions.',
      'Conflict likelihoods remain engineering priors.', 'Same mathematical domain in all splits; not an unseen-item generalization test.',
      'Interval alone does not cause forgetting; delayed failure supplies the negative evidence.'] };
  fs.mkdirSync(output, { recursive: true });
  for (const [name, value] of Object.entries({ 'model.json': model, 'evaluation.json': report, 'demonstrations.json': demos(), 'fitted-demonstrations.json': demos(model) })) fs.writeFileSync(path.join(output, name), JSON.stringify(value, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'trajectories.jsonl'), records.map(e => JSON.stringify(e)).join('\n') + '\n');
  return report;
}
if (require.main === module) {
  const args = process.argv.slice(2), value = flag => args[args.indexOf(flag) + 1];
  const input = args.includes('--input') ? value('--input') : null;
  const records = input ? fs.readFileSync(input, 'utf8').trim().split(/\r?\n/).map(JSON.parse) : simulate().records;
  const report = run(records, args.includes('--output') ? value('--output') : path.resolve(__dirname, '../../outputs/core-evaluation'));
  console.log(JSON.stringify({ dataStatus: report.dataStatus, observations: report.observations, test: report.test }, null, 2));
}
module.exports = { simulate, sequences, nll, fit, metrics, evaluate, demos, run };
