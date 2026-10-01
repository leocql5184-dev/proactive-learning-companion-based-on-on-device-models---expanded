'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const origin=process.env.COMPANION_TEST_ORIGIN||'http://127.0.0.1:8875';
function request(route,headers={},method='GET',body='') {
  return new Promise((resolve,reject)=>{
    const req=http.request(origin+route,{method,headers},res=>{
      let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text}));
    });req.on('error',reject);req.setTimeout(5000,()=>req.destroy(Error('timeout')));req.end(body);
  });
}
(async()=>{
  const health=await request('/api/health');assert.equal(health.status,200);
  assert.equal(JSON.parse(health.text).workspaceRoot,undefined);
  assert.equal((await request('/api/health',{Host:'evil.example'})).status,403);
  assert.equal((await request('/api/health',{Origin:'https://evil.example'})).status,403);
  assert.equal((await request('/api/health',{'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal((await request('/api/shutdown',{},'POST')).status,403);
  assert.equal((await request('/api/chat',{Origin:'https://evil.example'},'POST','{}')).status,403);
  assert.equal((await request('/api/chat',{Origin:origin,'Content-Type':'application/json'},'POST','{}')).status,400);
  for(const route of ['/../signing/debug-password.txt','/models/qwen3/Qwen3-0.6B-Q8_0.gguf','/.env','/server.cjs'])
    assert.equal((await request(route)).status,404,route);
  const page=await request('/');assert.equal(page.status,200);
  assert.match(page.headers['content-security-policy'],/frame-ancestors 'none'/);
  assert.equal(page.headers['x-content-type-options'],'nosniff');
  const enginePort=Number(process.env.COMPANION_ENGINE_PORT||8876);
  const denied=await fetch('http://127.0.0.1:'+enginePort+'/completion',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"prompt":"test","n_predict":1}'});
  assert.equal(denied.status,401);
  console.log('PASS Host/Origin/cross-site rejection, POST guard, invalid input, private path isolation, headers, engine key');
})().catch(error=>{console.error(error);process.exitCode=1;});
