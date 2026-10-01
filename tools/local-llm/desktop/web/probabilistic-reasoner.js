'use strict';
(function(root){
  const version='joint-evidence-enumeration-v1';
  function infer({prior=null,symbolic,assistance='unknown',answerOutcome='unknown',ablateSymbolic=false}) {
    const p=Number.isFinite(prior)&&prior>=0&&prior<=1?prior:.25;
    const status=ablateSymbolic?'UNKNOWN':symbolic.status;
    // K=knowledge, T=truth of the asserted proposition. Verified constraints clamp T, not K.
    // One joint emission: a verified conflict supersedes the answer from the same attempt.
    let observation=null, source='none';
    if(status==='VERIFIED_CONFLICT') { observation=0;source='verified_symbolic_claim'; }
    else if(status==='VERIFIED_VALID') { observation=1;source='verified_symbolic_claim'; }
    else if(answerOutcome!=='unknown') {observation=Number(answerOutcome==='correct');source='answer_key';}
    const assisted=assistance==='assisted', unknown=assistance==='unknown';
    const truthGivenK=status==='VERIFIED_CONFLICT'?[.45,.92]:[assisted?.65:.25,assisted?.92:.88];
    const rows=[];
    for(let k=0;k<2;k++) for(let t=0;t<2;t++) {
      const priorMass=k?p:1-p, likelihood=t?truthGivenK[k]:1-truthGivenK[k];
      const constraint=observation===null||unknown?1:Number(t===observation);
      rows.push({k,t,priorMass,likelihood,constraint,mass:priorMass*likelihood*constraint});
    }
    const z=rows.reduce((s,r)=>s+r.mass,0), posterior=rows.filter(r=>r.k===1).reduce((s,r)=>s+r.mass,0)/z;
    return {version,prior:prior===null?null:p,posterior:observation===null||unknown?prior:posterior,
      source,observation:unknown?null:observation,updated:observation!==null&&!unknown,
      uncertainty:'uncalibrated_engineering_likelihoods',status,trace:rows,normalizer:z};
  }
  const api={version,infer}; if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.ProbabilisticReasoner=api;
})(typeof globalThis!=='undefined'?globalThis:this);
