'use strict';
const evidenceOpen=new Set();
function toggleGuidanceEvidence(id) {
  const panel=el('evidence-'+id),button=el('evidence-button-'+id);
  if(!panel)return;
  if(evidenceOpen.has(id))evidenceOpen.delete(id);else evidenceOpen.add(id);
  panel.hidden=!evidenceOpen.has(id);button?.setAttribute?.('aria-expanded',String(!panel.hidden));
}
function guidanceEvidence(d) {
  const pct=x=>Number.isFinite(x)?(x*100).toFixed(1)+'%':'待了解';
  const statuses={VERIFIED_VALID:'已核查的关系成立',VERIFIED_CONFLICT:'发现可验证的矛盾',MISSING_PREMISE:'尚缺必要条件或论证',UNKNOWN:'现有表达不足以作数学判断'};
  const reasons={real_timing_effect:'历史随机比较支持本次暂缓；比较的是再次提交，不是知识提升',verified_conflict:'发现数学矛盾，结合知识观察选择提示深度',missing_premise:'缺少条件，先请你核查',verified_progress:'本轮关系成立，保持安静',pause_is_ambiguous:'停顿可能是在思考，先征询是否需要帮助',no_verified_need:'没有足够证据表明需要打断'};
  const rules={quadratic_domain_and_discriminant:'同时检查二次项系数不为零与判别式大于零',missing_quadratic_degree_condition:'尚未说明二次项系数不能为零',degree_degenerates:'k=0 时方程退化为一次方程',distinct_roots_require_positive_discriminant:'判别式等于零时没有两个不相等的实根',counterexample_to_equivalence:'用满足原题的 x=100 检查改写是否等价',base10_definition:'按常用对数定义核对底数、指数与真数',domain_check:'候选取值必须在题目区间内',evaluate_feasible_pair:'代入所给 a、b，比较实际值与声称值',feasible_value_does_not_prove_upper_bound:'能取到一个值，还需证明其他值不会更大',piecewise_convex_endpoint_bound:'分段并比较端点，核查上界和可达性',answer_without_bound:'已有数值答案，尚缺上界和可达性说明',convex_in_b_then_convex_in_a:'先比较 b 的端点，再核对 a 的端点和取值点'};
  const findings=d.reasoning.findings||[],trace=d.reasoning.trace||[],trained=d.reasoning.trained;
  // Show the evidence and calculation, including for saved records, without runtime file metadata.
  const trainedDetails=trained?{status:trained.status,observed:trained.observed,total:trained.total,features:trained.features,
    scores:trained.scores,action:trained.action,calibrated:trained.calibrated}:undefined;
  const effects=d.realEffects||{},effectText=Object.entries(effects).map(([kind,e])=>{
    if(!e||e.status!=='randomized_estimate')return (kind==='method'?'帮助方式':'提醒时机')+'：尚无已完成的可比较记录';
    return (kind==='method'?'概念核查 − 分步提示':'立即邀请 − 暂缓')+'：'+e.count+' 次，'+e.missing+' 次结果缺失；效果区间 '+pct(e.interval[0])+' 至 '+pct(e.interval[1])+'（百分点差异）'+(e.supported?'，支持比较':'，证据尚不确定');
  }).join('；');
  const modelText=trained?.status==='inferred'?'已运行本地动作模型；'+trained.observed+'/29 项输入有观测，建议 '+({silence:'保持安静',offer_help:'征询帮助',give_light_hint:'较浅提示',give_deeper_hint:'更深提示',reduce_branches:'减少路线',review_prerequisite:'复习基础',split_task:'拆分任务',suggest_break:'休息'}[trained.action]||trained.action)+'。'+(d.plan.trainedApplied?'用于本次帮助深度的辅助选择。':'本次未改变帮助选择。'):'训练模型本轮不可用，使用已核查的数学与知识证据。';
  const outcome=d.outcome?d.outcome.y===null?'尚无有效的独立核查结果（跳过、超时或条件不足）；不计为成功。':d.outcome.y===1?'新题独立核查答对；一次结果不能证明帮助有效。':'新题独立核查尚未答对，需要继续确认。':d.response==='accepted'?'等待后续独立核查。':d.response==='not_offered'?'本次未交付帮助，没有帮助后测。':'等待接受帮助及后续独立核查。';
  const sections=[
    ['本轮证据',findings.length?findings.map(f=>'“'+f.span+'”').join('；'):d.trigger==='pause'?'应用内出现符合条件的停顿；未读取未提交草稿。':'本轮提交未提取到可验证的数学陈述。',
      '神经提取：'+(d.reasoning.neural?.status==='quoted_candidates'?'本地模型提取并通过原文引用检查':'未采用模型引用，使用本地核查或保留未知')],
    ['数学核查',statuses[d.reasoning.status]||'待核查',trace.map(t=>rules[t.rule]||'数学约束检查').join('；')||'暂未形成可验证的证明或反例。'],
    ['当前知识观察',(CognitiveState.labels[d.reasoning.skillId]||'相关知识')+'（后验试算）：'+pct(d.belief.prior)+' → '+pct(d.belief.posterior),
      (d.belief.updated?'本轮证据参与概率更新。':'本轮没有可靠的新证据用于更新。')+'独立与辅助作答分别处理；概率使用未校准工程参数。'],
    ['帮助选择依据',reasons[d.plan.reason]||'结合数学证据、知识观察和帮助效果选择',
      (d.study?.method?'已接受帮助后，以各 50% 概率分配两种适用方式。':d.study?.timing?'本次停顿以各 50% 概率分配立即邀请或暂缓。':'')+modelText+' '+(effectText||'尚无真实随机比较证据，当前按数学与知识依据选择。')],
    ['后续验证结果',outcome,'主观反馈：'+({helpful:'有帮助',unhelpful:'没帮上忙',other:'其他',unknown:'尚未反馈'}[d.feedback]||'尚未反馈')+(d.feedback==='other'&&d.feedbackText?'——'+d.feedbackText:'')+(d.study?.timing?'；时机评估观察五分钟内是否再次提交，不等同于知识提升。':'')]
  ];
  return '<button class="secondary" id="evidence-button-'+esc(d.id)+'" aria-expanded="'+evidenceOpen.has(d.id)+'" aria-controls="evidence-'+esc(d.id)+'" onclick="toggleGuidanceEvidence(\''+esc(d.id)+'\')">引导证据</button>'+
    '<div id="evidence-'+esc(d.id)+'" '+(evidenceOpen.has(d.id)?'':'hidden')+' class="guidance-evidence"><p class="muted">本轮证据 → 数学核查 → 当前知识观察 → 帮助选择依据 → 后续验证结果</p><ol style="padding-left:24px">'+sections.map(([title,body,note])=>'<li style="margin:16px 0;padding-left:4px"><strong>'+title+'</strong><p>'+esc(body)+'</p><p class="muted">'+esc(note)+'</p></li>').join('')+'</ol><details><summary>查看计算明细</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px">'+esc(JSON.stringify({proof:trace,probability:d.belief,trainedModel:trainedDetails,assignment:d.study,effects,versions:{symbolic:d.reasoning.version,policy:d.policyVersion},evidenceIds:d.evidenceIds},null,2))+'</pre></details></div>';
}

renderActiveCard();
