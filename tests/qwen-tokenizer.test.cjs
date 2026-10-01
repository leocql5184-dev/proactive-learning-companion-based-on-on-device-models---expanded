const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const ts=require('D:/DevEco Studio/sdk/default/openharmony/ets/build-tools/ets-loader/node_modules/typescript/lib/typescript.js');
const source=fs.readFileSync('entry/src/main/ets/learning/QwenTokenizer.ets','utf8');
const exported={};
class Encoder {encodeInto(text){return new TextEncoder().encode(text);}}
class Decoder {decodeWithStream(data){return new TextDecoder().decode(data);}}
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exported,require:()=>({util:{TextEncoder:Encoder,TextDecoder:Decoder}}),Int32Array,Uint8Array});
const spec=JSON.parse(fs.readFileSync('models/qwen3-ms/tokenizer.json','utf8')),tok=new exported.QwenTokenizer(spec);
const cases=['你好，智伴同行！','若 lg x = 2，求x。','多行\n空格  正常123','<|im_start|>user\n你好 /no_think<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n','🙂é数学'];
const result=spawnSync('tools/model-conversion/python-runtime/python.exe',['-c',`import sys,json; sys.path[:0]=['tools/model-conversion','tools/model-conversion/qwen-python']; from qwen_tokenizer import Tokenizer; t=Tokenizer('models/qwen3-ms/tokenizer.json'); print(json.dumps([t.encode(s,True) for s in json.loads(sys.stdin.read())]))`],{input:JSON.stringify(cases),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1'},windowsHide:true});
assert.equal(result.status,0,result.stderr);const expected=JSON.parse(result.stdout);
cases.forEach((text,i)=>{const ids=tok.encode(text,true);assert.deepEqual(Array.from(ids),expected[i]);assert.equal(tok.decode(ids),text);});
console.log('PASS ArkTS tokenizer matches verified Python tokenizer, including Chinese/control tokens/Unicode');
