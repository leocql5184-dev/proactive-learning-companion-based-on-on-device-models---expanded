import { EventCollector } from './EventCollector';

export interface LearningStore {
  read(): string;
  write(value: string): void;
}

// Persist first, then expose the new state. A failed write rolls back the whole action.
export class LearningRepository {
  collector: EventCollector = new EventCollector();
  writable: boolean = false;
  private store: LearningStore;
  constructor(store: LearningStore) { this.store = store; }

  load(): void {
    this.writable = false;
    const text = this.store.read();
    if (text && !this.collector.restore(text)) { throw new Error('学习记录损坏，请清除后重新开始'); }
    this.writable = true;
  }

  change(action: (collector: EventCollector) => void): void {
    if (!this.writable) { throw new Error('学习存储尚未就绪，请重试或清除记录'); }
    const before = this.collector.serialize();
    try {
      action(this.collector);
      this.store.write(this.collector.serialize());
    } catch (error) {
      this.collector.restore(before);
      throw new Error((error as Error).message || '学习记录保存失败');
    }
  }

  clear(): void {
    const fresh = new EventCollector();
    // Keep only the identifier counter so late UI callbacks cannot match a newly created request after deletion.
    fresh.state.sequence = this.collector.state.sequence;
    this.store.write(fresh.serialize());
    this.collector = fresh; this.writable = true;
  }
}
