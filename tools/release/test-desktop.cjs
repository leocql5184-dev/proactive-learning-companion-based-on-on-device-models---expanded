'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
// Only portable desktop checks. ArkTS tests require the optional DevEco toolchain.
const files=['active-intelligence','active-intervention-ui','cognitive-state','cognitive-ui',
  'desktop-opening','desktop-records','desktop-ui','intervention-estimator',
  'learning-flow','model-baseline','strategy-study','tutoring-guardrails'];
const result=spawnSync(process.execPath,['--test',...files.map(f=>'tests/'+f+'.test.cjs')],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
