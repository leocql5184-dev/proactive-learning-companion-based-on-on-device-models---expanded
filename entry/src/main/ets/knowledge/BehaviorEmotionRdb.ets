import { common } from '@kit.AbilityKit';
import { relationalStore } from '@kit.ArkData';
import { util } from '@kit.ArkTS';

interface SeedOperation { sql: string; args: relationalStore.ValueType[]; }
interface SeedCount { table: string; count: number; }
interface BehaviorSeed {
  schemaVersion: number;
  seedId: string;
  source: string;
  sourceHash: string;
  schema: string[];
  operations: SeedOperation[];
  counts: SeedCount[];
}

export class BehaviorGraphStats {
  patterns: number = 0;
  examples: number = 0;
  hypotheses: number = 0;
  emotions: number = 0;
  relations: number = 0;
}

export class EmotionReference {
  emotionCode: string = '';
  emotionName: string = '';
  strength: string = '';
  origin: string = '';
  reviewStatus: string = '';
  exampleId: number = 0;
  sourceId: string = '';
  sequence: string = '';
  evidence: string = '';
}

/** Read-only reference repository after initialization; contains no personal session data. */
export class BehaviorEmotionRdb {
  private static opening: Promise<BehaviorEmotionRdb> | undefined = undefined;
  private store: relationalStore.RdbStore;
  private constructor(store: relationalStore.RdbStore) { this.store = store; }

  /** @throws Database/resource failure; callers must display unavailable, not fake success. */
  static async open(context: common.UIAbilityContext): Promise<BehaviorEmotionRdb> {
    if (!BehaviorEmotionRdb.opening) {
      BehaviorEmotionRdb.opening = BehaviorEmotionRdb.initialize(context);
    }
    try {
      return await BehaviorEmotionRdb.opening;
    } catch (error) {
      BehaviorEmotionRdb.opening = undefined;
      throw new Error(`行为图谱打开失败：${(error as Error).message}`);
    }
  }

  /** @throws RDB failure. All writes are serialized before publishing the singleton. */
  private static async initialize(context: common.UIAbilityContext): Promise<BehaviorEmotionRdb> {
    const raw = await context.resourceManager.getRawFileContent('behavior_graph_v1.json');
    const seed = JSON.parse(util.TextDecoder.create('utf-8').decodeToString(raw)) as BehaviorSeed;
    if (seed.schemaVersion !== 1 || seed.seedId !== 'behavior-emotion-v1' ||
      seed.counts.length !== 3 || seed.operations.length !== 1248) {
      throw new Error('行为图谱资源版本或条数不匹配');
    }
    const store = await relationalStore.getRdbStore(context, {
      name: 'behavior_emotion_graph.db', securityLevel: relationalStore.SecurityLevel.S3
    });
    const graph = new BehaviorEmotionRdb(store);
    try {
      await store.executeSql('PRAGMA foreign_keys = ON');
      await store.executeSql('CREATE TABLE IF NOT EXISTS graph_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      const meta = await store.querySql("SELECT value FROM graph_meta WHERE key='seed_hash'");
      let oldHash = '';
      try { if (meta.goToFirstRow()) { oldHash = meta.getString(0); } } finally { meta.close(); }
      if (oldHash && oldHash !== seed.sourceHash) {
        throw new Error('行为图谱资源已变更，需要显式迁移');
      }
      if (!oldHash) {
        store.beginTransaction();
        try {
          for (const sql of seed.schema) { await store.executeSql(sql); }
          for (const op of seed.operations) { await store.executeSql(op.sql, op.args); }
          await graph.verify(seed);
          await store.executeSql('INSERT INTO graph_meta VALUES (?, ?)', ['seed_hash', seed.sourceHash]);
          await store.executeSql('INSERT INTO graph_meta VALUES (?, ?)', ['seed_id', seed.seedId]);
          await store.executeSql('INSERT INTO graph_meta VALUES (?, ?)', ['source', seed.source]);
          store.commit();
        } catch (error) {
          store.rollBack();
          throw new Error(`行为图谱导入失败：${(error as Error).message}`);
        }
      } else {
        await graph.verify(seed);
      }
      store.version = seed.schemaVersion;
      return graph;
    } catch (error) {
      await store.close();
      throw new Error((error as Error).message);
    }
  }

  /** @throws Database query failure. */
  private async scalar(sql: string): Promise<number> {
    const rows = await this.store.querySql(sql);
    try { return rows.goToFirstRow() ? rows.getLong(0) : 0; } finally { rows.close(); }
  }

  /** @throws Partial or invalid seed, including orphaned references. */
  private async verify(seed: BehaviorSeed): Promise<void> {
    const tables: string[] = ['behavior_pattern', 'behavior_example', 'example_emotion_hypothesis'];
    for (let i = 0; i < tables.length; i++) {
      const expected = seed.counts[i];
      if (expected.table !== tables[i] || await this.scalar(`SELECT COUNT(*) FROM ${tables[i]}`) !== expected.count) {
        throw new Error('行为图谱表计数校验失败');
      }
    }
    const fk = await this.store.querySql('PRAGMA foreign_key_check');
    try { if (fk.goToFirstRow()) { throw new Error('行为图谱关联不完整'); } } finally { fk.close(); }
    if (await this.scalar('SELECT COUNT(*) FROM behavior_example WHERE target_question_id IS NOT NULL') !== 0 ||
      await this.scalar("SELECT COUNT(*) FROM example_emotion_hypothesis WHERE review_status <> 'UNVERIFIED'") !== 0) {
      throw new Error('历史样本来源或复核状态不匹配');
    }
  }

  /** @throws Database query failure. */
  async stats(): Promise<BehaviorGraphStats> {
    const result = new BehaviorGraphStats();
    result.patterns = await this.scalar('SELECT COUNT(*) FROM behavior_pattern');
    result.examples = await this.scalar('SELECT COUNT(*) FROM behavior_example');
    result.hypotheses = await this.scalar('SELECT COUNT(*) FROM example_emotion_hypothesis');
    result.emotions = await this.scalar('SELECT COUNT(*) FROM emotion_node');
    result.relations = await this.scalar('SELECT COUNT(*) FROM behavior_emotion_relation');
    return result;
  }

  /** @throws Database query failure. Historical references, never a probability for the current learner. */
  async references(pattern: string): Promise<EmotionReference[]> {
    // One reproducible example per candidate/source/strength; keep its full provenance.
    const rows = await this.store.querySql(`SELECT h.emotion_code, h.emotion_zh, h.strength,
      h.origin, h.review_status, b.example_id, b.source_problem_log_id, b.action_sequence, h.evidence
      FROM example_emotion_hypothesis h JOIN behavior_example b ON b.example_id=h.example_id
      WHERE h.hypothesis_id IN (SELECT MIN(h2.hypothesis_id) FROM example_emotion_hypothesis h2
        JOIN behavior_example b2 ON b2.example_id=h2.example_id
        WHERE b2.pattern_code=? AND h2.origin='behavior_inference'
        GROUP BY h2.emotion_code, h2.strength, h2.origin, h2.review_status)
      ORDER BY h.emotion_code, h.strength`, [pattern]);
    const result: EmotionReference[] = [];
    try {
      while (rows.goToNextRow()) {
        const r = new EmotionReference();
        r.emotionCode = rows.getString(0); r.emotionName = rows.getString(1);
        r.strength = rows.getString(2); r.origin = rows.getString(3); r.reviewStatus = rows.getString(4);
        r.exampleId = rows.getLong(5); r.sourceId = rows.getString(6);
        r.sequence = rows.getString(7); r.evidence = rows.getString(8);
        result.push(r);
      }
    } finally { rows.close(); }
    return result;
  }
}
