"""Validate delivered KV models against full ONNX and original GGUF, offline."""
from export_qwen import ROOT
import json, time, hashlib, subprocess, os, platform
import numpy as np
import onnxruntime as ort
from qwen_runtime import CachedQwen, feed_for
from qwen_tokenizer import Tokenizer
from verify_qwen import request

def digest(path):
    with path.open('rb') as f: return hashlib.file_digest(f, 'sha256').hexdigest()

def main():
    out = ROOT/'outputs/qwen-ms/kv2048'
    report = {'status':'running', 'context':2048, 'kv_cache':True, 'threads':4,
              'platform':platform.platform(), 'cases':[], 'boundaries':[]}
    def save():
        (out/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    save()
    log = (out/'reference.log').open('w')
    proc = subprocess.Popen([str(ROOT/'tools/local-llm/windows-cpu/llama-server.exe'),
        '-m',str(ROOT/'models/qwen3/Qwen3-0.6B-Q8_0.gguf'),'--host','127.0.0.1','--port','18766',
        '-c','2048','-t','4','--offline','--no-webui'],stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
    model = None
    try:
        for _ in range(120):
            if proc.poll() is not None: raise RuntimeError('Reference failed to start')
            try: request('/health'); break
            except Exception: time.sleep(.5)
        else: raise RuntimeError('Reference startup timed out')
        model = CachedQwen(out)
        tok = Tokenizer(ROOT/'outputs/qwen-ms/context2048/tokenizer.json')
        options = ort.SessionOptions(); options.intra_op_num_threads=4
        reference = ort.InferenceSession(str(ROOT/'outputs/qwen-ms/context2048/onnx/qwen.onnx'),options,providers=['CPUExecutionProvider'])
        def compare(actual, ids):
            expected=reference.run(None,feed_for(ids,2048))[0].ravel()
            delta=actual-expected
            return {'max_abs':float(abs(delta).max()),'rmse':float(np.sqrt(np.mean(delta**2))),
                    'top1_equal':bool(actual.argmax()==expected.argmax()),'finite':bool(np.isfinite(actual).all())}
        for prompt in ['你好，请用中文介绍你自己。','计算：1+1等于几？只回答结果。','请用一句话解释什么是函数。']:
            ids=tok.chat(prompt)
            text='<|im_start|>user\n'+prompt+' /no_think<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n'
            assert ids==request('/tokenize',{'content':text,'add_special':False,'parse_special':True})['tokens']
            start=time.perf_counter(); logits=model.start(ids); prefill=time.perf_counter()-start
            first=compare(logits,ids)
            generated=[];times=[]
            for i in range(64):
                assert np.isfinite(logits).all()
                token=int(logits.argmax());generated.append(token)
                if token in (151643,151645):break
                if i<63:
                    start=time.perf_counter();logits=model.step(token);times.append(time.perf_counter()-start)
            last=compare(logits,ids+generated[:-1])
            ref=request('/completion',{'prompt':ids,'n_predict':64,'temperature':0,'return_tokens':True,'cache_prompt':False})
            visible=lambda ts:[t for t in ts if t not in (151643,151645)]
            case={'prompt':prompt,'input_tokens':len(ids),'tokens':generated,'text':tok.decode(visible(generated)),
                  'reference_text':ref['content'],'reference_equal':visible(generated)==visible(ref['tokens']),
                  'eos':generated[-1] in (151643,151645),'prefill_seconds':prefill,'decode_seconds':times,
                  'first_numerics':first,'last_numerics':last}
            report['cases'].append(case);save();print(json.dumps(case,ensure_ascii=False),flush=True)
        for length in (1,2047):
            ids=([151644,872,198,108386]*512)[:length]
            logits=model.start(ids);before=compare(logits,ids)
            token=int(logits.argmax());after=compare(model.step(token),ids+[token])
            report['boundaries'].append({'length':length,'prefill':before,'decode':after})
        try: model.step(0)
        except ValueError: report['overflow_rejected']=True
        else: report['overflow_rejected']=False
        checks=[c[k] for c in report['cases'] for k in ('first_numerics','last_numerics')]
        checks += [c[k] for c in report['boundaries'] for k in ('prefill','decode')]
        report['acceptance']={'numerics':all(c['finite'] and c['top1_equal'] and c['max_abs']<.1 and c['rmse']<.02 for c in checks),
                              'gguf_generation_equal':all(c['reference_equal'] for c in report['cases']),
                              'chinese_generation_eos':all(c['eos'] for c in report['cases']),
                              'overflow_rejected':report['overflow_rejected']}
        report['files']={p.name:{'bytes':p.stat().st_size,'sha256':digest(p)} for p in
            [out/'qwen-prefill.ms',out/'qwen-decode.ms',ROOT/'outputs/qwen-ms/context2048/tokenizer.json',
             ROOT/'tools/model-conversion/mindspore-lite-2.7.0-win-x64/runtime/lib/libmindspore-lite.dll']}
        report['status']='passed' if all(report['acceptance'].values()) else 'failed';save()
        assert report['status']=='passed', report['acceptance']
    except Exception as exc:
        report['status']='failed';report['error']=str(exc);save();raise
    finally:
        if model:model.close()
        proc.terminate();proc.wait(timeout=20);log.close()

if __name__=='__main__':main()
