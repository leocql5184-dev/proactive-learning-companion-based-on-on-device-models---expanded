"""Assemble a verified model submission candidate. Does not change app configuration."""
from pathlib import Path
import json
import hashlib
import shutil

ROOT = Path(__file__).resolve().parents[2]
source = ROOT/'outputs/qwen-ms/context2048'
report = json.loads((source/'verification.json').read_text(encoding='utf-8'))
assert report.get('status') == 'passed' and all(report['acceptance'].values()), 'Verification not accepted'
assert json.loads((source/'tokenizer-verification.json').read_text(encoding='utf-8'))['passed']
assert json.loads((source/'standalone.json').read_text(encoding='utf-8'))['backend'] == 'MindSpore Lite CPU'
target = ROOT/'outputs/qwen-ms/submission-qwen3-ms'
target.mkdir(exist_ok=True)
files = [source/'qwen3-0.6b-context2048.ms', source/'tokenizer.json', source/'verification.json',
         source/'tokenizer-verification.json', source/'standalone.json', source/'converter.log',
         source/'onnx/export.json', ROOT/'models/qwen3/LICENSE',
         ROOT/'outputs/qwen-ms/application-regression.log']
files += [ROOT/'tools/model-conversion'/name for name in
          ['run_qwen_ms.py', 'qwen_runtime.py', 'qwen_tokenizer.py', 'export_qwen.py',
           'verify_qwen.py', 'Convert-Qwen.ps1', 'package_qwen.py']]
for f in files:
    shutil.copy2(f, target/f.name)
shutil.copy2(ROOT/'docs/QWEN_MS_SUBMISSION.md', target/'README.md')
manifest = {'status': 'verified_windows_cpu_submission_candidate',
            'competition_eligibility': 'not_checked_without_rules', 'harmony_device_tested': False,
            'application_backend': 'unchanged_GGUF', 'files': []}
for f in sorted(target.iterdir()):
    if f.is_file() and f.name != 'manifest.json':
        with f.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        if f.suffix == '.ms':
            assert digest == report['sha256'], 'Verified model hash mismatch'
        manifest['files'].append({'name': f.name, 'bytes': f.stat().st_size, 'sha256': digest})
(target/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(target)
