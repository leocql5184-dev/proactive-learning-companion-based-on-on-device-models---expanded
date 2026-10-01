"""Export the local Qwen3 Q8_0 weights to a basic-operator ONNX graph.

Full forward, no KV cache; fixed context, right padding, last-position output.
GGUF remains the source of truth; all weight tensors are dequantized, not retrained.
"""
from pathlib import Path
import sys, argparse, json, hashlib

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / 'tools/model-conversion/qwen-python'),
               str(ROOT / 'tools/model-conversion/python'),
               str(next((ROOT / 'tools/local-llm/vendor').glob('llama.cpp-*')) / 'gguf-py')]
import numpy as np
import onnx
from onnx import helper as H, TensorProto as T, numpy_helper as N
from gguf import GGUFReader, dequantize


def export(out, seq, mode='full'):
    capacity = seq
    if mode == 'decode': seq = 1
    out.mkdir(parents=True, exist_ok=True)
    source=ROOT / 'models/qwen3/Qwen3-0.6B-Q8_0.gguf'
    with source.open('rb') as stream: source_hash=hashlib.file_digest(stream,'sha256').hexdigest()
    assert source_hash=='9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031'
    reader = GGUFReader(str(source))
    expected={'block_count':28,'embedding_length':1024,'feed_forward_length':3072,
              'attention.head_count':16,'attention.head_count_kv':8,'attention.key_length':128,
              'attention.value_length':128,'rope.freq_base':1000000.0}
    for key,value in expected.items():
        assert reader.fields['qwen3.'+key].contents()==value,key
    assert abs(reader.fields['qwen3.attention.layer_norm_rms_epsilon'].contents()-1e-6)<1e-12
    tensors = {t.name: t for t in reader.tensors}
    nodes, weights, used = [], [], set()
    cache_inputs, cache_outputs = [], []
    (out / 'weights').mkdir(exist_ok=True)

    def const(name, value):
        weights.append(N.from_array(np.asarray(value), name))
        return name

    def op(kind, *args, **kw):
        name = f'{kind}_{len(nodes)}'
        nodes.append(H.make_node(kind, list(args), [name], name=name, **kw))
        return name

    def weight(name):
        if name in used:
            return name
        used.add(name)
        t = tensors[name]
        data = np.ascontiguousarray(dequantize(t.data, t.tensor_type).reshape(tuple(t.shape[::-1])), dtype=np.float32)
        relative = 'weights/' + name + '.bin'
        data.tofile(out / relative)
        proto = T(); proto.name = name; proto.data_type = T.FLOAT; proto.dims.extend(data.shape)
        proto.data_location = T.EXTERNAL
        for k, v in [('location', relative), ('offset', '0'), ('length', str(data.nbytes))]:
            item = proto.external_data.add(); item.key = k; item.value = v
        weights.append(proto)
        return name

    eps = const('eps', np.float32(1e-6))
    scale = const('attn_scale', np.float32(128 ** -0.5))
    def norm(x, name):
        m = op('ReduceMean', op('Mul', x, x), axes=[-1], keepdims=1)
        return op('Mul', op('Div', x, op('Sqrt', op('Add', m, eps))), weight(name))

    def linear(x, name):
        return op('MatMul', x, op('Transpose', weight(name), perm=[1, 0]))

    def rope(x):
        a = op('Slice', x, 'half_start', 'half_end', 'last_axis')
        b = op('Slice', x, 'second_start', 'second_end', 'last_axis')
        rotated = op('Concat', op('Neg', b), a, axis=-1)
        return op('Add', op('Mul', x, 'rope_cos'), op('Mul', rotated, 'rope_sin'))

    for name, val in {'q_shape':[seq,16,128], 'kv_shape':[seq,8,128], 'flat_shape':[seq,2048],
                      'half_start':[0], 'half_end':[64], 'second_start':[64], 'second_end':[128],
                      'last_axis':[2], 'kv_repeat':np.repeat(np.arange(8),2)}.items():
        const(name, np.asarray(val, dtype=np.int64))
    x = op('Gather', weight('token_embd.weight'), 'input_ids', axis=0)
    for i in range(28):
        p = f'blk.{i}.'
        z = norm(x, p+'attn_norm.weight')
        q = op('Transpose', op('Reshape', linear(z,p+'attn_q.weight'),'q_shape'), perm=[1,0,2])
        k = op('Transpose', op('Reshape', linear(z,p+'attn_k.weight'),'kv_shape'), perm=[1,0,2])
        v = op('Transpose', op('Reshape', linear(z,p+'attn_v.weight'),'kv_shape'), perm=[1,0,2])
        q, k = rope(norm(q,p+'attn_q_norm.weight')), rope(norm(k,p+'attn_k_norm.weight'))
        if mode == 'decode':
            for label in ('key', 'value'):
                cache_inputs.append(H.make_tensor_value_info(f'past_{label}_{i}',T.FLOAT,[8,capacity,128]))
            k = op('Add', op('Mul', f'past_key_{i}', 'cache_keep'), op('Mul', k, 'cache_write'))
            v = op('Add', op('Mul', f'past_value_{i}', 'cache_keep'), op('Mul', v, 'cache_write'))
        if mode in ('prefill', 'decode'):
            for label, value in (('key', k), ('value', v)):
                name = f'present_{label}_{i}'
                nodes.append(H.make_node('Identity',[value],[name]))
                cache_outputs.append(H.make_tensor_value_info(name,T.FLOAT,[8,capacity,128]))
        k, v = op('Gather',k,'kv_repeat',axis=0), op('Gather',v,'kv_repeat',axis=0)
        scores = op('Mul',op('MatMul',q,op('Transpose',k,perm=[0,2,1])),scale)
        attn = op('Softmax',op('Add',scores,'attention_mask'),axis=-1)
        context = op('Reshape',op('Transpose',op('MatMul',attn,v),perm=[1,0,2]),'flat_shape')
        x = op('Add',x,linear(context,p+'attn_output.weight'))
        z = norm(x,p+'ffn_norm.weight')
        gate, up = linear(z,p+'ffn_gate.weight'),linear(z,p+'ffn_up.weight')
        x = op('Add',x,linear(op('Mul',op('Mul',gate,op('Sigmoid',gate)),up),p+'ffn_down.weight'))
        print(f'exported layer {i+1}/28',flush=True)
    x = norm(op('Gather',x,'last_position',axis=0),'output_norm.weight')
    logits = linear(x,'output.weight' if 'output.weight' in tensors else 'token_embd.weight')
    nodes.append(H.make_node('Identity',[logits],['logits']))
    inputs = [H.make_tensor_value_info(n,t,s) for n,t,s in [
        ('input_ids',T.INT32,[seq]), ('rope_cos',T.FLOAT,[1,seq,128]),
        ('rope_sin',T.FLOAT,[1,seq,128]), ('attention_mask',T.FLOAT,[1,seq,capacity]),
        ('last_position',T.INT32,[1])]]
    if mode == 'decode':
        inputs += [H.make_tensor_value_info(n,T.FLOAT,[1,capacity,1]) for n in ('cache_keep','cache_write')]
    graph = H.make_graph(nodes,'Qwen3-0.6B-Q8-dequantized',inputs+cache_inputs,
                         [H.make_tensor_value_info('logits',T.FLOAT,[1,151936])]+cache_outputs,weights)
    model = H.make_model(graph,opset_imports=[H.make_opsetid('',13)],producer_name='hlc-qwen-export')
    model.ir_version = 8
    onnx.save_model(model,str(out/'qwen.onnx'))
    onnx.checker.check_model(str(out/'qwen.onnx'))
    assert used == set(tensors), f'Unused tensors: {set(tensors)-used}'
    (out/'export.json').write_text(json.dumps({'context':capacity,'mode':mode,'kv_cache':mode!='full','layers':28,
        'source':'Qwen3-0.6B-Q8_0.gguf','source_sha256':source_hash,
        'onnx':onnx.__version__,'numpy':np.__version__,'weights':len(used)},indent=2))

if __name__ == '__main__':
    p=argparse.ArgumentParser(); p.add_argument('--context',type=int,default=128)
    p.add_argument('--mode',choices=['full','prefill','decode'],default='full')
    p.add_argument('--output',type=Path,default=ROOT/'outputs/qwen-ms/sharded')
    a=p.parse_args(); export(a.output,a.context,a.mode)
