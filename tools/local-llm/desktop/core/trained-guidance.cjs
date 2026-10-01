'use strict';
// Frozen September training artefacts. Inference only; never retrain or mutate weights.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../../../../assets/guidance');
const actions=['silence','offer_help','give_light_hint','give_deeper_hint','reduce_branches','review_prerequisite','split_task','suggest_break'];
let bundle=null;
try {
  const raw=fs.readFileSync(path.join(dir,'model/action/weights.json'));
  bundle={weights:JSON.parse(raw),config:JSON.parse(fs.readFileSync(path.join(dir,'model/action/preprocessing.json'))),
    schema:JSON.parse(fs.readFileSync(path.join(dir,'data/feature_schema.json'))),hash:crypto.createHash('sha256').update(raw).digest('hex')};
}catch(_){}
function infer(features) {
  if(!bundle)return {status:'unavailable'};
  const {config:c,weights:w,schema}=bundle;
  if(!features||Object.keys(features).some(k=>!c.feature_order.includes(k)))return {status:'invalid_features'};
  const raw=c.feature_order.map(k=>features[k]??null);
  if(raw.some((v,i)=>v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v<schema.fields[i].min||(schema.fields[i].max!==null&&v>schema.fields[i].max))))return {status:'invalid_features'};
  const mask=raw.map(v=>Number(v!==null));
  let x=raw.map((v,i)=>Math.fround(Math.max(-c.clip_z,Math.min(c.clip_z,((v===null?c.imputation_median[i]:c.log1p_indices.includes(i)?Math.log1p(v):v)-c.mean[i])/c.std[i])))).concat(mask);
  for(let l=0;l<Object.keys(w).length/2;l++) {
    const z=w['b'+l].map((b,j)=>x.reduce((s,v,i)=>s+v*w['W'+l][i][j],b));
    x=l===Object.keys(w).length/2-1?z:z.map(v=>Math.max(0,v));
  }
  const exp=x.map(v=>Math.exp(v-Math.max(...x))),sum=exp.reduce((a,b)=>a+b,0),scores=Object.fromEntries(actions.map((a,i)=>[a,exp[i]/sum]));
  return {status:'inferred',version:'guidance-model-v2-action',weightsHash:bundle.hash,features:Object.fromEntries(c.feature_order.map((k,i)=>[k,raw[i]])),
    observed:mask.reduce((a,b)=>a+b,0),total:29,scores,action:actions[x.indexOf(Math.max(...x))],calibrated:false,
    scope:'辅助提示深度；不用于认知概率、情绪判定或因果效果'};
}
module.exports={infer};
