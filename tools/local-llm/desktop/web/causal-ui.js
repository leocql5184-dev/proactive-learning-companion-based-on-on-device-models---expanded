'use strict';
let causalTopic = 'quadratic', causalSimulation = null, causalNotice = '';
const causalReasons = { no_data: '尚无记录', observational_not_identified: '当前为自主选择的观察记录，尚不能识别因果效果',
  no_overlap: '两种帮助没有足够的可比较机会', missing_outcomes: '后测缺失，不能默认补成答错',
  insufficient_samples: '样本不足', sparse_strata: '分层样本不足', low_effective_sample_size: '有效样本不足',
  invalid_outcome: '后测条件不满足要求', dependent_units: '存在重复学习者，不能按独立样本估计' };
function causalRows() { return state.profile ? state.events.filter(e => e.causal && e.causal.origin === 'real').map(e => e.causal) : []; }
function selectCausalTopic(topic) {
  InterventionEstimator.scenario(topic); causalTopic = topic; causalSimulation = null; causalNotice = ''; renderCausal();
}
function runCausalSimulation() {
  const generated = InterventionEstimator.simulate(causalTopic);
  causalSimulation = { ...InterventionEstimator.estimate(generated.rows, { topic: causalTopic }), truth: generated.truth };
  renderCausal();
}
function causalPending() { return causalRows().filter(d => d.topic === causalTopic && !d.outcome).at(-1); }
function saveCausalEvent(d, existing = false) {
  const events = existing ? state.events.map(e => e.id === d.id ? { ...e, causal: d } : e) : state.events.concat({
    id: d.id, type: 'causal_practice', value: InterventionEstimator.scenario(d.topic).title + ' · 帮助与后测记录',
    task: InterventionEstimator.scenarios.findIndex(s => s.topic === d.topic), time: d.time, causal: d });
  if (!persistRecordChange({ ...state, events: events.slice(-500) })) { causalNotice = '记录保存失败，请检查浏览器存储空间后重试。'; return false; }
  return true;
}
function startCausalPractice(action) {
  if (!state.record || !state.profile || causalPending()) return;
  const time = Date.now(), belief = cognitiveBelief();
  const snapshot = { time, modelVersion: belief?.modelVersion || 'unknown', graphVersion: belief?.graphVersion || 'unknown',
    evidenceIds: belief?.evidenceIds || [], states: Object.fromEntries(Object.entries(belief?.states || {}).map(([id,s]) => [id, { mastery: s.mastery, observations: s.observations }])) };
  const d = InterventionEstimator.decision({ id: 'causal-' + time.toString(36) + '-' + Math.random().toString(36).slice(2), topic: causalTopic,
    time, snapshot, action, consent: true });
  saveCausalEvent(d); renderCausal();
}
function revealCausalPosttest() {
  const d = causalPending(); if (!d || !state.record || !state.profile || d.testShownAt) return;
  saveCausalEvent({ ...d, testShownAt: Date.now(), firstExposure: !causalRows().some(r => r.topic === causalTopic && r.testShownAt) }, true);
  renderCausal();
}
function completeCausalPractice(skip = false) {
  const d = causalPending(); if (!d || !state.record || !state.profile || (!skip && !d.testShownAt)) return;
  const selected = el('causal-answer')?.value;
  if (!skip && (selected === '' || selected === undefined)) { causalNotice = '请选择答案，或选择跳过。'; renderCausal(); return; }
  const next = InterventionEstimator.recordOutcome(d, { time: Date.now(), choice: skip ? null : Number(selected),
    independent: !skip && el('causal-independent')?.checked === true, firstExposure: d.firstExposure === true });
  if (saveCausalEvent(next, true)) causalNotice = next.outcome.y === null ? '后测未计分：跳过、重复题目、超时或未确认独立作答。' : next.outcome.y ? '本次迁移核查答对；单次结果不代表已经掌握。' : '本次迁移核查尚未答对，可继续回到学习页练习。';
  renderCausal();
}
function renderCausal() {
  const E = InterventionEstimator, s = E.scenario(causalTopic), d = causalPending();
  const pct = n => (n * 100).toFixed(1) + ' 个百分点';
  const real = E.estimate(causalRows(), { topic: causalTopic, origin: 'real' });
  let simulation = '';
  if (causalSimulation) {
    const r = causalSimulation;
    simulation = r.status === 'simulation_estimate' ? '<dl><dt>模拟预设真值</dt><dd>' + pct(r.truth) + '</dd><dt>直接比较成功率</dt><dd>' + pct(r.naive) +
      '</dd><dt>逆概率加权 IPS</dt><dd>' + pct(r.ips.value) + '</dd><dt>交叉拟合结果模型</dt><dd>' + pct(r.direct) +
      '</dd><dt>双重稳健 DR</dt><dd>' + pct(r.dr.value) + '</dd><dt>DR 约 95% 区间</dt><dd>' + r.dr.interval95.map(pct).join(' 至 ') +
      '</dd></dl><p class="muted">4,000 名独立模拟学习者；固定种子 42。两组有效样本量 ' + r.effectiveSampleSize.map(n => n.toFixed(0)).join(' / ') +
      '，缺测率 0%。区间使用独立样本渐近近似。正值表示概念核查更好，仅适用于这个模拟环境。</p>' : '<p>' + esc(causalReasons[r.reason] || r.reason) + '</p>';
  }
  let practice = '<p>先在设置开启学习记录，并在成长页开启成长记录，再体验帮助与后测。</p>';
  if (state.record && state.profile) {
    practice = !d ? '<p>自主选择一种帮助；这不是随机实验。题目为工程编写的迁移核查草案，每题只提供一个版本，重复作答不算新的独立迁移证据。</p>' +
      E.actions.map((a,i) => '<button class="secondary" onclick="startCausalPractice(\'' + a + '\')">' + E.actionLabels[i] + '</button>').join(' ') :
      !d.testShownAt ? '<p>' + esc(s.help[E.actions.indexOf(d.action)]) + '</p><button class="primary" onclick="revealCausalPosttest()">读完帮助，独立核查</button><button class="secondary" onclick="completeCausalPractice(true)">跳过后测</button>' :
      '<p>' + esc(s.test) + '</p><label>选择答案 <select id="causal-answer"><option value="">请选择</option>' + s.options.map((o,i) => '<option value="' + i + '">' + esc(o) + '</option>').join('') +
      '</select></label><p><label><input id="causal-independent" type="checkbox"> 我确认本题未再使用提示，也未在其他地方见过本题或答案</label></p>' +
      '<p class="muted">独立条件来自本人确认，系统无法验证外部帮助。请在选择帮助后 30 分钟内完成。</p><button class="primary" onclick="completeCausalPractice()">提交后测</button> <button class="secondary" onclick="completeCausalPractice(true)">跳过</button>';
  }
  el('content').innerHTML = '<button class="secondary" onclick="goBack()">返回上一页</button><h1>帮助方式与后测</h1>' +
    '<div class="chips">' + E.scenarios.map(t => '<button aria-pressed="' + (t.topic === causalTopic) + '" onclick="selectCausalTopic(\'' + t.topic + '\')">' + t.title + '</button>').join('') + '<button type="button">查看更多</button></div>' +
    (typeof renderActiveDemoPanel === 'function' ? renderActiveDemoPanel() : '') +
    '<div class="panel"><h2>' + s.title + ' · 模拟计算</h2><p>假设结构：帮助前基础 → 帮助选择；帮助前基础 → 后测；帮助方式 → 后测。</p>' +
    '<p>模拟中，困难学习者更常收到概念核查。直接比较成功率会混入原有基础差异。IPS / DR 利用已知分配概率进行校正。</p><button class="secondary" onclick="runCausalSimulation()">运行本题模拟</button>' + simulation +
    '<p class="muted">模拟结果不会写入个人画像，也不证明真实教学效果。</p></div><div class="panel"><h2>本机练习 · ' + s.title + '</h2>' + practice +
    (causalNotice ? '<p role="status">' + esc(causalNotice) + '</p>' : '') + '</div><div class="panel"><h2>真实证据状态</h2><p>' + esc(causalReasons[real.reason] || real.reason) +
    '。</p><p>当前保留 ' + (real.count || 0) + ' 次帮助记录，后测待完成或不可用 ' + (real.missing || 0) + ' 次。</p><p class="muted">缺测不算失败，自主选择不补造分配概率。删除记录后重新统计。</p><button class="secondary" onclick="openLocalRecords(\'help\')">查看或删除记录</button></div>' + recordCategoryPanel('help', '帮助与后测记录');
}
