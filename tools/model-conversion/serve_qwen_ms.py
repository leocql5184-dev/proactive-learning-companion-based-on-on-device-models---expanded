"""Loopback-only, authenticated MindSpore Lite backend for the desktop app."""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/model-conversion/qwen-python'))
import argparse, hashlib, hmac, itertools, json, os, select, socket, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import numpy as np
from qwen_runtime import CachedQwen
from qwen_tokenizer import Tokenizer
from restore_ms import restore


def schema_choices(schema):
    """The app uses bounded objects of string enums, not arbitrary JSON schemas."""
    if schema is None: return None
    props=schema.get('properties',{})
    if (schema.get('type')!='object' or schema.get('additionalProperties') is not False
        or set(schema.get('required',[]))!=set(props) or not 1<=len(props)<=2):
        raise ValueError('Unsupported structured output schema')
    enums=[]
    for prop in props.values():
        values=prop.get('enum',[])
        if prop.get('type')!='string' or not 1<=len(values)<=64 or any(not isinstance(s,str) or len(s)>300 for s in values):
            raise ValueError('Invalid enum')
        enums.append(values)
    if np.prod([len(e) for e in enums])>128: raise ValueError('Too many choices')
    return [json.dumps(dict(zip(props,values)),ensure_ascii=False,separators=(',',':')) for values in itertools.product(*enums)]


def main():
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8766);a=p.parse_args()
    key=os.environ['COMPANION_ENGINE_KEY']
    directory=ROOT/'models/qwen3-ms'
    restore()
    report=json.loads((directory/'verification.json').read_text(encoding='utf-8'))
    if report.get('status')!='passed' or not all(report.get('acceptance',{}).values()):
        raise RuntimeError('KV models have not passed verification')
    paths=[directory/'qwen-prefill.ms',directory/'qwen-decode.ms',directory/'tokenizer.json',
           ROOT/'tools/model-conversion/mindspore-lite-2.7.0-win-x64/runtime/lib/libmindspore-lite.dll']
    for path in paths:
        with path.open('rb') as f: digest=hashlib.file_digest(f,'sha256').hexdigest()
        if digest!=report['files'][path.name]['sha256']:raise RuntimeError('Verified artifact hash mismatch: '+path.name)
    model=CachedQwen(directory)
    tok=Tokenizer(paths[2]);lock=threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass # Do not persist student prompts.
        def reply(self,status,value):
            data=json.dumps(value,ensure_ascii=False).encode('utf-8')
            self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8')
            self.send_header('Content-Length',str(len(data)));self.end_headers()
            try:self.wfile.write(data)
            except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError):pass
        def authorized(self):
            return self.headers.get('Host')==f'127.0.0.1:{a.port}' and hmac.compare_digest(
                self.headers.get('Authorization',''),'Bearer '+key) and not self.headers.get('Origin')
        def do_GET(self):
            if not self.authorized():return self.reply(403,{'error':'Forbidden'})
            if self.path!='/health':return self.reply(404,{'error':'Not found'})
            self.reply(200,{'status':'ok','backend':'mindspore-lite','context':2048,'kv_cache':True,'busy':lock.locked()})
        def do_POST(self):
            if not self.authorized():return self.reply(403,{'error':'Forbidden'})
            if self.path!='/completion':return self.reply(404,{'error':'Not found'})
            if not lock.acquire(blocking=False):return self.reply(503,{'error':'Busy'})
            try:
                self.connection.settimeout(5)
                size=int(self.headers.get('Content-Length','0'))
                if not 0<size<=48000:raise ValueError('Invalid request size')
                data=json.loads(self.rfile.read(size))
                prompt=data.get('prompt');budget=data.get('n_predict',32)
                if not isinstance(prompt,str) or not isinstance(budget,int) or not 1<=budget<=384:
                    raise ValueError('Invalid prompt or token budget')
                ids=tok.encode(prompt,parse_special=True)
                if not ids or len(ids)+budget>2048:raise ValueError('Prompt plus output exceeds context')
                choices=schema_choices(data.get('json_schema'))
                trie={}
                if choices is not None:
                    for choice in choices:
                        node=trie
                        for token in tok.encode(choice):node=node.setdefault(token,{})
                        node[151645]={}
                node=trie;generated=[];ended=False;start=time.perf_counter();deadline=start+43
                def alive():
                    if time.perf_counter()>deadline:raise TimeoutError('Inference deadline exceeded')
                    readable,_,_=select.select([self.connection],[],[],0)
                    if readable and not self.connection.recv(1,socket.MSG_PEEK):raise ConnectionAbortedError()
                alive();logits=model.start(ids);prefill=time.perf_counter()-start
                for step in range(budget):
                    alive()
                    if not np.isfinite(logits).all():raise RuntimeError('Nonfinite logits')
                    if choices is not None:
                        allowed=list(node);token=max(allowed,key=lambda t:float(logits[t]));node=node[token]
                    else:token=int(logits.argmax())
                    if token in (151643,151645):ended=True;break
                    generated.append(token)
                    if step+1<budget:logits=model.step(token)
                alive()
                self.reply(200,{'content':tok.decode(generated),'stopped_limit':not ended,
                    'backend':'mindspore-lite','tokens_predicted':len(generated),
                    'timings':{'prefill_seconds':prefill,'total_seconds':time.perf_counter()-start}})
            except (ValueError,KeyError,TypeError,json.JSONDecodeError):self.reply(400,{'error':'Invalid model request'})
            except (TimeoutError,ConnectionAbortedError,ConnectionResetError):self.reply(408,{'error':'Stopped or timed out'})
            except Exception:self.reply(500,{'error':'MindSpore inference failed'})
            finally:
                model.cache=None;model.position=None;lock.release()
    server=ThreadingHTTPServer(('127.0.0.1',a.port),Handler)
    try:server.serve_forever()
    finally:server.server_close();model.close()

if __name__=='__main__':main()
