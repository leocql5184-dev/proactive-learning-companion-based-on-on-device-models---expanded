from verify_qwen import *
from onnx import helper as H, TensorProto as T, numpy_helper as N
import onnx
out=ROOT/'outputs/qwen-ms'
w=np.arange(12,dtype=np.float32).reshape(3,4)
m=H.make_model(H.make_graph([H.make_node('MatMul',['x','w'],['y'])],'probe',
    [H.make_tensor_value_info('x',T.FLOAT,[1,3])],[H.make_tensor_value_info('y',T.FLOAT,[1,4])],
    [N.from_array(w,'w')]),opset_imports=[H.make_opsetid('',13)])
m.ir_version=8;onnx.save(m,str(out/'probe.onnx'))
base=ROOT/'tools/model-conversion/mindspore-lite-2.7.0-win-x64'
env=os.environ.copy();env['PATH']=str(base/'tools/converter/lib')+';'+str(ROOT/'tools/model-conversion/mingw-compatible')+';'+env['PATH']
for half in ('on','off'):
    subprocess.run([str(base/'tools/converter/converter/converter_lite.exe'),'--fmk=ONNX',
                   f'--modelFile={out}/probe.onnx',f'--outputFile={out}/probe-{half}',f'--fp16={half}'],env=env,check=True)
    lite=Lite(out/f'probe-{half}.ms');print(half,lite.run({'x':np.ones((1,3),np.float32)}));lite.close()
