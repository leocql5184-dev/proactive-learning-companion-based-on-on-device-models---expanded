// Real local inference smoke test; run separately from node --test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const baseline=require('../tools/local-llm/desktop/baseline.cjs');
const flow=require('../tools/local-llm/desktop/web/learning-flow.js');
const origin=process.env.COMPANION_TEST_ORIGIN || 'http://127.0.0.1:8875';
(async()=>{
  for (let i=0;i<120;i++) {
    const health=await fetch(origin+'/api/health').then(r=>r.json());
    if(health.ready) break;
    if(i===119) throw Error('MindSpore startup timeout');
    await new Promise(r=>setTimeout(r,1000));
  }
  const results=[];
  for(const [stage,question] of [['start','这道题应该怎么想'],['waiting','哦，所以答案是k<1吗'],['hint','我已经独立思考三分钟了，请给我一个提示。'],['complete','答案应该是k<1且k不为0']]) {
    if(stage==='waiting') assert.equal(flow.questionRoute({stem:'若关于x的一元二次方程kx²-2x+1=0有两个不相等的实根',question}), 'correct_quadratic_range');
    const start=Date.now();
    const response=await fetch(origin+'/api/baseline',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({question,history:[],stage})});
    const result=await response.json();
    assert.equal(response.status,200,JSON.stringify(result));
    assert.equal(result.source,'local-model');
    assert.ok(baseline.valid(result.content,stage),result.content);
    results.push({stage,question,...result,elapsedMs:Date.now()-start});
    console.log(stage+': '+result.content);
  }
  fs.writeFileSync('outputs/local-chat/model-baseline-smoke.json',JSON.stringify({testedAt:new Date().toISOString(),note:'Four real model calls; timer is tested separately in UI.',results},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
