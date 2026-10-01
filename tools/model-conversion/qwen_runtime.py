from pathlib import Path
import ctypes as C
import os, time
import numpy as np
ROOT = Path(__file__).resolve().parents[2]

class TensorArray(C.Structure):
    _fields_=[('count',C.c_size_t),('items',C.POINTER(C.c_void_p))]

class Lite:
    def __init__(self, path, runtime=None, threads=8):
        base=Path(runtime).resolve() if runtime else ROOT/'tools/model-conversion/mindspore-lite-2.7.0-win-x64'
        self.dirs=[os.add_dll_directory(str(p)) for p in [base/'runtime/lib',base/'runtime/third_party/glog',
                   (base/'mingw-compatible' if runtime else ROOT/'tools/model-conversion/mingw-compatible')] if p.is_dir()]
        self.lib=C.CDLL(str(base/'runtime/lib/libmindspore-lite.dll'))
        def bind(name,ret,args):
            f=getattr(self.lib,name); f.restype=ret; f.argtypes=args; return f
        P=C.c_void_p; I=C.c_int
        # This Windows package exports the C++ Version API, not MSVersion.
        self.version='MindSpore Lite 2.7.0 (package version; DLL SHA-256 recorded separately)'
        self.create=bind('MSModelCreate',P,[])
        ctx=bind('MSContextCreate',P,[])()
        bind('MSContextSetThreadNum',None,[P,I])(ctx,threads)
        bind('MSContextSetThreadAffinityMode',None,[P,I])(ctx,0)
        device=bind('MSDeviceInfoCreate',P,[I])(0)
        bind('MSContextAddDeviceInfo',None,[P,P])(ctx,device)
        self.model=self.create()
        start=time.perf_counter()
        status=bind('MSModelBuildFromFile',I,[P,C.c_char_p,I,P])(self.model,str(path).encode(),0,ctx)
        assert status==0, f'Lite build failed {status}'
        self.load_seconds=time.perf_counter()-start
        self.inputs=bind('MSModelGetInputs',TensorArray,[P])(self.model)
        self.name=bind('MSTensorGetName',C.c_char_p,[P])
        self.size=bind('MSTensorGetDataSize',C.c_size_t,[P])
        self.data=bind('MSTensorGetMutableData',P,[P])
        self.predict=bind('MSModelPredict',I,[P,TensorArray,C.POINTER(TensorArray),P,P])
        self.destroy=bind('MSModelDestroy',None,[C.POINTER(P)])
        self.context=ctx
        self.destroy_context=bind('MSContextDestroy',None,[C.POINTER(P)])
        print('Lite loaded',self.load_seconds,'seconds',flush=True)

    def run_views(self,feed):
        for i in range(self.inputs.count):
            handle=self.inputs.items[i]; name=self.name(handle).decode()
            a=np.ascontiguousarray(feed[name]); assert self.size(handle)==a.nbytes,(name,self.size(handle),a.nbytes)
            C.memmove(self.data(handle),a.ctypes.data,a.nbytes)
        out=TensorArray()
        status=self.predict(self.model,self.inputs,C.byref(out),None,None)
        assert status==0,f'Lite predict failed {status}'
        return {self.name(out.items[i]).decode(): np.ctypeslib.as_array(
            C.cast(self.data(out.items[i]),C.POINTER(C.c_float)),shape=(self.size(out.items[i])//4,))
            for i in range(out.count)}

    def run(self,feed):
        return self.run_views(feed)['logits'].copy()

    def close(self):
        self.destroy(C.byref(C.c_void_p(self.model)))
        # The Lite model retains and owns its context after build.

def feed_for(ids,seq=128):
    assert 0<len(ids)<=seq
    tokens=np.zeros(seq,np.int32); tokens[:len(ids)]=ids
    freq=1.0/(1000000.0**(np.arange(0,128,2,dtype=np.float32)/128))
    angles=np.outer(np.arange(seq,dtype=np.float32),freq)
    angles=np.concatenate([angles,angles],axis=-1)[None]
    return {'input_ids':tokens,'rope_cos':np.cos(angles).astype(np.float32),
            'rope_sin':np.sin(angles).astype(np.float32),
            'attention_mask':np.triu(np.full((1,seq,seq),-10000,np.float32),k=1),
            'last_position':np.array([len(ids)-1],np.int32)}


class CachedQwen:
    """One full prefill followed by single-token forwards with explicit KV tensors."""
    def __init__(self, directory, context=2048, threads=4):
        self.context=context
        self.prefill=Lite(Path(directory)/'qwen-prefill.ms', threads=threads)
        self.decode=Lite(Path(directory)/'qwen-decode.ms', threads=threads)
        self.position=None
        self.cache=None

    def start(self, ids):
        if not 0 < len(ids) <= self.context:
            raise ValueError('Input exceeds model context')
        self.cache=self.prefill.run_views(feed_for(ids,self.context))
        self.position=len(ids)
        return self.cache['logits'].copy()

    def step(self, token):
        if self.position is None or self.position >= self.context:
            raise ValueError('No active context or context exhausted')
        pos=self.position
        angle=pos/(1000000.0**(np.arange(0,128,2,dtype=np.float32)/128))
        angle=np.concatenate([angle,angle]).reshape(1,1,128)
        write=np.zeros((1,self.context,1),np.float32);write[0,pos,0]=1
        mask=np.zeros((1,1,self.context),np.float32);mask[:,:,pos+1:]=-10000
        feed={'input_ids':np.array([token],np.int32),'last_position':np.array([0],np.int32),
              'rope_cos':np.cos(angle),'rope_sin':np.sin(angle),'attention_mask':mask,
              'cache_keep':1-write,'cache_write':write}
        feed.update({name.replace('present_','past_'):data for name,data in self.cache.items() if name!='logits'})
        self.cache=self.decode.run_views(feed)
        self.position+=1
        return self.cache['logits'].copy()

    def close(self):
        self.cache=None
        self.prefill.close();self.decode.close()

