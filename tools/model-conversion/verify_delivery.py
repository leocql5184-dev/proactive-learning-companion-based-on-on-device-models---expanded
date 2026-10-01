"""Verify a copied delivery using Python's standard library, without inference."""
from pathlib import Path
import argparse
import hashlib
import json
from datetime import datetime, timezone


def verify(directory):
    directory = directory.resolve()
    manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
    checked = set()
    total = 0
    for entry in manifest['files']:
        relative = entry['path']
        path = (directory / relative).resolve()
        if not path.is_relative_to(directory) or relative in checked:
            raise ValueError('Invalid or duplicate manifest path: ' + relative)
        if path.stat().st_size != entry['bytes']:
            raise ValueError('Size mismatch: ' + relative)
        with path.open('rb') as stream:
            actual = hashlib.file_digest(stream, 'sha256').hexdigest()
        if actual != entry['sha256']:
            raise ValueError('SHA-256 mismatch: ' + relative)
        checked.add(relative)
        total += entry['bytes']
    required = {
        'outputs/qwen-ms/kv2048/qwen-prefill.ms',
        'outputs/qwen-ms/kv2048/qwen-decode.ms',
        'outputs/qwen-ms/context2048/tokenizer.json',
        'tools/model-conversion/python-runtime/python.exe',
        'tools/local-llm/node/node.exe',
        'tools/local-llm/desktop/server.cjs',
        'tools/model-conversion/serve_qwen_ms.py',
        'models/qwen3/Qwen3-0.6B-Q8_0.gguf',
    }
    if not required.issubset(checked):
        raise ValueError('Required runtime files missing from manifest')
    return {'status': 'passed', 'testedAt': datetime.now(timezone.utc).isoformat(),
            'directory': str(directory), 'files': len(checked), 'bytes': total,
            'scope': 'All manifest file sizes and SHA-256; inference verified separately'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path,
                        default=Path(__file__).resolve().parents[2])
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    try:
        result = verify(args.directory)
    except Exception as exc:
        result = {'status': 'failed', 'error': str(exc)}
    text = json.dumps(result, ensure_ascii=False, indent=2)
    print(text)
    if args.report:
        args.report.write_text(text, encoding='utf-8')
    if result['status'] != 'passed':
        raise SystemExit(1)


if __name__ == '__main__':
    main()
