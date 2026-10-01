"""Independent numerical reference for the ArkTS input adapter."""
import sys
sys.dont_write_bytecode = True
import json
from pathlib import Path
import numpy as np
import ast
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root/'outputs/guidance-model-v2/scripts'))
import model_core_v2 as core
output = root/'outputs/behavior-collection-verification'
actual = json.loads((output/'arkts-preprocessed.json').read_text())
paths = ['outputs/training-data-v1/synthetic_test_120.jsonl', 'outputs/training-data-v1/synthetic_test_150.jsonl',
         'outputs/video-readiness-20260922/user_zip_120.jsonl']
rows = sum([core.read_jsonl(root/p) for p in paths], [])
assert [r['sample_id'] for r in rows] == [r['sample_id'] for r in actual]
raw, _ = core.raw_matrix(rows)
report = {}
# Execute only the pure derive_features function extracted from the original training-data generator.
# It verifies the first 13 cumulative/time fields from identical event prefixes, without running its generator.
generator = root/'outputs/training-data-v1/tools/gen_training_expansion.py'
tree = ast.parse(generator.read_text(encoding='utf-8'))
function = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'derive_features')
namespace = {'FEATURE_ORDER': core.SCHEMA['feature_order']}
exec(compile(ast.Module(body=[function], type_ignores=[]), str(generator), 'exec'), namespace)
traces = json.loads((output/'event-traces.json').read_text())
for trace in traces:
    mapped, offsets = [], []
    for e in trace['session']['events']:
        if e['timestamp'] > trace['time']: continue
        if e['kind'] == 'answer_submitted': event = ('ans', e['correct'])
        elif e['kind'] == 'hint_shown': event = ('hint',)
        elif e['kind'] in ('help_requested', 'task_split_requested'): event = ('help',)
        elif e['kind'] == 'break_requested': event = ('self',)
        else: continue
        mapped.append(event); offsets.append(e['offsetMs'])
    expected = namespace['derive_features'](trace['session']['taskId'], mapped, offsets,
        trace['time'] - trace['session']['startedAt'], {}, 0)
    assert [expected[k] for k in core.SCHEMA['feature_order'][:13]] == trace['values'][:13]
report['event_prefix_features'] = {'traces': len(traces), 'fields': 13, 'pass': True,
    'reference': 'Original training generator derive_features; live request consumption verified in domain tests.'}
for head in ('action', 'state'):
    prep = json.loads((core.ROOT/f'model/{head}/preprocessing.json').read_text())
    expected = core.preprocess(raw, prep)
    observed = np.asarray([r[head] for r in actual], dtype=np.float32)
    error = float(np.max(np.abs(expected-observed)))
    assert expected.shape == observed.shape == (390,58)
    assert error < 1e-6, (head, error)
    report[head] = {'vectors': len(rows), 'dimension': 58, 'max_abs_error': error, 'pass': True}
(output/'numpy-parity.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report))
