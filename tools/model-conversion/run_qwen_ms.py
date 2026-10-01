"""Standalone offline CPU generation with MindSpore Lite; no GGUF/llama required."""
from pathlib import Path
import argparse
import json
import time
import sys

# Use project-local dependencies when run from the development checkout.
dependency_dir = Path(__file__).resolve().parent / 'qwen-python'
sys.path[:0] = [str(dependency_dir), str(Path(__file__).resolve().parent / 'python')]
from qwen_runtime import Lite, feed_for
from qwen_tokenizer import Tokenizer


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--model', type=Path, required=True)
    p.add_argument('--tokenizer', type=Path, required=True)
    p.add_argument('--runtime', type=Path)
    p.add_argument('--context', type=int, default=2048)
    p.add_argument('--question', required=True)
    p.add_argument('--max-tokens', type=int, default=64)
    p.add_argument('--threads', type=int, default=4)
    p.add_argument('--report', type=Path)
    a = p.parse_args()
    if not 1 <= a.max_tokens <= a.context or a.threads < 1:
        p.error('Invalid token/thread limits')
    tok = Tokenizer(a.tokenizer)
    ids = tok.chat(a.question)
    if len(ids) + a.max_tokens > a.context:
        p.error('Prompt plus generation budget exceeds context; input was not truncated')
    model = Lite(a.model, a.runtime, a.threads)
    generated, timings = [], []
    ended = False
    try:
        for _ in range(a.max_tokens):
            start = time.perf_counter()
            logits = model.run(feed_for(ids + generated, a.context))
            import numpy as np
            if not np.isfinite(logits).all():
                raise RuntimeError('Nonfinite model output')
            timings.append(time.perf_counter() - start)
            token = int(logits.argmax())
            if token in (151643, 151645):
                ended = True
                break
            generated.append(token)
        result = {'backend': 'MindSpore Lite CPU', 'context': a.context, 'kv_cache': False,
                  'input_tokens': len(ids), 'generated_tokens': generated,
                  'text': tok.decode(generated), 'stop_reason': 'eos' if ended else 'max_tokens',
                  'load_seconds': model.load_seconds, 'step_seconds': timings}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        if a.report:
            a.report.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    finally:
        model.close()


if __name__ == '__main__':
    main()
