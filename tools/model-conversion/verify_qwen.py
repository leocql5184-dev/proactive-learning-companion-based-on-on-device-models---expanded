"""Run real MindSpore Lite C API inference and compare with ONNX / llama.cpp."""
from export_qwen import ROOT
import ctypes as C
import os, json, time, argparse, hashlib, subprocess, urllib.request
from pathlib import Path
import numpy as np
import platform

from qwen_runtime import Lite, feed_for

def request(route,payload=None):
    req=urllib.request.Request('http://127.0.0.1:18766'+route,
        data=None if payload is None else json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=120) as r: return json.load(r)

def main():
    p=argparse.ArgumentParser();p.add_argument('--onnx',action='store_true')
    p.add_argument('--model',default='qwen3-0.6b-context128.ms');p.add_argument('--tokens',type=int,default=24)
    p.add_argument('--context',type=int,default=128)
    p.add_argument('--out',type=Path,default=ROOT/'outputs/qwen-ms')
    p.add_argument('--onnx-dir',default='sharded');a=p.parse_args()
    out=a.out.resolve()
    model=out/a.model
    log=open(out/'reference-server.log','w')
    server=subprocess.Popen([str(ROOT/'tools/local-llm/windows-cpu/llama-server.exe'),
        '-m',str(ROOT/'models/qwen3/Qwen3-0.6B-Q8_0.gguf'),'--host','127.0.0.1','--port','18766',
        '-c',str(max(512,a.context)),'-t','8','--offline','--no-webui'],stdout=log,stderr=log,
        creationflags=subprocess.CREATE_NO_WINDOW)
    lite=None
    try:
        for _ in range(120):
            if server.poll() is not None: raise RuntimeError('reference server failed to start')
            try:
                request('/health');break
            except Exception: time.sleep(0.5)
        else: raise RuntimeError('reference server startup timed out')
        lite=Lite(model)
        report={'status':'running','load_seconds':lite.load_seconds,'context':a.context,'kv_cache':False,'threads':8,'cases':[],
                'runtime_version':lite.version,'platform':platform.platform(),
                'cpu':os.environ.get('PROCESSOR_IDENTIFIER'),'python':platform.python_version()}
        runtime_path=ROOT/'tools/model-conversion/mindspore-lite-2.7.0-win-x64/runtime/lib/libmindspore-lite.dll'
        with runtime_path.open('rb') as stream:
            report['runtime_sha256']=hashlib.file_digest(stream,'sha256').hexdigest()
        ort=None
        if a.onnx:
            import onnxruntime as ORT
            options=ORT.SessionOptions();options.intra_op_num_threads=8
            ort=ORT.InferenceSession(str(out/a.onnx_dir/'qwen.onnx'),options,providers=['CPUExecutionProvider'])
        prompts=['你好，请用中文介绍你自己。','计算：1+1等于几？只回答结果。','请用一句话解释什么是函数。']
        for prompt in prompts:
            text='<|im_start|>user\n'+prompt+' /no_think<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n'
            ids=request('/tokenize',{'content':text,'add_special':False,'parse_special':True})['tokens']
            feed=feed_for(ids,a.context);start=time.perf_counter();logits=lite.run(feed);elapsed=time.perf_counter()-start
            assert np.isfinite(logits).all() and np.ptp(logits)>0, 'Invalid constant/nonfinite logits'
            ref=request('/completion',{'prompt':ids,'n_predict':1,'temperature':0,'n_probs':10,'return_tokens':True,'cache_prompt':False})
            case={'prompt':prompt,'input_tokens':len(ids),'lite_top1':int(logits.argmax()),'seconds':elapsed,
                  'reference_top1_equal':int(logits.argmax())==ref['tokens'][0],
                  'reference':ref,'lite_top10':np.argsort(logits)[-10:][::-1].tolist()}
            if ort:
                expected=ort.run(None,feed)[0].ravel(); delta=logits-expected
                case['onnx_comparison']={'max_abs':float(abs(delta).max()),'rmse':float(np.sqrt(np.mean(delta**2))),
                                        'top1':int(expected.argmax()),'top1_equal':bool(logits.argmax()==expected.argmax())}
            print(json.dumps({k:v for k,v in case.items() if k!='reference'},ensure_ascii=False),flush=True)
            generated=[];times=[]
            for step in range(a.tokens):
                if step:
                    if len(ids+generated)>a.context: break
                    start=time.perf_counter();logits=lite.run(feed_for(ids+generated,a.context));times.append(time.perf_counter()-start)
                token=int(logits.argmax());generated.append(token)
                if token in (151643,151645):break
            case['generated_tokens']=generated
            case['text']=request('/detokenize',{'tokens':generated})['content']
            case['ended_with_eos']=generated[-1] in (151643,151645)
            case['decode_seconds']=times
            full_ref=request('/completion',{'prompt':ids,'n_predict':a.tokens,'temperature':0,
                'return_tokens':True,'cache_prompt':False})
            case['reference_generation']={'text':full_ref['content'],'tokens':full_ref['tokens']}
            # Normalize EOS independently of the reference server's return policy.
            visible=[t for t in generated if t not in (151643,151645)]
            case['reference_generation_equal']=visible==[t for t in full_ref['tokens'] if t not in (151643,151645)]
            if ort:
                final_feed=feed_for(ids+generated[:-1],a.context)
                final_expected=ort.run(None,final_feed)[0].ravel()
                final_actual=lite.run(final_feed)
                diff=final_actual-final_expected
                case['last_step_onnx']={'max_abs':float(abs(diff).max()),
                    'rmse':float(np.sqrt(np.mean(diff**2))),
                    'top1_equal':bool(final_actual.argmax()==final_expected.argmax())}
            report['cases'].append(case)
            (out/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
            print(case['text'],flush=True)
        report['boundary_cases']=[]
        if ort:
            for length in (1,a.context):
                feed=feed_for(([151644,872,198,108386]*((a.context+3)//4))[:length],a.context)
                actual=lite.run(feed);expected=ort.run(None,feed)[0].ravel()
                delta=actual-expected
                report['boundary_cases'].append({'length':length,'max_abs':float(abs(delta).max()),
                    'rmse':float(np.sqrt(np.mean(delta**2))),'top1_equal':bool(actual.argmax()==expected.argmax())})
        with model.open('rb') as stream: report['sha256']=hashlib.file_digest(stream,'sha256').hexdigest()
        report['model_bytes']=model.stat().st_size
        report['model_file']=str(model.relative_to(ROOT))
        report['acceptance']={'finite_and_nonconstant':True,
            'all_reference_top1_equal':all(c['reference_top1_equal'] for c in report['cases']),
            'all_reference_generations_equal':all(c['reference_generation_equal'] for c in report['cases']),
            'context_boundaries_pass':a.onnx and all(c['max_abs']<0.1 and c['rmse']<0.02 and c['top1_equal']
                for c in report['boundary_cases']),
            'onnx_numerics_pass':a.onnx and all(all(c[field]['max_abs']<0.1 and
                c[field]['rmse']<0.02 and c[field]['top1_equal'] for field in ('onnx_comparison','last_step_onnx'))
                for c in report['cases']), 'all_chinese_generations_ended':all(c['ended_with_eos'] for c in report['cases'])}
        report['status']='passed' if all(report['acceptance'].values()) else 'failed'
        (out/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        assert all(report['acceptance'].values()),report['acceptance']
    finally:
        if lite:lite.close()
        server.terminate();server.wait(timeout=20);log.close()

if __name__=='__main__':main()
