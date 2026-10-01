'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function app(saved,transport) {
  const nodes=new Map(),storage=new Map(saved?[['zh伴-desktop-v1',saved]]:[]),callbacks={},ticks=[];let now=1000;
  class Clock extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}}
  const document={hidden:false,focused:true,hasFocus(){return this.focused;},addEventListener(n,f){callbacks[n]=f;},getElementById(id){
    if(!nodes.has(id))nodes.set(id,{innerHTML:'',value:'',checked:false,focus(){},scrollIntoView(){},remove(){},classList:{add(){},remove(){},toggle(){}}});return nodes.get(id);}};
  const scope=vm.createContext({Date:Clock,document,window:{addEventListener(n,f){callbacks[n]=f;}},matchMedia:()=>({matches:true}),
    CompanionPolicy:require('../tools/local-llm/desktop/web/policy.js'),LearningFlow:require('../tools/local-llm/desktop/web/learning-flow.js'),TutoringPolicy:require('../tools/local-llm/desktop/web/tutoring-policy.js'),
    localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    fetch:async(url,args)=>url==='/api/active-evidence'&&transport?transport(url,args):{ok:false,json:async()=>({ready:false})},
    setInterval:f=>ticks.push(f),AbortController,AbortSignal,TextDecoder,alert(){},confirm:()=>true});
  for(const file of ['cognitive-state.js','intervention-estimator.js','symbolic-reasoner.js','probabilistic-reasoner.js','intervention-planner.js','strategy-study.js','app.js','causal-ui.js','active-intervention.js','guidance-evidence.js'])
    vm.runInContext(fs.readFileSync('tools/local-llm/desktop/web/'+file,'utf8'),scope);
  return {run:code=>vm.runInContext(code,scope),scope,nodes,storage,document,callbacks,ticks,advance:ms=>{now+=ms;}};
}
for(const [task,text,skill] of [[0,'k=0也可以','quadratic_definition'],[1,'x²=10','log_exponent'],[2,'a=2,b=2时最大值为4','attainable_maximum']]) {
  test(`task ${task}: submit→targeted offer→accept→posttest→reload/delete`,async()=>{
    const a=app();a.run(`state.record=true;state.profile=true;state.proactive=true;openWork('study');start(${task});updateAnswer(${JSON.stringify(text)})`);
    await a.run('submitAnswer()');
    assert.equal(a.run('activeHistory().length'),1);assert.equal(a.run('activeHistory()[0].plan.timing'),'OFFER');
    assert.equal(a.run('activeHistory()[0].reasoning.status'),'VERIFIED_CONFLICT');
    assert.equal(a.run('state.events.filter(e=>e.cognitive).length'),1,'joint evidence is one attempt');
    assert.equal(a.run(`cognitiveBelief().states.${skill}.observations`),1);
    assert.match(a.nodes.get('active-intervention-panel').innerHTML,/一起看看/);
    a.run("activeRespond('accepted');activeBeginPosttest()");
    a.run('el("active-test-answer").value=String(InterventionPlanner.tests[state.task][0].answer);el("active-test-independent").checked=true;activeCompletePosttest()');
    assert.equal(a.run('activeHistory()[0].outcome.y'),1);
    assert.equal(a.run('state.events.filter(e=>e.activeParent).length'),1);
    const b=app(a.storage.get('zh伴-desktop-v1'));assert.equal(b.run('activeHistory()[0].outcome.y'),1);
    b.run("recordPending=['real-'+state.events.find(e=>e.cognitive&&!e.activeParent).id];deleteLocalRecords()");
    assert.equal(b.run('activeHistory().length'),0);assert.equal(b.run('state.events.filter(e=>e.activeParent).length'),0);
  });
}
test('correct explanation stays quiet, missing premise asks, pause does not rescore draft',async()=>{
  const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;openWork('study');start(1);updateAnswer('10²=x')");await a.run('submitAnswer()');
  assert.equal(a.run('activeHistory()[0].plan.timing'),'STAY_QUIET');
  a.advance(180000);await a.run("evaluateActive('pause','')");
  assert.equal(a.run('state.events.filter(e=>e.cognitive).length'),1);
});
test('decline cooldown, incomplete consent and other chapters cannot invoke advanced pipeline',async()=>{
  const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;openWork('study');start(0);updateAnswer('k<1')");await a.run('submitAnswer()');
  assert.equal(a.run('activeHistory()[0].plan.action'),'clarify');a.run("activeRespond('declined')");
  await a.run("evaluateActive('pause','')");assert.equal(a.run('activeHistory().length'),1);
  a.run("finishStudy();start(3)");assert.equal(a.run('activeEnabled()'),false);
  a.run("finishStudy();toggleSetting('record',false);start(0);toggleSetting('record',true)");assert.equal(a.run('activeEnabled()'),false);
});
test('late neural result cannot resurrect after edit, clear or hidden page',async()=>{
  for(const mutation of ["updateAnswer('新草稿')",'clearRecords()',"document.hidden=true;invalidateActive('hidden')"]) {
    let resolve;const a=app(undefined,()=>new Promise(r=>resolve=r));
    a.run("state.record=true;state.profile=true;state.proactive=true;openWork('study');start(1);updateAnswer('x²=10')");
    const pending=a.run('submitAnswer()');a.run(mutation);
    resolve({ok:true,json:async()=>({neural:{status:'quoted_candidates',claims:[{quote:'x²=10',kind:'assertion'}]}})});await pending;
    assert.equal(a.run('activeHistory().length'),0);
  }
});
test('skipping or revoking consent never becomes successful posttest',async()=>{
  for(const finish of ['activeCompletePosttest(true)',"toggleSetting('profile',false);toggleSetting('profile',true)"]) {
    const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;openWork('study');start(0);updateAnswer('k<1')");await a.run('submitAnswer()');
    a.run("activeRespond('accepted');activeBeginPosttest();"+finish);
    assert.equal(a.run('activeHistory()[0].outcome.y'),null);assert.equal(a.run('state.events.filter(e=>e.activeParent).length'),0);
  }
});
test('repeated submit does not add observations; reload does not replay pending offers; expiry stays missing',async()=>{
  const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;openWork('study');start(0);updateAnswer('k<1')");await a.run('submitAnswer()');await a.run('submitAnswer()');
  assert.equal(a.run('state.events.filter(e=>e.cognitive).length'),1);assert.equal(a.run('activeHistory().length'),1);
  const b=app(a.storage.get('zh伴-desktop-v1'));assert.equal(b.run('activeHistory()[0].response'),'expired');assert.equal(b.run('activeOfferId'),'');
  a.run("activeRespond('accepted');activeBeginPosttest()");a.advance(1800001);a.run('activeTick()');
  assert.equal(a.run('activeHistory()[0].outcome.missingReason'),'outside_window');
});
test('editing after accepting help keeps its posttest available; truncation removes orphaned decisions',async()=>{
  const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;openWork('study');start(0);updateAnswer('k<1')");await a.run('submitAnswer()');
  a.run("activeRespond('accepted');updateAnswer('k<1且k≠0');activeBeginPosttest()");
  assert.equal(a.run('activeHistory()[0].outcome'),null);assert.ok(a.run('activeHistory()[0].testId'));
  a.run("state.events=state.events.concat(Array.from({length:500},(_,i)=>({id:'padding'+i,type:'started',time:i})));save()");
  assert.equal(a.run('activeHistory().length'),0);assert.ok(a.run('state.events.length')<=500);
});

test('evidence button contains five real stages, escapes quotes and preserves answers while toggling',async()=>{
  const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;openWork('study');start(0);updateAnswer('k<1')");await a.run('submitAnswer()');
  const html=a.nodes.get('active-intervention-panel').innerHTML;
  for(const label of ['引导证据','本轮证据','数学核查','当前知识观察','帮助选择依据','后续验证结果','k&lt;1'])assert.ok(html.includes(label));
  a.run("toggleGuidanceEvidence(activeHistory()[0].id)");assert.equal(a.run('evidenceOpen.size'),1);assert.equal(a.run('state.answer'),'k<1');
});
test('method randomization is opt-in after acceptance; outcomes persist, duplicates do not reassign',async()=>{
  const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;toggleSetting('strategyStudy',true);openWork('study');start(0);updateAnswer('k=0也可以')");await a.run('submitAnswer()');
  assert.equal(a.run('activeHistory()[0].study.method'),undefined);
  a.run("activeRespond('accepted');activeRespond('accepted');activeBeginPosttest()");
  assert.equal(a.run('activeHistory()[0].study.method.propensity'),.5);
  a.run("el('active-test-answer').value='1';el('active-test-independent').checked=true;activeCompletePosttest()");
  assert.equal(a.run('activeHistory()[0].study.method.outcome.y'),1);
  a.advance(1800001);assert.equal(a.run('activeStudyEffects().method.count'),1);
  const b=app(a.storage.get('zh伴-desktop-v1'));assert.equal(b.run('activeHistory()[0].study.method.outcome.y'),1);
  a.run("persistRecordChange({...state,events:state.events.filter(e=>!e.activeDecision)})");assert.equal(a.run('state.strategyStudy'),false);
});
test('timing arms observe the same new-submission endpoint and censor lost observation',async()=>{
  for(const draw of [.1,.9]) {
    const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;toggleSetting('strategyStudy',true);openWork('study');start(0)");
    a.run(`StrategyStudy.assign=(kind,time)=>({version:StrategyStudy.version,kind,time,due:time+StrategyStudy.windows[kind],action:StrategyStudy.arms[kind][${draw<.5?0:1}],propensity:.5,consent:true,outcome:null})`);
    await a.run("evaluateActive('pause','')");assert.ok(a.run('activeHistory()[0].study.timing'));
    a.run("updateAnswer('k<1')");await a.run('submitAnswer()');
    assert.equal(a.run('activeHistory()[0].study.timing.outcome.y'),1);
  }
  const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;toggleSetting('strategyStudy',true);openWork('study');start(0)");
  await a.run("evaluateActive('pause','')");a.run("invalidateActive('hidden')");a.advance(300001);a.run('activeTick()');
  assert.equal(a.run('activeHistory()[0].study.timing.outcome.y'),null);
});

test('other feedback opens without recording, validates text, persists safely and remains separate from learning outcomes',async()=>{
  const a=app();a.run("state.record=true;state.profile=true;state.proactive=true;openWork('study');start(0);updateAnswer('k<1')");await a.run('submitAnswer()');
  a.run("activeRespond('accepted');activeCompletePosttest(true);activeFeedback('other')");
  assert.equal(a.run('activeHistory()[0].feedback'),'unknown');
  assert.match(a.nodes.get('active-intervention-panel').innerHTML,/说说你的想法/);
  a.run('submitActiveFeedback()');assert.match(a.nodes.get('active-intervention-panel').innerHTML,/请先写下/);
  a.run("activeFeedbackDraft='想先弄懂原因 <script>bad()</script>';submitActiveFeedback()");
  assert.equal(a.run('activeHistory()[0].feedback'),'other');assert.equal(a.run('activeHistory()[0].outcome.y'),null);
  assert.match(a.nodes.get('active-intervention-panel').innerHTML,/&lt;script&gt;/);
  const b=app(a.storage.get('zh伴-desktop-v1'));assert.equal(b.run('activeHistory()[0].feedbackText'),'想先弄懂原因 <script>bad()</script>');
  a.run("activeFeedback('other');activeFeedbackDraft='未提交的内容';cancelActiveFeedback()");
  assert.equal(a.run('activeHistory()[0].feedbackText'),'想先弄懂原因 <script>bad()</script>');
  a.run("activeFeedback('helpful')");assert.equal(a.run('activeHistory()[0].feedbackText'),'');
  a.run("activeFeedback('other');activeFeedbackDraft='不应保存';toggleSetting('profile',false);submitActiveFeedback()");
  assert.equal(a.run('activeFeedbackDraft'),'');assert.equal(a.run('activeHistory()[0].feedback'),'helpful');
});
