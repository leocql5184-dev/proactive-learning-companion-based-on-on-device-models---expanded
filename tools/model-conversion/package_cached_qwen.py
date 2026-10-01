"""Build a runnable Windows delivery with both backends and SHA-256 inventory."""
from pathlib import Path
import argparse, hashlib, json, shutil, stat, sys
ROOT=Path(__file__).resolve().parents[2]

def main():
    p=argparse.ArgumentParser();p.add_argument('--node',type=Path,required=True);a=p.parse_args()
    report=json.loads((ROOT/'outputs/qwen-ms/kv2048/verification.json').read_text(encoding='utf-8'))
    assert report['status']=='passed' and all(report['acceptance'].values())
    for backend in ('mindspore','gguf'):
        smoke=json.loads((ROOT/f'outputs/qwen-ms/{backend}-application-smoke.json').read_text(encoding='utf-8'))
        assert smoke['status']=='passed', backend+' integration not accepted'
        assert len(smoke['cases']) == 6 and all(c['packet']['inference'] == backend for c in smoke['cases'])
    target=ROOT/'outputs/qwen-ms/delivery'
    target.mkdir(exist_ok=True)
    def copy_file(source, destination):
        # copy2 preserves read-only model attributes; permit a subsequent rebuild.
        destination = Path(destination)
        if destination.exists():
            destination.chmod(destination.stat().st_mode | stat.S_IWRITE)
        return shutil.copy2(source, destination)
    def copy(source,relative):
        dest=target/relative;dest.parent.mkdir(parents=True,exist_ok=True)
        if source.is_dir():shutil.copytree(source,dest,dirs_exist_ok=True,copy_function=copy_file,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
        else:copy_file(source,dest)
    for relative in ['打开学伴.cmd','打开学伴MindSpore.cmd','关闭学伴.cmd',
        'tools/local-llm/Start-Desktop.ps1','tools/local-llm/Stop-Desktop.ps1',
        'tools/local-llm/desktop','tools/local-llm/skills','tools/local-llm/windows-cpu','models/qwen3',
        'tools/model-conversion/mindspore-lite-2.7.0-win-x64','tools/model-conversion/mingw-compatible',
        'outputs/qwen-ms/kv2048/qwen-prefill.ms','outputs/qwen-ms/kv2048/qwen-decode.ms',
        'outputs/qwen-ms/kv2048/verification.json','outputs/qwen-ms/context2048/tokenizer.json',
        'outputs/qwen-ms/context2048/tokenizer-verification.json',
        'outputs/qwen-ms/mindspore-application-smoke.json','outputs/qwen-ms/gguf-application-smoke.json',
        'outputs/qwen-ms/project-readiness.json','outputs/qwen-ms/delivery-application-smoke.json',
        'outputs/qwen-ms/application-regression.log','outputs/qwen-ms/kv2048/convert-prefill.log',
        'outputs/qwen-ms/kv2048/convert-decode.log',
        'docs/QWEN_MS_SUBMISSION.md','docs/QWEN_MS_CONVERSION.md',
        'tests/mindspore-backend-smoke.cjs']:
        copy(ROOT/relative,relative)
    for name in ['serve_qwen_ms.py','run_cached_qwen.py','qwen_runtime.py','qwen_tokenizer.py','export_qwen.py',
                 'verify_cached_qwen.py','verify_qwen.py','verify_delivery.py','Convert-QwenCached.ps1','package_cached_qwen.py']:
        copy(ROOT/'tools/model-conversion'/name,'tools/model-conversion/'+name)
    py=Path(sys.executable).parent
    for f in py.iterdir():
        if f.is_file() and (f.suffix.lower() in ('.exe','.dll') or f.name=='LICENSE.txt'):
            copy(f,'tools/model-conversion/python-runtime/'+f.name)
    copy(py/'DLLs','tools/model-conversion/python-runtime/DLLs')
    shutil.copytree(py/'Lib',target/'tools/model-conversion/python-runtime/Lib',dirs_exist_ok=True,
                    copy_function=copy_file,ignore=shutil.ignore_patterns('site-packages','__pycache__','*.pyc'))
    for name in ['numpy','numpy.libs','numpy-2.5.3.dist-info','regex','regex-2024.11.6.dist-info']:
        copy(ROOT/'tools/model-conversion/qwen-python'/name,'tools/model-conversion/qwen-python/'+name)
    (target/'tools/model-conversion/python').mkdir(exist_ok=True)
    copy(a.node,'tools/local-llm/node/node.exe')
    vendor=next((ROOT/'tools/local-llm/vendor').glob('llama.cpp-*'))
    copy(vendor/'LICENSE','tools/local-llm/windows-cpu/LICENSE-llama.cpp')
    copy(vendor/'licenses','tools/local-llm/windows-cpu/third-party-licenses')
    if (a.node.parent/'LICENSE').exists():copy(a.node.parent/'LICENSE','tools/local-llm/node/LICENSE')
    copy(ROOT/'docs/QWEN_MS_SUBMISSION.md','README.md')
    manifest={'status':'verified_windows_cpu_application','competition_eligibility':'pending_specific_rules',
        'harmony_device_tested':False,'default_backend':'gguf','optional_backend':'mindspore',
        'python':sys.version,'files':[]}
    for f in sorted(target.rglob('*')):
        if not f.is_file() or f==target/'manifest.json':continue
        with f.open('rb') as stream:digest=hashlib.file_digest(stream,'sha256').hexdigest()
        if f.name in report['files']:assert digest==report['files'][f.name]['sha256'], f
        manifest['files'].append({'path':f.relative_to(target).as_posix(),'bytes':f.stat().st_size,'sha256':digest})
    (target/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'directory':str(target),'files':len(manifest['files']),
        'bytes':sum(f['bytes'] for f in manifest['files'])},indent=2))

if __name__=='__main__':main()
