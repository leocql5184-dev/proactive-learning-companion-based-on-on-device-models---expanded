"""Losslessly restore the decode .ms from the shipped prefill .ms and delta."""
from pathlib import Path
import hashlib, json, os
ROOT = Path(__file__).resolve().parents[2]

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def restore():
    directory = ROOT/'models/qwen3-ms'
    target = directory/'qwen-decode.ms'
    if target.exists():
        return
    spec = json.loads((directory/'decode-delta.json').read_text(encoding='utf-8'))
    base = directory/'qwen-prefill.ms'
    if digest(base) != spec['base_sha256']:
        raise RuntimeError('Prefill SHA-256 mismatch; decode cannot be restored')
    temporary = target.with_suffix('.ms.part')
    try:
        with base.open('rb') as source, (directory/'decode-delta.bin').open('rb') as literals, temporary.open('wb') as output:
            for operation, offset, length in spec['operations']:
                stream = source if operation == 'copy' else literals
                stream.seek(offset)
                while length:
                    data = stream.read(min(length, 1024*1024))
                    if not data: raise RuntimeError('Truncated model delta')
                    output.write(data); length -= len(data)
        if temporary.stat().st_size != spec['target_bytes'] or digest(temporary) != spec['target_sha256']:
            raise RuntimeError('Restored decode SHA-256 mismatch')
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)
    print('MindSpore decode restored and SHA-256 verified', flush=True)

if __name__ == '__main__':
    restore()
