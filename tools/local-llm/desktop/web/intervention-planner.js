'use strict';
(function(root){
  const version='active-evidence-v2';
  const topics=['quadratic','log','maximum'];
  const texts=[
    {clarify:'要不要核查一下，什么时候它仍是一元二次方程？',concept_check:'要不要一起检查两个实根需要同时满足哪些条件？',step_hint:'要不要把系数条件和判别式拆成两步检查？',
      concept:'先分别说出“一元二次”和“两个不相等的实根”的条件，再判断它们是否需要同时成立。',
      steps:['先找二次项系数，判断它能否为零。','再写出判别式，并确定两个不相等的实根对应的关系。','最后取两个条件的交集，检查边界。']},
    {clarify:'要不要用一个指数等式说明你的答案？',concept_check:'要不要核查一下，底数、指数和真数分别对应什么？',step_hint:'要不要从底数开始，把对数式分步改写？',
      concept:'请用自己的话说明 lg x=2 中底数、真数、结果各是什么，再写成指数等式。',
      steps:['先确定 lg 的底数。','把“底数的结果次方等于真数”写成等式。','再求 x，并检查它是否为正数。']},
    {clarify:'要不要检查一下，这个候选值能否取到，以及是否还有更大的值？',concept_check:'要不要检查一下，各部分的最大值能否在同一组变量上取到？',step_hint:'要不要先固定一个变量，再比较端点？',
      concept:'先给出一组使候选值成立的 a、b，再说明为什么其他允许取值不能更大。分别取到的极值不一定能同时实现。',
      steps:['先固定 a，把 |b−a| 看成 b 到 a 的距离。','比较 b 在区间两端时的表达式。','再比较各表达式在 a 的允许区间上的候选最大值，核对能否取到。']}
  ];
  const tests=[
    [{id:'quadratic-transfer-2',text:'关于 x 的一元二次方程 mx²−6x+3=0 有两个不相等的实根，m 的范围是？',options:['m<3','m<3 且 m≠0','m≤3 且 m≠0','m>3'],answer:1,skill:'joint_conditions'},
     {id:'quadratic-transfer-3',text:'关于 x 的一元二次方程 tx²−2x+2=0 有两个不相等的实根，t 的范围是？',options:['t<1','t≤1/2','t<1/2 且 t≠0','t>1/2'],answer:2,skill:'joint_conditions'}],
    [{id:'log-transfer-2',text:'log₂x=5，x 等于多少？',options:['10','25','32','1/32'],answer:2,skill:'log_exponent'},
     {id:'log-transfer-3',text:'log₅x=3，x 等于多少？',options:['15','125','243','1/125'],answer:1,skill:'log_exponent'}],
    [{id:'maximum-transfer-2',text:'a,b∈[0,1]，a²−a+|b−a| 的最大值是多少？',options:['1','2','3','4'],answer:0,skill:'attainable_maximum'},
     {id:'maximum-transfer-3',text:'a,b∈[0,3]，a²−a+|b−a| 的最大值是多少？',options:['3','6','9','12'],answer:2,skill:'attainable_maximum'}]
  ];
  // Reviewed parameter families; stable IDs avoid reusing previously shown variants.
  for(let n=4;n<=67;n++) {
    const rotate=(correct,wrong)=>{const options=[correct,...wrong],answer=n%4;return {options:options.slice(4-answer).concat(options.slice(0,4-answer)),answer};};
    tests[0].push({id:'quadratic-family-'+n,text:`关于 x 的一元二次方程 tx²−${2*n}x+${n}=0 有两个不相等的实根，t 的范围是？`,
      ...rotate(`t<${n} 且 t≠0`,[`t<${n}`,`t≤${n} 且 t≠0`,`t>${n}`]),skill:'joint_conditions',parameters:{n}});
    const base=2+Math.floor((n-4)/8),exponent=2+(n-4)%8;
    if(!(base===2&&exponent===5)&&!(base===5&&exponent===3)&&!(base===3&&exponent===4))tests[1].push({id:`log-family-${base}-${exponent}`,text:`log${'₀₁₂₃₄₅₆₇₈₉'[base]}x=${exponent}，x 等于多少？`,
      ...rotate(String(base**exponent),[String(base**exponent-1),String(base**exponent+1),String(base**exponent+base)]),skill:'log_exponent',parameters:{base,exponent}});
    tests[2].push({id:'maximum-family-'+n,text:`a,b∈[0,${n}]，a²−a+|b−a| 的最大值是多少？`,
      ...rotate(String(n*n),[String(n*n-1),String(n*n+1),String(n)]),skill:'attainable_maximum',parameters:{limit:n}});
  }
  function plan({task,trigger,symbolic,belief,effects=null,realEffects=null,trained=null,origin='real',ablateCognitive=false,ablateCausal=false,ablateTrained=false}) {
    const base={version,task,topic:topics[task],timing:'STAY_QUIET',action:null,reason:'unsupported_topic',mode:'conservative_fallback',
      effects:origin==='real'&&effects?.status==='not_estimable'?effects:{status:'not_estimable',reason:'observational_not_identified'},candidates:[],belief};
    if(!topics[task]) return base;
    let action=null,reason='no_verified_need';
    const p=ablateCognitive?null:belief.posterior;
    if(symbolic.status==='VERIFIED_CONFLICT') {action=p!==null&&p<.35?'step_hint':'concept_check';reason='verified_conflict';}
    else if(symbolic.status==='MISSING_PREMISE') {action='clarify';reason='missing_premise';}
    else if(symbolic.status==='VERIFIED_VALID') reason='verified_progress';
    else if(trigger==='pause' && (p===null||p<.65)) {action='clarify';reason='pause_is_ambiguous';}
    // The classifier only advises depth in an uncertain knowledge band.
    if(!ablateTrained&&origin==='real'&&symbolic.status==='VERIFIED_CONFLICT'&&p!==null&&p>=.25&&p<=.65&&trained?.status==='inferred'&&trained.observed>=6) {
      const mapped={give_light_hint:'concept_check',review_prerequisite:'concept_check',give_deeper_hint:'step_hint',split_task:'step_hint'}[trained.action];
      if(mapped&&trained.scores?.[trained.action]>=.55){base.trainedApplied=action!==mapped;action=mapped;}
    }
    const validEffect=e=>e?.origin==='real'&&e.version==='randomized-proximal-v1'&&e.status==='randomized_estimate'&&e.supported===true&&e.count>=30&&Array.isArray(e.interval)&&e.interval.length===2&&e.interval.every(Number.isFinite);
    if(!ablateCausal&&origin==='real'&&action) {
      if(trigger==='pause'&&validEffect(realEffects?.timing)&&realEffects.timing.interval[1]<0)
        return {...base,action,timing:'DEFER',reason:'real_timing_effect',mode:'real_causal',effects:realEffects};
      if(action!=='clarify'&&validEffect(realEffects?.method)) {
        const e=realEffects.method;
        if(e.interval[0]>0||e.interval[1]<0){action=e.interval[0]>0?'concept_check':'step_hint';base.mode='real_causal';base.effects=realEffects;base.trainedApplied=false;}
      }
    }
    // Only validated synthetic effect packages can drive synthetic demonstrations. Real logs have
    // no identified effect, so a fabricated estimate or origin cannot enable a real recommendation.
    if(!ablateCausal && origin==='synthetic' && effects?.origin==='synthetic' && effects?.timing?.status==='simulation_estimate' && effects?.method?.status==='simulation_estimate') {
      base.effects=effects; base.mode='simulation';
      base.utility={disruptionCost:.02,parameterSource:'engineering_cost',offerLowerBound:effects.timing.dr.interval95[0]-.02,defer:0};
      if(action && base.utility.offerLowerBound <= 0) {base.timing='DEFER';base.reason='uncertain_benefit_vs_disruption';base.candidates=[{action:'DEFER',utility:0}];return base;}
      if(action && action!=='clarify') action=effects.method.dr.interval95[0]>.02?'concept_check':effects.method.dr.interval95[1]<-.02?'step_hint':action;
    }
    base.reason=reason;
    base.candidates=[{action:'STAY_QUIET',basis:'avoid_unnecessary_interruptions'},...['clarify','concept_check','step_hint'].map(a=>({action:a,eligible:!!action,basis:reason}))];
    if(action) {base.action=action;base.timing='OFFER';base.invitation=texts[task][action];}
    return base;
  }
  function posttest(task,seen=[]) {return tests[task]?.find(t=>!seen.includes(t.id))||null;}
  const api={version,topics,texts,tests,plan,posttest};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.InterventionPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this);
