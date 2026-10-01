'use strict';
(function(root){
  const version='randomized-proximal-v1';
  const arms={method:['concept_check','step_hint'],timing:['offer_now','defer']};
  const windows={method:1800000,timing:300000};
  function assign(kind,time,draw=Math.random()) {
    if(!arms[kind]||!Number.isFinite(time)||!Number.isFinite(draw)||draw<0||draw>=1)throw Error('invalid_assignment');
    return {version,kind,time,due:time+windows[kind],action:arms[kind][draw<.5?0:1],propensity:.5,
      baseline:[.5,.5],consent:true,outcome:null,endpoint:kind==='method'?'independent_transfer_correct':'new_submission_within_5_minutes'};
  }
  function estimate(decisions,kind,task,now=Date.now()) {
    if(!arms[kind]||!Number.isInteger(task)||task<0||task>2)return {status:'not_estimable',reason:'unsupported_comparison'};
    // Fixed 1/2 baseline DR score is +/-1 with balanced assignment. Martingale
    // Hoeffding bounds allow repeated learners and history-dependent potential outcomes.
    // Union bound covers all n and all six (topic, comparison) streams.
    const records=decisions.filter(d=>d.origin==='real'&&d.task===task&&d.study?.[kind]);
    const seen=new Map();
    for(const d of records){if(seen.has(d.id)&&JSON.stringify(seen.get(d.id))!==JSON.stringify(d))return {status:'not_estimable',reason:'conflicting_id'};seen.set(d.id,d);}
    const rows=[...seen.values()].map(d=>d.study[kind]).sort((a,b)=>a.time-b.time);
    if(rows.some((r,i)=>r.version!==version||r.kind!==kind||!r.consent||r.propensity!==.5||!arms[kind].includes(r.action)||r.due!==r.time+windows[kind]||!Number.isFinite(r.time)||(i&&r.time<rows[i-1].due)))return {status:'not_estimable',reason:'invalid_or_overlapping_design'};
    // Only matured windows, never outcome-dependent early inclusion.
    const closed=rows.filter(r=>r.due<=now),n=closed.length;
    if(!n)return {status:'collecting',kind,count:0,pending:rows.length,reason:'awaiting_completed_windows'};
    let low=0,high=0,missing=0;
    for(const r of closed){const y=r.outcome?.y,valid=[0,1].includes(y)&&!r.outcome.missingReason&&(kind!=='method'||r.outcome.independent===true)&&Number.isFinite(r.outcome.time)&&r.outcome.time>=r.time&&r.outcome.time<=r.due;
      if(!valid){low--;high++;missing++;}else {const s=(r.action===arms[kind][0]?1:-1)*2*(y-.5);low+=s;high+=s;}}
    const alpha=.05/(6*n*(n+1)),radius=Math.sqrt(2*Math.log(2/alpha)/n);
    const interval=[Math.max(-1,low/n-radius),Math.min(1,high/n+radius)];
    return {status:'randomized_estimate',version,kind,origin:'real',count:n,pending:rows.length-n,missing,
      estimate:missing?null:low/n,interval,missingBounds:[low/n,high/n],radius,
      supported:n>=30&&(interval[0]>0||interval[1]<0),
      target:kind==='method'?'已接受帮助且两种方式适用时的平均近端效果':'可提醒时点五分钟内再次提交的平均效果',
      uncertainty:'time_uniform_martingale_95_familywise; missing outcomes worst case; no iid learner assumption',
      evidenceIds:[...seen.values()].filter(d=>d.study[kind].due<=now).map(d=>d.id)};
  }
  const api={version,arms,windows,assign,estimate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StrategyStudy=api;
})(typeof globalThis!=='undefined'?globalThis:this);
