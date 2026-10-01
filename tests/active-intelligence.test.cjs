'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const S=require('../tools/local-llm/desktop/core/symbolic-reasoner.cjs');
const N=require('../tools/local-llm/desktop/core/neural-evidence.cjs');
const F=require('../tools/local-llm/desktop/core/probabilistic-reasoner.cjs');
const P=require('../tools/local-llm/desktop/core/intervention-planner.cjs');
const E=require('../tools/local-llm/desktop/core/intervention-estimator.cjs');
test('bounded AST evaluates arithmetic, rejects code, unbound variables and dangerous ranges',()=>{
  assert.equal(S.value(S.parse('a^2-2*a+2'),{a:2}),2);
  assert.equal(S.relation('10²=x',{x:100}).valid,true);
  assert.equal(S.value(S.parse('-x^2'),{x:2}),-4);
  assert.equal(S.value(S.parse('(-x)^2'),{x:2}),4);
  for(const x of ['process.exit()','a.constructor','2**100','2^100','1/0','((((((((((((((2))))))))))))))'])assert.throws(()=>S.value(S.parse(x),{}));
});
const cases=[
  [0,'k<1','MISSING_PREMISE'],[0,'k=0也可以','VERIFIED_CONFLICT'],[0,'k<1且k≠0','VERIFIED_VALID'],
  [0,'k不等于0且k小于1','VERIFIED_VALID'],[1,'x=100，因为10²=x','VERIFIED_VALID'],
  [1,'x²=10','VERIFIED_CONFLICT'],[1,'10²=x','VERIFIED_VALID'],[1,'x=100','VERIFIED_VALID'],
  [2,'a=2,b=2时最大值为4','VERIFIED_CONFLICT'],[2,'最大值为5','VERIFIED_CONFLICT'],[2,'4','MISSING_PREMISE'],
  [2,'固定a,b取0或2,比较a^2和a^2-2*a+2,上界为4,a=2,b=0取到','VERIFIED_VALID']
];
for(const [task,text,status] of cases)test(`symbolic ${task}: ${text}`,()=>assert.equal(S.check(task,text).status,status));
test('missing premises, quotations, hypothetical statements and out-of-domain claims stay bounded',()=>{
  for(const [t,text] of [[1,'不是x²=10'],[1,'如果x²=10会怎样？'],[0,'例如k=0'],[2,'我不知道怎么做'],[3,'x=100']])assert.equal(S.check(t,text).status,'UNKNOWN');
  assert.equal(S.check(1,'x=x').status,'UNKNOWN');
});
test('neural quotes must match a full original assertion, no negation stripping or invented evidence',()=>{
  assert.equal(N.validate({claims:[{quote:'x²=10',kind:'assertion'}]},'不是x²=10').claims.length,0);
  assert.equal(N.validate({claims:[{quote:'x=100',kind:'assertion'}]},'x²=10').claims.length,0);
  assert.equal(N.validate({claims:[{quote:'x²=10',kind:'assertion'}]},'x²=10').claims.length,1);
});
test('factor enumeration normalizes, conflict replaces answer and uncertainty does not update',()=>{
  const symbolic=S.check(1,'x²=10');
  const r=F.infer({prior:.6,symbolic,assistance:'independent',answerOutcome:'correct'});
  const expected=.6*.08/(.6*.08+.4*.55);
  assert.ok(Math.abs(r.posterior-expected)<1e-12);
  assert.ok(Math.abs(r.trace.reduce((n,x)=>n+x.mass/r.normalizer,0)-1)<1e-12);
  assert.equal(F.infer({prior:.6,symbolic,assistance:'unknown'}).updated,false);
  assert.equal(F.infer({prior:null,symbolic:S.check(0,'k<1'),assistance:'independent'}).posterior,null);
});
test('symbolic and cognitive ablations change a real decision without inventing causal effects',()=>{
  const symbolic=S.check(1,'x²=10'), belief=F.infer({prior:.6,symbolic,assistance:'independent',answerOutcome:'correct'});
  const full=P.plan({task:1,trigger:'explanation',symbolic,belief});
  assert.equal(full.action,'step_hint');
  assert.equal(P.plan({task:1,trigger:'explanation',symbolic,belief,ablateCognitive:true}).action,'concept_check');
  assert.equal(P.plan({task:1,trigger:'explanation',symbolic:{status:'UNKNOWN'},belief}).timing,'STAY_QUIET');
  assert.equal(full.effects.status,'not_estimable');
});
test('posttest pools cover all three topics, avoid repeat exposure and exhaust explicitly',()=>{
  for(let task=0;task<3;task++) {
    const first=P.posttest(task);const second=P.posttest(task,[first.id]);
    assert.notEqual(first.id,second.id);assert.equal(P.posttest(task,P.tests[task].map(t=>t.id)),null);
    assert.ok(first.answer>=0&&first.answer<first.options.length);
  }
  // Independent mathematics for maximum tasks: fix a, choose b endpoint, then convex a endpoints.
  for(const limit of [1,3]) {
    let max=-Infinity;
    for(const a of [0,limit])for(const b of [0,limit])max=Math.max(max,a*a-a+Math.abs(b-a));
    assert.equal(max,limit*limit);
  }
});
test('causal method and timing affect simulated decisions only; actual deterministic assignment remains unknown',()=>{
  for(let task=0;task<3;task++) {
    const symbolic={status:'VERIFIED_CONFLICT'},belief={posterior:.2};
    const effects=E.simulatePolicyEvidence(P.topics[task]);
    const input={task,trigger:'submission',symbolic,belief,effects,origin:'synthetic'};
    assert.equal(P.plan(input).action,'concept_check');
    assert.equal(P.plan({...input,ablateCausal:true}).action,'step_hint');
    const deferred=P.plan({...input,effects:E.simulatePolicyEvidence(P.topics[task],{timingBenefit:0})});
    assert.equal(deferred.timing,'DEFER');
    const real=P.plan({...input,origin:'real'});assert.equal(real.action,'step_hint');assert.equal(real.mode,'conservative_fallback');
  }
});
