import { common } from '@kit.AbilityKit';
import { relationalStore } from '@kit.ArkData';
import { util } from '@kit.ArkTS';

/**
 * 数学知识图谱的端侧 RDB。
 *
 * graph_seed_v1.json 是构建期种子数据，运行时只把 math_* 表导入华为
 * RelationalStore；行为情绪图谱留给独立的数据边界和初始化流程。
 */
export interface MathQuestionSummary {
  questionId: string;
  stem: string;
  answer: string;
  reviewStatus: string;
}

interface SeedOperation {
  sql: string;
  args: Array<string | number | null>;
}

interface SeedPayload {
  seedId: string;
  schema: string[];
  operations: SeedOperation[];
}

const DB_NAME: string = 'math_knowledge_graph.db';
const DB_VERSION: number = 1;
const SEED_FILE: string = 'graph_seed_v1.json';

const MATH_SCHEMA: string[] = [
  'CREATE TABLE IF NOT EXISTS graph_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS math_question (question_id TEXT PRIMARY KEY, stem TEXT NOT NULL, options_json TEXT NOT NULL, answer_reference TEXT NOT NULL, review_status TEXT NOT NULL, source_json TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS math_knowledge (knowledge_id TEXT PRIMARY KEY, label TEXT NOT NULL, origin TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS math_question_knowledge (question_id TEXT NOT NULL REFERENCES math_question(question_id), knowledge_id TEXT NOT NULL REFERENCES math_knowledge(knowledge_id), relation TEXT NOT NULL, review_status TEXT NOT NULL, source_json TEXT NOT NULL, PRIMARY KEY(question_id, knowledge_id))',
  'CREATE TABLE IF NOT EXISTS math_knowledge_claim (claim_id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES math_question(question_id), expert TEXT NOT NULL, role TEXT NOT NULL, statement TEXT NOT NULL, review_status TEXT NOT NULL, source_json TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS math_solution (solution_id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES math_question(question_id), expert TEXT NOT NULL, steps_text TEXT NOT NULL, critical_step TEXT NOT NULL, review_status TEXT NOT NULL, source_json TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS math_error_path (error_id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES math_question(question_id), expert TEXT NOT NULL, option_label TEXT NOT NULL, analysis_json TEXT NOT NULL, review_status TEXT NOT NULL, source_json TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS math_hint (hint_id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES math_question(question_id), level INTEGER NOT NULL CHECK(level IN (1, 2)), text TEXT NOT NULL, review_status TEXT NOT NULL, UNIQUE(question_id, level))',
  'CREATE TABLE IF NOT EXISTS math_knowledge_relation (relation_id TEXT PRIMARY KEY, from_id TEXT NOT NULL REFERENCES math_knowledge(knowledge_id), to_id TEXT NOT NULL REFERENCES math_knowledge(knowledge_id), relation TEXT NOT NULL CHECK(relation IN (\'prerequisite\', \'related\')), evidence TEXT NOT NULL, review_status TEXT NOT NULL, CHECK(from_id <> to_id))',
  'CREATE INDEX IF NOT EXISTS idx_math_claim_question ON math_knowledge_claim(question_id)',
  'CREATE INDEX IF NOT EXISTS idx_math_solution_question ON math_solution(question_id)',
  'CREATE INDEX IF NOT EXISTS idx_math_error_question ON math_error_path(question_id)'
];

export class MathKnowledgeRdb {
  private store: relationalStore.RdbStore | undefined;

  private constructor(store: relationalStore.RdbStore) {
    this.store = store;
  }

  /** @throws 数据库或资源读取失败，由页面显示不可用状态。 */
  public static async open(context: common.UIAbilityContext): Promise<MathKnowledgeRdb> {
    const config: relationalStore.StoreConfig = {
      name: DB_NAME,
      securityLevel: relationalStore.SecurityLevel.S3
    };
    const store: relationalStore.RdbStore = await relationalStore.getRdbStore(context, config);
    const database: MathKnowledgeRdb = new MathKnowledgeRdb(store);
    await database.prepare(context);
    return database;
  }

  /** @throws 数据库查询失败。 */
  public async listQuestions(limit: number = 100): Promise<MathQuestionSummary[]> {
    if (this.store === undefined) {
      return [];
    }
    const safeLimit: number = Math.max(1, Math.min(100, Math.floor(limit)));
    const result = await this.store.querySql(
      `SELECT question_id, stem, answer_reference, review_status FROM math_question ORDER BY question_id LIMIT ${safeLimit}`
    );
    const rows: MathQuestionSummary[] = [];
    try {
      while (result.goToNextRow()) {
        rows.push({
          questionId: result.getString(result.getColumnIndex('question_id')),
          stem: result.getString(result.getColumnIndex('stem')),
          answer: result.getString(result.getColumnIndex('answer_reference')),
          reviewStatus: result.getString(result.getColumnIndex('review_status'))
        });
      }
    } finally {
      result.close();
    }
    return rows;
  }

  /** @throws 数据库查询失败。 */
  public async knowledgeContext(questionId: string): Promise<string> {
    if (!this.store) { return ''; }
    const result = await this.store.querySql(`SELECT k.label, q.review_status FROM math_question_knowledge q
      JOIN math_knowledge k ON k.knowledge_id=q.knowledge_id WHERE q.question_id=? ORDER BY k.knowledge_id`, [questionId]);
    const labels: string[] = [];
    try { while (result.goToNextRow()) { labels.push(`${result.getString(0)}（${result.getString(1)}）`); } }
    finally { result.close(); }
    return labels.join('、');
  }

  /** @throws 数据库查询失败。 */
  public async count(table: string): Promise<number> {
    if (this.store === undefined || !/^math_[a-z_]+$/.test(table)) {
      return 0;
    }
    const result = await this.store.querySql(`SELECT COUNT(*) AS total FROM ${table}`);
    try {
      return result.goToFirstRow() ? result.getLong(result.getColumnIndex('total')) : 0;
    } finally {
      result.close();
    }
  }

  /** @throws 建表或初始化失败，向调用方传播。 */
  private async prepare(context: common.UIAbilityContext): Promise<void> {
    if (this.store === undefined) {
      return;
    }
    for (const sql of MATH_SCHEMA) {
      await this.store.executeSql(sql);
    }
    const version: number = this.store.version;
    if (version < DB_VERSION) {
      this.store.version = DB_VERSION;
    }
    const meta = await this.store.querySql("SELECT value FROM graph_meta WHERE key = 'math_seed_id'");
    let initialized: boolean = false;
    try {
      initialized = meta.goToFirstRow();
    } finally {
      meta.close();
    }
    if (!initialized) {
      await this.importMathSeed(context);
    }
  }

  /** @throws 导入失败并回滚，不设置成功标记。 */
  private async importMathSeed(context: common.UIAbilityContext): Promise<void> {
    if (this.store === undefined) {
      return;
    }
    const raw: Uint8Array = await context.resourceManager.getRawFileContent(SEED_FILE);
    const decoder = util.TextDecoder.create('utf-8', { ignoreBOM: true });
    const seedText: string = decoder.decodeToString(raw, { stream: false });
    const seed: SeedPayload = JSON.parse(seedText) as SeedPayload;
    const mathOperations: SeedOperation[] = seed.operations.filter((operation: SeedOperation) =>
      operation.sql.indexOf('INSERT INTO math_') === 0);
    this.store.beginTransaction();
    try {
      for (const operation of mathOperations) {
        await this.store.executeSql(operation.sql, operation.args);
      }
      await this.store.executeSql(
        `INSERT INTO graph_meta(key, value) VALUES ('math_seed_id', ${this.literal(seed.seedId)})`
      );
      await this.store.executeSql(
        `INSERT INTO graph_meta(key, value) VALUES ('math_question_count', ${this.literal('48')})`
      );
      this.store.commit();
    } catch (error) {
      this.store.rollBack();
      throw new Error(String(error));
    }
  }

  private literal(value: string | number | null): string {
    if (value === null) {
      return 'NULL';
    }
    if (typeof value === 'number') {
      return `${value}`;
    }
    return `'${value.replace(/'/g, "''")}'`;
  }
}
