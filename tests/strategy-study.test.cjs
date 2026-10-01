'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../tools/local-llm/desktop/web/strategy-study.js');
const P=require('../tools/local-llm/desktop/web/intervention-planner.js');
const M=require('../tools/local-llm/desktop/core/trained-guidance.cjs');
function fixture(kind,n=200,positive=true) {
  return Array.from({length:n},(_,i)=>{const r=S.assign(kind,i*S.windows[kind],i%2?.75:.25);
    r.outcome={y:Number((r.action===S.arms[kind][0])===positive),time:r.due,independent:true,source:kind==='method'?'engineering_reviewed_answer':'new_registered_submission'};
    return {id:'fixture-'+i,origin:'real',task:0,study:{[kind]:r}};});
}
test('randomized estimator handles repeated learner windows and changes real policy only on supported evidence',()=>{
  const method=S.estimate(fixture('method'),'method',0,Infinity);
  assert.equal(method.supported,true);assert.equal(method.estimate,1);
  const input={task:0,trigger:'submission',symbolic:{status:'VERIFIED_CONFLICT'},belief:{posterior:.1},realEffects:{method}};
  assert.equal(P.plan(input).action,'concept_check');assert.equal(P.plan({...input,ablateCausal:true}).action,'step_hint');
  const timing=S.estimate(fixture('timing',200,false),'timing',0,Infinity);
  assert.equal(P.plan({...input,trigger:'pause',realEffects:{timing}}).timing,'DEFER');
  assert.equal(P.plan({...input,realEffects:{method:{...method,origin:'synthetic'}}}).action,'step_hint');
});
test('missing, censored, pending, overlapping, selected and duplicate data cannot manufacture effects',()=>{
  const rows=fixture('method');rows.forEach(d=>{d.study.method.outcome=null;});
  const e=S.estimate(rows,'method',0,Infinity);assert.deepEqual(e.interval,[-1,1]);assert.equal(e.estimate,null);assert.equal(e.supported,false);
  assert.equal(S.estimate(fixture('method',1),'method',0,1).count,0);
  const bad=fixture('method',2);bad[1].study.method.time=1;assert.equal(S.estimate(bad,'method',0,Infinity).status,'not_estimable');
  const selected=fixture('method',2);selected[0].study.method.propensity=null;assert.equal(S.estimate(selected,'method',0,Infinity).status,'not_estimable');
  const conflict=fixture('method',1);conflict.push({...conflict[0],task:0,extra:1});assert.equal(S.estimate(conflict,'method',0,Infinity).reason,'conflicting_id');
});
test('trained model uses original preprocessing and missing masks, cannot override math or strong knowledge evidence',()=>{
  const m=M.infer({answer_count:4,incorrect_count:3,correct_count:1,decision_offset_ms:100000,observed_span_ms:90000,last_event_gap_ms:10000});
  assert.equal(m.status,'inferred');assert.equal(m.observed,6);assert.equal(m.features.active_time_ms,null);
  assert.ok(Math.abs(Object.values(m.scores).reduce((a,b)=>a+b,0)-1)<1e-10);
  assert.equal(M.infer({answer_count:-1}).status,'invalid_features');
  const trained={status:'inferred',observed:8,action:'split_task',scores:{split_task:.9}};
  const input={task:0,trigger:'submission',symbolic:{status:'VERIFIED_CONFLICT'},belief:{posterior:.5},trained};
  assert.equal(P.plan(input).action,'step_hint');assert.equal(P.plan({...input,ablateTrained:true}).action,'concept_check');
  assert.equal(P.plan({...input,symbolic:{status:'VERIFIED_VALID'}}).timing,'STAY_QUIET');
  assert.equal(P.plan({...input,trained:{...trained,observed:2}}).action,'concept_check');
});
test('all generated variants have unique options and independently checked mathematical answers',()=>{
  for(const [task,pool] of P.tests.entries()) {
    assert.ok(pool.length>=60);assert.equal(new Set(pool.map(t=>t.id)).size,pool.length);
    for(const t of pool){assert.equal(new Set(t.options).size,4);if(!t.parameters)continue;
      const p=t.parameters;
      if(task===0){const discriminant=4*p.n*p.n-4*(p.n-1)*p.n;assert.ok(discriminant>0);assert.equal(t.options[t.answer],`t<${p.n} 且 t≠0`);}
      if(task===1)assert.equal(Number(t.options[t.answer]),Array.from({length:p.exponent}).reduce(v=>v*p.base,1));
      if(task===2){const l=p.limit,max=Math.max(...[0,l].flatMap(a=>[0,l].map(b=>a*a-a+Math.abs(b-a))));assert.equal(Number(t.options[t.answer]),max);}
    }
  }
});
