'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const includeRuntime=process.argv.includes('--runtime');
const outputIndex=process.argv.indexOf('--output-dir');
const outputBase=outputIndex>=0?path.resolve(root,process.argv[outputIndex+1]||''):path.join(root,'outputs/public-release');
if(!outputBase.startsWith(path.join(root,'outputs')+path.sep))throw Error('Release output must be inside project outputs.');
const dest=path.join(outputBase,includeRuntime?'windows-gguf':'source');
if(fs.existsSync(dest))throw Error('Stage already exists; move it aside before generating a new export: '+dest);
fs.mkdirSync(dest,{recursive:true});
const records=[];
function copy(relative) {
  const src=path.join(root,relative);if(!fs.existsSync(src))throw Error('Required release file missing: '+relative);
  const stat=fs.lstatSync(src);if(stat.isSymbolicLink())throw Error('Symlink excluded: '+relative);
  if(stat.isDirectory()) {
    for(const name of fs.readdirSync(src)) {
      if(['build','node_modules','oh_modules','.preview','.test','__pycache__'].includes(name))continue;
      copy(relative+'/'+name);
    }return;
  }
  if(/\.(exe|dll|gguf|ms|onnx|bin|zip|part|db|p12|p7b|pem|key|hap|log|pyc)$/i.test(relative)&&
    !(includeRuntime&&/^(tools\/local-llm\/windows-cpu\/|models\/qwen3\/)/.test(relative)))throw Error('Forbidden release file: '+relative);
  if(stat.size>10*1024*1024&&!includeRuntime)throw Error('Large source file: '+relative);
  const target=path.join(dest,relative);fs.mkdirSync(path.dirname(target),{recursive:true});
  if(relative==='.agents/skills/deveco-cli/SKILL.md') {
    const portable=fs.readFileSync(src,'utf8').replace(/^- CLI：.*$/m,'- CLI：安装后通过 PATH 中的 `devecocli` 命令调用。');
    fs.writeFileSync(target,portable);
  } else fs.copyFileSync(src,target);
}
const entries=['README.md','README-HCL.md','LICENSE','SECURITY.md','CONTRIBUTING.md','THIRD_PARTY_NOTICES.md',
  '.gitignore','.editorconfig','.env.example','package.json','PROJECT_BRIEF.md','AGENTS.md',
  '打开学伴.cmd','打开学伴MindSpore.cmd','关闭学伴.cmd','准备模型.cmd',
  'tools/local-llm/desktop','tools/local-llm/skills','tools/local-llm/Start-Desktop.ps1','tools/local-llm/Stop-Desktop.ps1',
  'tools/local-llm/Prepare-Desktop.ps1','tools/local-llm/runtime-manifest.json','tools/release',
  'tools/cognitive','tests','data/cognitive','data/knowledge_graph/fixed60/adjudicated-kept48.jsonl',
  'AppScope','entry/src','entry/build-profile.json5','entry/oh-package.json5',
  'hvigor','hvigorfile.ts','oh-package.json5','oh-package-lock.json5','code-linter.json5',
  '.agents/skills/deveco-cli','.agents/skills/dynamic-growth-profile','.github',
  'docs/INSTALL_DESKTOP.md','docs/PUBLISH_GITHUB.md','docs/PUBLICATION_AUDIT.md',
  'docs/SUBMISSION_MS.md','docs/CORE_INTELLIGENCE_PLAN.md','assets/guidance'];
// Optional MS sources only: no runtime, weights, original student data or signing tools.
for(const name of fs.readdirSync(path.join(root,'tools/model-conversion')))
  if(/\.(py|ps1)$/i.test(name))entries.push('tools/model-conversion/'+name);
// Exclude behavior seed during traversal rather than removing anything from the original project.
const excluded='entry/src/main/resources/rawfile/behavior_graph_v1.json';
const originalCopy=copy;
// Use a temporary filtered source list for entry/src to keep release traversal explicit.
function list(relative) {
  const src=path.join(root,relative),stat=fs.lstatSync(src);
  if(stat.isSymbolicLink())throw Error('Symlink excluded: '+relative);
  if(stat.isDirectory())return fs.readdirSync(src).filter(n=>!['build','__pycache__'].includes(n)).flatMap(n=>list(relative+'/'+n));
  return relative===excluded?[]:[relative];
}
for(const item of entries) {
  if(item==='entry/src')for(const file of list(item))originalCopy(file);
  else copy(item);
}
if(fs.existsSync(path.join(root,'docs/RELEASE_VALIDATION.md')))copy('docs/RELEASE_VALIDATION.md');
const build=fs.readFileSync(path.join(root,'build-profile.json5'),'utf8');
const sanitized=build.replace(/"signingConfigs"\s*:\s*\[[\s\S]*?\],/, '"signingConfigs": [],').replace(/\s*"signingConfig"\s*:\s*"default",/g,'');
if(/storePassword|keyPassword|storeFile/.test(sanitized))throw Error('Signing configuration sanitization failed');
fs.writeFileSync(path.join(dest,'build-profile.json5'),sanitized);
if(includeRuntime) {
  const runtime=require('../local-llm/runtime-manifest.json');
  const engineDir=path.join(root,runtime.engine.directory);
  const hashes=JSON.parse(fs.readFileSync(path.join(engineDir,'verified-files.json'),'utf8').replace(/^\uFEFF/,''));
  if(!hashes['llama-server.exe'])throw Error('Missing verified engine manifest');
  for(const [name,expected] of Object.entries(hashes)) {
    if(path.basename(name)!==name)throw Error('Invalid engine filename');
    if(crypto.createHash('sha256').update(fs.readFileSync(path.join(engineDir,name))).digest('hex')!==expected)throw Error('Engine integrity failure: '+name);
  }
  if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,runtime.model.path))).digest('hex')!==runtime.model.sha256)throw Error('Model integrity failure');
  copy('tools/local-llm/windows-cpu');copy(runtime.model.path);
}
const findings=[];
const patterns=[['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['aws-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['signing-secret',/"(?:storePassword|keyPassword)"\s*:\s*"[^"]+"/],
  ['embedded-password',/(?:password|passwd)\s*[:=]\s*['"][^'"\r\n]{8,}['"]/i],
  ['personal-machine-path',/[A-Z]:[\\/]Users[\\/](?!Public(?:[\\/]|\b)|Default(?:[\\/]|\b))[^\\/\s'"<>]+[\\/]/i],
  ['email-address',/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/]];
function audit(dir) {
  for(const name of fs.readdirSync(dir)) {
    const file=path.join(dir,name),stat=fs.statSync(file),relative=path.relative(dest,file).replaceAll('\\','/');
    if(stat.isDirectory()){audit(file);continue;}
    const buffer=fs.readFileSync(file);
    if(!/\.(exe|dll|gguf)$/i.test(file))for(const [kind,regex] of patterns)
      if(regex.test(buffer.toString('utf8')))findings.push({file:relative,kind});
    records.push({file:relative,bytes:stat.size,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});
  }
}audit(dest);
const report={generatedAt:new Date().toISOString(),includeRuntime,fileCount:records.length,bytes:records.reduce((s,r)=>s+r.bytes,0),findings,
  excluded:['original Git history','signing','submission','local IDE/Codex config','raw behavior records','MindSpore weights/runtimes'],
  limitation:'Pattern-based scan; embedded question redistribution authorization must be confirmed separately.'};
fs.writeFileSync(dest+'-manifest.json',JSON.stringify(records,null,2));
fs.writeFileSync(dest+'-audit.json',JSON.stringify(report,null,2));
if(findings.length)throw Error('Public export blocked by scan: '+JSON.stringify(findings));
console.log(JSON.stringify({directory:dest,...report},null,2));
