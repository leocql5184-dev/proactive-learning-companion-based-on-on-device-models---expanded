import { FeatureSnapshot } from './LearningTypes';
import { ACTION_PREPROCESSING, STATE_PREPROCESSING, FEATURE_MIN, FEATURE_MAX } from './PreprocessingData';

export class ModelInputAdapter {
  static fromSnapshot(snapshot: FeatureSnapshot, head: string): number[] {
    if (!snapshot.ready || snapshot.schemaVersion !== 'decision-features-v1' || snapshot.mask.length !== 29 ||
      snapshot.mask.some((v: number, i: number) => v !== (snapshot.values[i] === null ? 0 : 1))) {
      throw new Error('行为快照不可用于推理');
    }
    return ModelInputAdapter.transform(snapshot.values, head);
  }

  static transform(values: (number | null)[], head: string): number[] {
    if (values.length !== 29 || !['action', 'state'].includes(head)) { throw new Error('模型输入格式错误'); }
    const p = head === 'action' ? ACTION_PREPROCESSING : STATE_PREPROCESSING;
    const result: number[] = []; const mask: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < FEATURE_MIN[i] ||
        (FEATURE_MAX[i] !== null && value > (FEATURE_MAX[i] as number)))) { throw new Error('模型特征超出有效范围'); }
      mask.push(value === null ? 0 : 1);
      let transformed = value === null ? p.medians[i] : value;
      if (value !== null && p.logIndices.includes(i)) { transformed = Math.log1p(value); }
      const z = Math.max(-p.clip, Math.min(p.clip, (transformed - p.means[i]) / p.stds[i]));
      result.push(Math.fround(z));
    }
    return result.concat(mask);
  }
}
