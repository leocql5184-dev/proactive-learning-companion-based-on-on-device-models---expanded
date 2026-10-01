'use strict';
// Runtime state holds raw submitted text only for the current request; no extra raw-text history.
let activeEpoch=0, activeRequest=null, activeOfferId='', activeLastKey='', activeNotice='';
function activeEnabled() {
  return state.task>=0 && state.task<3 && state.active && !state.paused && state.record && state.profile && state.proactive &&
    state.cognitiveCoverage && state.coverage && !!state.cognitiveSession;
}
function activeVisible() {return workVisible && ['study','chat'].includes(current) && !catalog && !document.hidden && document.hasFocus();}
function activeSnapshot() {
  const b=cognitiveBelief();
  return {time:Date.now(),modelVersion:b?.modelVersion||'unknown',graphVersion:b?.graphVersion||'unknown',evidenceIds:b?.evidenceIds||[],
    states:Object.fromEntries(Object.entries(b?.states||{}).map(([id,s])=>[id,{mastery:s.mastery,prior:s.trace.at(-1)?.nextPrior??null,observations:s.observations}]))};
}
function activePrepare() {return activeEnabled()?{snapshot:activeSnapshot(),assistance:state.cognitiveAssistance,beforeIds:state.events.map(e=>e.id)}:null;}
function activeLog(id) {return state.events.find(e=>e.id===id&&e.activeDecision)?.activeDecision;}
function activeHistory() {return state.events.filter(e=>e.activeDecision).map(e=>e.activeDecision);}
function activeStudyRows() {return activeHistory().filter(d=>d.studyEpoch===state.studyEpoch);}
function activeStudyEffects(task=state.task) {
  if(typeof StrategyStudy==='undefined')return {};
  return Object.fromEntries(['method','timing'].map(k=>[k,StrategyStudy.estimate(activeStudyRows(),k,task)]));
}
function activeStudyAvailable(kind) {
  return state.strategyStudy&&!!state.studyEpoch&&typeof StrategyStudy!=='undefined'&&
    !activeStudyRows().some(d=>d.study?.[kind]&&d.study[kind].due>Date.now());
}
function activeModelFeatures(time) {
  const events=state.events.filter(e=>e.sessionId===state.cognitiveSession&&e.time<=time&&e.coverageComplete);
  const start=events.find(e=>e.type==='started');
  if(!start)return {};
  const answers=events.filter(e=>['answer_correct','answer_incorrect','answer_submitted'].includes(e.type));
  const classified=answers.every(e=>e.type!=='answer_submitted');
  const incorrect=answers.filter(e=>e.type==='answer_incorrect').length,correct=answers.filter(e=>e.type==='answer_correct').length;
  const gaps=answers.slice(1).map((e,i)=>e.time-answers[i].time).sort((a,b)=>a-b);
  return {answer_count:answers.length,incorrect_count:classified?incorrect:null,correct_count:classified?correct:null,
    incorrect_ratio:classified&&answers.length?incorrect/answers.length:null,
    decision_offset_ms:time-start.time,observed_span_ms:events.length?events.at(-1).time-start.time:0,
    last_event_gap_ms:time-events.at(-1).time,
    median_answer_gap_ms:gaps.length?(gaps[Math.floor((gaps.length-1)/2)]+gaps[Math.floor(gaps.length/2)])/2:null};
}
function activeStudySubmission() {
  for(const d of activeHistory()) {const r=d.study?.timing;
    if(r&&!r.outcome&&d.sessionId===state.cognitiveSession&&d.task===state.task&&Date.now()<=r.due)
      activeSave({...d,study:{...d.study,timing:{...r,outcome:{y:1,time:Date.now(),source:'new_registered_submission'}}}});
  }
}
function activeRetainedEvents(events) {
  let retained=events.slice(-500),changed=true;
  while(changed){const ids=new Set(retained.map(e=>e.id));const next=retained.filter(e=>
    (e.activeDecision?.evidenceIds||(e.activeParent?[e.activeParent]:[])).every(id=>ids.has(id)));
    changed=next.length!==retained.length;retained=next;}
  if(state.events.some(e=>e.activeDecision?.studyEpoch===state.studyEpoch&&e.activeDecision?.study&&Object.keys(e.activeDecision.study).length&&!retained.some(r=>r.id===e.id))) {
    state.studyEpoch='';state.strategyStudy=false;activeNotice='策略评估记录已删除或截断，本轮比较已停止；可在设置中重新开启新一轮。';
  }
  return retained;
}
function activeSave(d) {
  if(!state.record||!state.profile) return false;
  if(d.study?.method&&!d.study.method.outcome&&d.outcome)d={...d,study:{...d.study,method:{...d.study.method,outcome:d.outcome}}};
  const exists=state.events.some(e=>e.id===d.id);
  const events=exists?state.events.map(e=>e.id===d.id?{...e,activeDecision:d}:e):state.events.concat({id:d.id,type:'active_decision',task:d.task,time:d.time,
    value:d.plan.timing==='OFFER'?'学伴提出针对性帮助':d.plan.timing==='DEFER'?'学伴暂缓提醒':'学伴保持安静',activeDecision:d});
  try {const retained=activeRetainedEvents(events);localStorage.setItem(storageKey,JSON.stringify({...state,events:retained,version:1}));state.events=retained;return retained.some(e=>e.id===d.id);}
  catch(_){activeNotice='建议记录暂时无法保存。';storageNotice=activeNotice;return false;}
}
function invalidateActive(reason='context_changed',closeLearning=false) {
  activeEpoch++; if(activeRequest) activeRequest.abort();activeRequest=null;activeOfferId='';activeLastKey='';
  if(closeLearning||reason==='reloaded'){activeFeedbackEditorId='';activeFeedbackDraft='';}
  const stopTiming=closeLearning||['hidden','blur','reloaded','navigation','home','consent_revoked'].includes(reason);
  if(stopTiming)state.events=state.events.map(e=>{
    const d=e.activeDecision;if(!d?.study)return e;
    const study={...d.study};for(const kind of ['timing','method'])if(study[kind]&&!study[kind].outcome&&(kind==='timing'||closeLearning||reason==='reloaded'))
      study[kind]={...study[kind],outcome:{y:null,time:Date.now(),missingReason:reason}};
    return {...e,activeDecision:{...d,study}};
  });
  state.events=state.events.map(e=>e.activeDecision && (e.activeDecision.response==='pending' || (closeLearning&&e.activeDecision.response==='accepted'&&!e.activeDecision.outcome))?
    {...e,activeDecision:{...e.activeDecision,response:e.activeDecision.response==='pending'?'expired':e.activeDecision.response,
      invalidated:reason,outcome:e.activeDecision.outcome||{y:null,missingReason:reason,time:Date.now()}}}:e);
  renderActiveCard();
}
function pruneActiveDependencies(next,previous) {
  const kept=new Map(next.events.map(e=>[e.id,e]));
  const changed=new Set(previous.events.filter(e=>!kept.has(e.id)||JSON.stringify(kept.get(e.id))!==JSON.stringify(e)).map(e=>e.id));
  // Remove descendants transitively, including posttest cognitive evidence when its decision is removed.
  let events=next.events,repeat=true;
  while(repeat) {repeat=false;events=events.filter(e=>{
    const refs=e.activeDecision?.evidenceIds|| (e.activeParent?[e.activeParent]:[]);
    if(refs.some(id=>changed.has(id))) {changed.add(e.id);repeat=true;return false;}return true;
  });}
  if(changed.size) {activeEpoch++;activeRequest?.abort();activeRequest=null;activeOfferId='';activeLastKey='';}
  const lostStudy=previous.events.some(e=>e.activeDecision?.studyEpoch===previous.studyEpoch&&Object.keys(e.activeDecision?.study||{}).length&&(!events.some(r=>r.id===e.id)||changed.has(e.id)));
  return {...next,events,...(lostStudy?{studyEpoch:'',strategyStudy:false}:{})};
}
function activeCognitiveCommit(d,symbolic,prepared,eventId,trigger) {
  if(!eventId || !['VERIFIED_VALID','VERIFIED_CONFLICT'].includes(symbolic.status) || prepared.assistance==='unknown') return;
  const record=state.events.find(e=>e.id===eventId&&e.cognitive);
  if(!record) return;
  // Replace this attempt's emission, never append a second observation for answer + explanation.
  record.cognitive={...record.cognitive,skillId:symbolic.skillId,source:'symbolic_verified',
    outcome:symbolic.status==='VERIFIED_VALID'?'correct':'incorrect',
    conflict:symbolic.status==='VERIFIED_CONFLICT'?'verified':'none',conflictSource:'symbolic_verified',
    symbolicVersion:symbolic.version,revision:(record.cognitive.revision||0)+1};
}
async function evaluateActive(trigger,text='',prepared=null) {
  if(!activeEnabled()||!activeVisible()||busy||modal||Date.now()<state.cooldownUntil||activeRequest) return;
  if(activeHistory().some(d=>d.sessionId===state.cognitiveSession&&d.response==='accepted'&&!d.outcome&&!d.invalidated)) return;
  const preparation=prepared||activePrepare();if(!preparation)return;
  const task=state.task,session=state.cognitiveSession,answer=state.answer;
  const key=JSON.stringify([session,trigger,text,preparation.snapshot.evidenceIds]);
  if(key===activeLastKey)return;activeLastKey=key;
  const epoch=++activeEpoch,request=new AbortController();activeRequest=request;
  let neural={status:'unavailable',claims:[],modelVersion:'none'},trained={status:'unavailable'};
  const eventId=state.events.filter(e=>e.cognitive&&!preparation.beforeIds.includes(e.id)).at(-1)?.id;
  if(trigger!=='pause'&&!eventId){activeRequest=null;return;}
  try {
    {
      const res=await fetch('/api/active-evidence',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.any([request.signal,AbortSignal.timeout(46000)]),
        body:JSON.stringify({task,text:text.slice(0,2000),consent:true,features:activeModelFeatures(preparation.snapshot.time)})});
      if(res.ok) {const packet=await res.json();if(packet.neural&&Array.isArray(packet.neural.claims))neural=packet.neural;if(packet.trained)trained=packet.trained;}
    }
  } catch(_) { /* Verified local math remains available; missing neural evidence stays explicit. */ }
  if(activeRequest===request)activeRequest=null;
  if(epoch!==activeEpoch||request.signal.aborted||!activeEnabled()||!activeVisible()||state.task!==task||state.cognitiveSession!==session||state.answer!==answer||busy||modal||Date.now()<state.cooldownUntil)return;
  const symbolic=SymbolicReasoner.check(task,text,neural), prior=preparation.snapshot.states[symbolic.skillId]?.prior??null;
  // Pause evaluation does not ingest an unsubmitted draft or count an old answer again.
  const belief=ProbabilisticReasoner.infer({prior,symbolic,assistance:preparation.assistance,
    answerOutcome:trigger==='submission'?CognitiveState.assess(task,text):'unknown'});
  const effectRows=activeHistory().map(d=>({...d,topic:InterventionPlanner.topics[d.task],consent:true})).concat(state.events.filter(e=>e.causal).map(e=>e.causal));
  const effects=InterventionEstimator.estimate(effectRows,{topic:InterventionPlanner.topics[task],origin:'real'});
  const realEffects=activeStudyEffects(task);
  const plan=InterventionPlanner.plan({task,trigger,symbolic,belief,effects,realEffects,trained,origin:'real'});
  const time=Date.now(),id='active-'+time.toString(36)+'-'+Math.random().toString(36).slice(2);
  const study={};
  if(trigger==='pause'&&plan.action&&activeStudyAvailable('timing')&&!realEffects.timing?.supported) {
    study.timing=StrategyStudy.assign('timing',time);
    if(study.timing.action==='defer')plan.timing='DEFER';
    plan.mode='randomized_timing';state.cooldownUntil=Math.max(state.cooldownUntil,study.timing.due);
  }
  if(plan.timing==='DEFER')state.cooldownUntil=Math.max(state.cooldownUntil,time+300000);
  const d={id,task,sessionId:session,time,decisionTime:preparation.snapshot.time,origin:'real',trigger,policyVersion:InterventionPlanner.version,
    evidenceIds:[...new Set(preparation.snapshot.evidenceIds.concat(eventId?[eventId]:[],plan.mode==='real_causal'?Object.values(realEffects).flatMap(e=>e.evidenceIds||[]):[]))],snapshot:preparation.snapshot,
    reasoning:{status:symbolic.status,skillId:symbolic.skillId,version:symbolic.version,trace:symbolic.trace,findings:symbolic.findings,trained,
      neural:{status:neural.status,modelVersion:neural.modelVersion,calibrated:false}},belief,plan,
    study,studyEpoch:state.studyEpoch,realEffects,
    assignment:study.timing?'randomized_timing':'deterministic_conservative',propensity:study.timing?.propensity??null,displayedAt:null,response:plan.timing==='OFFER'?'pending':'not_offered',outcome:null,feedback:'unknown'};
  activeCognitiveCommit(d,symbolic,preparation,eventId,trigger);
  if(!activeSave(d))return;
  if(plan.timing==='OFFER')activeOfferId=id;
  renderActiveCard();
}
function activeTick() {
  for(const d of activeHistory()) {const r=d.study?.timing;
    if(r&&!r.outcome&&Date.now()>=r.due)activeSave({...d,study:{...d.study,timing:{...r,outcome:{y:0,time:r.due,source:'no_new_registered_submission'}}}});
  }
  if(activeOfferId) {const d=activeLog(activeOfferId);if(!d||Date.now()-d.time>60000){invalidateActive('offer_expired');save();}}
  for(const d of activeHistory()) if(d.response==='accepted'&&!d.outcome&&Date.now()-d.acceptedAt>1800000) activeSave({...d,outcome:{time:Date.now(),y:null,missingReason:'outside_window'}});
  if(!activeEnabled())return;
  if(CompanionPolicy.shouldOffer({...state,studyVisible:activeVisible()&&current==='study',modal,busy,lastActivity,visibleSince},Date.now()))
    void evaluateActive('pause','');
}
function activeRespond(response) {
  if(!['accepted','declined','later'].includes(response))return;
  const d=activeLog(activeOfferId);if(!d||d.response!=='pending'||!activeEnabled()||!activeVisible()||Date.now()-d.time>60000)return;
  const time=Date.now(),next={...d,response,responseAt:time};
  if(response==='accepted'){
    next.acceptedAt=time;next.helpStep=0;state.cognitiveAssistance='assisted';
    const seen=activeHistory().filter(r=>r.testShownAt).map(r=>r.testId);
    if(['concept_check','step_hint'].includes(d.plan.action)&&activeStudyAvailable('method')&&!d.realEffects?.method?.supported&&InterventionPlanner.posttest(d.task,seen)) {
      const method=StrategyStudy.assign('method',time);
      next.study={...d.study,method};next.studyEpoch=state.studyEpoch;
      next.plan={...d.plan,action:method.action,mode:'randomized_method',trainedApplied:false};
      next.assignment='randomized_method';next.propensity=method.propensity;
    }
  }
  else next.outcome={y:null,time,missingReason:response==='declined'?'declined':'deferred'};
  if(activeSave(next)){activeOfferId='';state.cooldownUntil=CompanionPolicy.cooldown(response,time);touch();save();renderActiveCard();}
}
function currentActiveLearning() {return activeHistory().filter(d=>d.sessionId===state.cognitiveSession&&d.task===state.task&&d.response==='accepted'&&!d.invalidated).at(-1);}
function activeNextStep() {const d=currentActiveLearning();if(!d||d.outcome||!activeEnabled())return;activeSave({...d,helpStep:Math.min(2,(d.helpStep||0)+1)});touch();renderActiveCard();}
function activeBeginPosttest() {
  const d=currentActiveLearning();if(!d||d.outcome||d.testShownAt||!activeEnabled())return;
  const seen=activeHistory().filter(r=>r.testShownAt).map(r=>r.testId);
  const t=InterventionPlanner.posttest(d.task,seen);
  if(!t){activeSave({...d,outcome:{time:Date.now(),y:null,missingReason:'no_unseen_posttest'}});renderActiveCard();return;}
  activeSave({...d,testId:t.id,testShownAt:Date.now()});touch();renderActiveCard();
}
function activeCompletePosttest(skip=false) {
  const d=currentActiveLearning();if(!d||d.outcome||!activeEnabled())return;
  const t=InterventionPlanner.tests[d.task].find(t=>t.id===d.testId), raw=el('active-test-answer')?.value;
  if(!skip&&(!t||raw===''||raw===undefined||!Number.isInteger(Number(raw))||Number(raw)<0||Number(raw)>=t.options.length)){activeNotice='请选择答案，或跳过这次核查。';renderActiveCard();return;}
  const independent=el('active-test-independent')?.checked===true,time=Date.now();
  const repeated=activeHistory().some(r=>r.id!==d.id&&r.testShownAt&&r.testId===d.testId);
  const reason=skip?'skipped':time-d.acceptedAt>1800000?'outside_window':!independent?'assisted_or_unknown':repeated?'repeat_posttest':null;
  const outcome={time,y:reason?null:Number(Number(raw)===t.answer),missingReason:reason,independent:!reason,source:'engineering_reviewed_answer',testId:t?.id||null};
  if(activeSave({...d,outcome})) {
    if(!reason) {
      const id=d.id+'-posttest';
      const cognitive={schemaVersion:1,id,studentId:'local',sessionId:d.sessionId,attemptId:id,time,origin:'real',topic:InterventionPlanner.topics[d.task],
        itemId:t.id,skillId:t.skill,kind:'answer',outcome:outcome.y?'correct':'incorrect',assistance:'independent',source:'answer_key',conflict:'none',consent:true};
      if(!state.events.some(e=>e.id===id))state.events.push({id,type:'cognitive_observation',task:d.task,time,value:'独立迁移核查',cognitive,activeParent:d.id});
      save();
    }
    activeNotice='';touch();renderActiveCard();
  }
}
let activeFeedbackEditorId='',activeFeedbackDraft='';
function activeFeedback(value) {
  const d=currentActiveLearning();if(!d||!d.outcome||!['helpful','unhelpful','other'].includes(value)||!state.record||!state.profile)return;
  if(value==='other') {
    activeFeedbackEditorId=d.id;activeFeedbackDraft=d.feedback==='other'?d.feedbackText||'':'';
    activeNotice='';renderActiveCard();el('active-feedback-text')?.focus();return;
  }
  if(activeSave({...d,feedback:value,feedbackText:''})) {activeFeedbackEditorId='';activeFeedbackDraft='';activeNotice='';}
  renderActiveCard();
}
function cancelActiveFeedback() {activeFeedbackEditorId='';activeFeedbackDraft='';activeNotice='';renderActiveCard();}
function submitActiveFeedback() {
  const d=currentActiveLearning();if(!d||d.id!==activeFeedbackEditorId||!d.outcome||!state.record||!state.profile)return;
  const text=activeFeedbackDraft.trim().slice(0,500);
  if(!text){activeNotice='请先写下你的想法。';renderActiveCard();el('active-feedback-text')?.focus();return;}
  if(activeSave({...d,feedback:'other',feedbackText:text})) {activeFeedbackEditorId='';activeFeedbackDraft='';activeNotice='';}
  renderActiveCard();
}
function renderActiveFeedback(d) {
  const label={unknown:'尚未反馈',helpful:'已记录：有帮助',unhelpful:'已记录：没帮上忙',other:'已记录：其他'}[d.feedback]||'尚未反馈';
  return '<p>这次帮助对你有用吗？</p><div class="actions"><button class="secondary" onclick="activeFeedback(\'helpful\')">有帮助</button><button class="secondary" onclick="activeFeedback(\'unhelpful\')">没帮上忙</button><button class="secondary" aria-expanded="'+(activeFeedbackEditorId===d.id)+'" aria-controls="active-feedback-editor" onclick="activeFeedback(\'other\')">其他</button></div>'+
    (activeFeedbackEditorId===d.id?'<div id="active-feedback-editor"><label for="active-feedback-text">说说你的想法</label><textarea class="answer" id="active-feedback-text" maxlength="500" placeholder="例如：提示有点快，我希望先讲清楚为什么……" oninput="activeFeedbackDraft=this.value">'+esc(activeFeedbackDraft)+'</textarea><p class="muted">最多 500 字，提交后保存在本机，可随这条记录删除。</p><button class="primary" onclick="submitActiveFeedback()">提交想法</button> <button class="secondary" onclick="cancelActiveFeedback()">取消</button></div>':'')+
    '<p class="muted">'+label+'；单次结果不能证明介入效果。</p>'+(d.feedback==='other'&&d.feedbackText?'<p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(d.feedbackText)+'</p>':'');
}
function renderActiveCard() {
  const slot=el('active-intervention-panel');if(!slot)return;
  if(!activeEnabled()){slot.innerHTML='';return;}
  const offer=activeLog(activeOfferId),d=offer?.response==='pending'?offer:currentActiveLearning()||activeHistory().filter(r=>r.sessionId===state.cognitiveSession&&r.task===state.task&&r.response==='not_offered'&&!r.invalidated).at(-1);
  if(!d){slot.innerHTML='';return;}
  let body='';
  if(d.response==='not_offered') {
    body='<p>'+esc(d.plan.timing==='DEFER'?'这次先按自己的节奏继续；需要时随时求助。':'本轮核查已记录，你可以继续思考。')+'</p>';
  } else if(d.response==='pending') {
    if(!activeVisible()||Date.now()-d.time>60000){slot.innerHTML='';return;}
    if(!d.displayedAt)activeSave({...d,displayedAt:Date.now()});
    const reason=d.plan.reason==='verified_conflict'?'你提交的条件或关系中，有一处需要核对。':d.plan.reason==='missing_premise'?'这一步还缺少一个条件或理由，可以一起确认。':'你已经思考了一会儿；停顿也可能是在整理思路。';
    body='<h2>学伴的小建议</h2><p>'+esc(d.plan.invitation)+'</p><p class="muted">'+reason+'</p><div class="actions"><button class="primary" onclick="activeRespond(\'accepted\')">一起看看</button><button class="secondary" onclick="activeRespond(\'declined\')">我自己继续</button><button class="secondary" onclick="activeRespond(\'later\')">稍后</button></div>';
  } else if(d.outcome) {
    body='<h2>这次帮助的回顾</h2><p>'+(d.outcome.y===null?'这次尚无可用的独立核查结果。':d.outcome.y?'这道新题答对了，理解还可以在后续练习中继续确认。':'这道新题还需要再检查，可以继续回到原题练习。')+'</p>'+renderActiveFeedback(d);
  } else if(d.testShownAt) {
    const t=InterventionPlanner.tests[d.task].find(t=>t.id===d.testId);
    if(!t){slot.innerHTML='';return;}
    body='<h2>换一道题，独立核查</h2><p>'+esc(t.text)+'</p><label>选择答案 <select id="active-test-answer"><option value="">请选择</option>'+t.options.map((o,i)=>'<option value="'+i+'">'+esc(o)+'</option>').join('')+'</select></label><p><label><input id="active-test-independent" type="checkbox"> 我没有再使用提示，也没有在其他地方见过本题答案</label></p><button class="primary" onclick="activeCompletePosttest()">提交核查</button> <button class="secondary" onclick="activeCompletePosttest(true)">跳过</button>';
  } else {
    const content=InterventionPlanner.texts[d.task];
    body='<h2>'+(d.plan.action==='step_hint'?'一步一步检查':'一起核查理解')+'</h2><p>'+esc(d.plan.action==='step_hint'?content.steps[d.helpStep||0]:content.concept)+'</p>'+
      (d.plan.action==='step_hint'&&(d.helpStep||0)<2?'<button class="secondary" onclick="activeNextStep()">下一步</button> ':'')+
      '<button class="primary" onclick="activeBeginPosttest()">我来独立试一道新题</button> <button class="secondary" onclick="activeCompletePosttest(true)">暂不核查</button>';
  }
  slot.innerHTML='<section class="panel active-support" aria-label="学伴主动支持">'+body+(typeof guidanceEvidence==='function'?guidanceEvidence(d):'')+(activeNotice?'<p role="status">'+esc(activeNotice)+'</p>':'')+'</section>';
}
function renderActiveReview() {
  if(!state.profile)return '';
  const rows=activeHistory().slice(-5).reverse();
  return '<div class="panel"><h2>学伴的陪伴记录</h2>'+(rows.length?rows.map(d=>'<article style="margin:16px 0"><p>'+esc(tasks[d.task][0])+' · '+(d.plan.timing==='OFFER'?'提出核查':d.plan.timing==='DEFER'?'暂缓提醒':'保持安静')+'</p>'+(typeof guidanceEvidence==='function'?guidanceEvidence(d):'')+'</article>').join(''):'<p>有新的学习证据时，学伴会判断是否需要提出帮助。</p>')+'</div>'+renderStudyProgress();
}
function renderStudyProgress() {
  const topics=[...new Set(activeStudyRows().filter(d=>Object.keys(d.study||{}).length).map(d=>d.task))];
  if(!topics.length)return '';
  return '<div class="panel"><h2>帮助策略评估进度</h2><p class="muted">结果窗口完整结束后才参与比较。证据不足时，继续按数学核查与知识观察提供帮助。</p>'+topics.map(task=>{
    const effects=activeStudyEffects(task);
    return '<h3>'+esc(tasks[task][0])+'</h3>'+Object.entries(effects).map(([kind,e])=>'<p><strong>'+(kind==='method'?'帮助方式':'提醒时机')+'</strong> · 完成窗口 '+(e.count||0)+' 次，等待 '+(e.pending||0)+' 次，结果缺失 '+(e.missing||0)+' 次。'+
      (e.interval?'效果差异区间 '+(e.interval[0]*100).toFixed(1)+' 至 '+(e.interval[1]*100).toFixed(1)+' 个百分点；'+(e.supported?'支持后续策略比较。':'尚不支持确定哪种更好。'):'尚无可用效果区间。')+'</p>').join('');
  }).join('')+'<p class="muted">时机比较衡量再次提交，不能当作知识提升。每轮评估独立；删除相关证据后该轮停止。</p></div>';
}
let activeDemoResult=null;
function runActiveDemo() {
  const task=InterventionPlanner.topics.indexOf(causalTopic),kind=Number(el('active-demo-kind').value);
  const scripts=[['k=0也可以','k<1','k<1且k≠0'],['x²=10','还不确定底数','10²=x'],
    ['a=2,b=2时最大值为4','4','固定a,b取0或2,比较a^2和a^2-2*a+2,上界为4,a=2,b=0取到']];
  const text=scripts[task][kind===3?0:kind],symbolic=SymbolicReasoner.check(task,text,{status:'scripted_fixture',claims:[]});
  const belief=ProbabilisticReasoner.infer({prior:.25,symbolic,assistance:'independent'});
  const effects=InterventionEstimator.simulatePolicyEvidence(causalTopic,{timingBenefit:kind===3?0:.10});
  const input={task,trigger:kind===1?'pause':'submission',symbolic,belief,effects,origin:'synthetic'};
  activeDemoResult={topic:causalTopic,text,symbolic,belief,plan:InterventionPlanner.plan(input),withoutCausal:InterventionPlanner.plan({...input,ablateCausal:true})};
  renderCausal();
}
function renderActiveDemoPanel() {
  const r=activeDemoResult?.topic===causalTopic?activeDemoResult:null;
  const label=p=>p.timing==='STAY_QUIET'?'保持安静':p.timing==='DEFER'?'暂缓提醒':({clarify:'主动邀请核查',concept_check:'主动提出概念核查',step_hint:'主动提出分步帮助'})[p.action];
  return '<div class="panel"><h2>主动介入演示</h2><p class="muted">模拟学习轨迹，不写入个人记录。这里复用实际决策模块；原文提取采用脚本样例，实际学习时调用本地模型。</p><label>选择情境 <select id="active-demo-kind"><option value="0">解释存在冲突</option><option value="1">信息还不充分</option><option value="2">推理顺利推进</option><option value="3">预计收益不足以打扰</option></select></label> <button class="secondary" onclick="runActiveDemo()">运行介入演示</button>'+
    (r?'<p>模拟输入：'+esc(r.text)+'</p><p><strong>学伴选择：'+label(r.plan)+'</strong></p><p>'+esc(r.plan.invitation||'这次不打断，等待新的学习证据。')+'</p><details><summary>查看决策依据</summary><p>符号核查：'+esc(r.symbolic.status)+'；知识后验试算：'+Math.round(r.belief.posterior*100)+'%（未校准）。</p><p>关闭因果比较时：'+label(r.withoutCausal)+'。因果模拟只用于演示，不改变真实用户策略。</p></details>':'')+'</div>';
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){invalidateActive('hidden');save();}});
window.addEventListener('blur',()=>{invalidateActive('blur');save();});
// Never replay a pre-reload invitation. Accepted work can resume within its outcome window.
invalidateActive('reloaded');save();
