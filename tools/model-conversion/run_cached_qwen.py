"""Offline standalone generation using exactly the app's two MindSpore models."""
from pathlib import Path
import sys, argparse, json, time
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/model-conversion/qwen-python'))
import numpy as np
from qwen_runtime import CachedQwen
from qwen_tokenizer import Tokenizer

def main():
    p=argparse.ArgumentParser();p.add_argument('--question',required=True)
    p.add_argument('--max-tokens',type=int,default=64);p.add_argument('--report',type=Path)
    a=p.parse_args();tok=Tokenizer(ROOT/'models/qwen3-ms/tokenizer.json');ids=tok.chat(a.question)
    if not 1<=a.max_tokens<=2048 or len(ids)+a.max_tokens>2048:p.error('Prompt plus output exceeds context')
    model=CachedQwen(ROOT/'models/qwen3-ms');generated=[];times=[];ended=False
    try:
        start=time.perf_counter();logits=model.start(ids);prefill=time.perf_counter()-start
        for i in range(a.max_tokens):
            if not np.isfinite(logits).all():raise RuntimeError('Nonfinite model output')
            token=int(logits.argmax())
            if token in (151643,151645):ended=True;break
            generated.append(token)
            if i+1<a.max_tokens:
                start=time.perf_counter();logits=model.step(token);times.append(time.perf_counter()-start)
        result={'backend':'MindSpore Lite CPU','kv_cache':True,'context':2048,'tokens':generated,
                'text':tok.decode(generated),'stop_reason':'eos' if ended else 'max_tokens',
                'prefill_seconds':prefill,'decode_seconds':times}
        print(json.dumps(result,ensure_ascii=False,indent=2))
        if a.report:a.report.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    finally:model.close()

if __name__=='__main__':main()
