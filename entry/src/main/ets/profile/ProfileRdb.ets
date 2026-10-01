import { common } from '@kit.AbilityKit';
import { relationalStore } from '@kit.ArkData';
import { ProfileInput, ProfileState, ProfileObservation, ProfilePolicy, reportLabel, FEEDBACK_VALUES } from './ProfileTypes';
import { ProfileEngine } from './ProfileEngine';

export class ProfileCommand {
  action: string = 'refresh';
  epoch: number = 0;
  now: number = 0;
  inputs: ProfileInput[] = [];
  observationId: string = '';
}

/** Single serialized writer. Each evidence/observation/version change is one native RDB transaction. */
export class ProfileRdb {
  private static opening: Promise<ProfileRdb> | undefined = undefined;
  private queue: Promise<void> = Promise.resolve();
  private store: relationalStore.RdbStore;
  private policy: ProfilePolicy;
  private constructor(store: relationalStore.RdbStore, policy: ProfilePolicy) { this.store = store; this.policy = policy; }

  /** @throws RDB initialization failure. */
  static async open(context: common.UIAbilityContext, policy: ProfilePolicy): Promise<ProfileRdb> {
    if (!ProfileRdb.opening) { ProfileRdb.opening = ProfileRdb.initialize(context, policy); }
    try { return await ProfileRdb.opening; } catch (error) {
      ProfileRdb.opening = undefined; throw new Error((error as Error).message);
    }
  }

  /** @throws RDB failure; initialization can be retried. */
  private static async initialize(context: common.UIAbilityContext, policy: ProfilePolicy): Promise<ProfileRdb> {
    const store = await relationalStore.getRdbStore(context, { name: 'growth_profile.db', securityLevel: relationalStore.SecurityLevel.S3 });
    try {
      if (store.version > 1) { throw new Error('画像数据库版本高于当前应用'); }
      await store.executeSql('CREATE TABLE IF NOT EXISTS profile_meta (id INTEGER PRIMARY KEY, revision INTEGER NOT NULL, enabled INTEGER NOT NULL, epoch INTEGER NOT NULL, clear_pending INTEGER NOT NULL)');
      await store.executeSql('INSERT OR IGNORE INTO profile_meta VALUES (1,0,0,0,0)');
      await store.executeSql('CREATE TABLE IF NOT EXISTS profile_evidence (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
      await store.executeSql('CREATE TABLE IF NOT EXISTS profile_observation (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
      await store.executeSql('CREATE TABLE IF NOT EXISTS intervention_feedback (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
      await store.executeSql('CREATE TABLE IF NOT EXISTS profile_correction (evidence_id TEXT PRIMARY KEY, observation_id TEXT NOT NULL, created_at INTEGER NOT NULL)');
      await store.executeSql('CREATE TABLE IF NOT EXISTS profile_snapshot (revision INTEGER PRIMARY KEY, created_at INTEGER NOT NULL, policy_version INTEGER NOT NULL, payload TEXT NOT NULL)');
      store.version = 1;
      return new ProfileRdb(store, policy);
    } catch (error) { await store.close(); throw new Error((error as Error).message); }
  }

  /** @throws Failure rolls back the entire command. Failed commands do not poison the queue. */
  execute(command: ProfileCommand): Promise<ProfileState> {
    // Snapshot caller data before entering the asynchronous queue.
    const copy = JSON.parse(JSON.stringify(command)) as ProfileCommand;
    const task = this.queue.then(async (): Promise<ProfileState> => {
      try { return await this.transaction(copy); }
      catch (error) { throw new Error((error as Error).message); }
    });
    this.queue = task.then(() => {}, () => {});
    return task;
  }

  /** @throws RDB query failure. */
  private async meta(): Promise<ProfileState> {
    const rows = await this.store.querySql('SELECT revision,enabled,epoch,clear_pending FROM profile_meta WHERE id=1');
    try {
      if (!rows.goToFirstRow()) { throw new Error('画像元数据缺失'); }
      const state = new ProfileState(); state.version = rows.getLong(0); state.enabled = rows.getLong(1) === 1;
      state.epoch = rows.getLong(2); state.clearPending = rows.getLong(3) === 1; return state;
    } finally { rows.close(); }
  }

  /** @throws RDB query failure. */
  private async payloads(table: string): Promise<string[]> {
    // Table names only come from fixed code, never from Skill output or user text.
    const rows = await this.store.querySql(`SELECT payload FROM ${table} ORDER BY id`);
    const values: string[] = [];
    try { while (rows.goToNextRow()) { values.push(rows.getString(0)); } } finally { rows.close(); }
    return values;
  }

  private validate(input: ProfileInput, now: number): void {
    if (!input.id || input.id.length > 180 || !/^session-\d+$/.test(input.sessionId) || !input.taskId ||
      !Number.isSafeInteger(input.timestamp) || input.timestamp < 0 || input.timestamp > now || input.context.length > 2000) {
      throw new Error('画像证据无效');
    }
    if (input.kind.startsWith('report:')) {
      if (!reportLabel(input.kind.slice(7), input.value)) { throw new Error('无效自报'); }
    } else if (input.kind.startsWith('feedback:')) {
      if (!['hint', 'split', 'break'].includes(input.kind.slice(9)) || !input.requestId || !FEEDBACK_VALUES.includes(input.value)) {
        throw new Error('无效反馈');
      }
    } else if (!['session_state', 'task_started', 'answer_submitted', 'help_requested', 'hint_shown', 'task_split_requested',
      'split_shown', 'break_requested', 'task_paused', 'task_resumed', 'task_finished'].includes(input.kind) ||
      (input.kind === 'answer_submitted' && !['correct', 'wrong', 'unknown'].includes(input.value))) {
      throw new Error('无效行为证据');
    }
  }

  /** @throws Atomic write failure, propagated to UI. */
  private async transaction(command: ProfileCommand): Promise<ProfileState> {
    if (!Number.isSafeInteger(command.now) || command.now < 0 || !['refresh', 'ingest', 'enable', 'disable',
      'correct', 'begin_clear', 'end_clear'].includes(command.action)) { throw new Error('无效画像操作'); }
    this.store.beginTransaction();
    try {
      const state = await this.meta(); let changed = false;
      if (command.action === 'begin_clear') {
        for (const table of ['profile_evidence', 'profile_observation', 'intervention_feedback', 'profile_correction', 'profile_snapshot']) {
          await this.store.executeSql(`DELETE FROM ${table}`);
        }
        state.enabled = false; state.clearPending = true; state.epoch++; changed = true;
      } else if (command.action === 'end_clear') {
        state.clearPending = false; changed = true;
      } else if (state.clearPending && command.action !== 'refresh') {
        throw new Error('个人数据清除待完成，请重试清除');
      } else if (command.action === 'enable' || command.action === 'disable') {
        state.enabled = command.action === 'enable'; state.epoch++; changed = true;
      } else if (command.action === 'correct') {
        const old = await this.store.querySql('SELECT payload FROM profile_observation WHERE id=?', [command.observationId]);
        let observation: ProfileObservation | undefined = undefined;
        try { if (old.goToFirstRow()) { observation = JSON.parse(old.getString(0)) as ProfileObservation; } } finally { old.close(); }
        if (!observation || !observation.evidenceIds.length) { throw new Error('该观察已变化，请刷新'); }
        for (const ref of observation.evidenceIds) {
          await this.store.executeSql('INSERT OR REPLACE INTO profile_correction VALUES (?,?,?)', [ref, observation.id, command.now]);
        }
        state.epoch++; changed = true;
      } else if (command.action === 'ingest') {
        if (!state.enabled || command.epoch !== state.epoch) { throw new Error('画像授权或数据版本已变化，请重试'); }
        if (command.inputs.length > 62000) { throw new Error('画像输入超出范围'); }
        for (const input of command.inputs) {
          this.validate(input, command.now);
          const payload = JSON.stringify(input);
          const existing = await this.store.querySql('SELECT payload FROM profile_evidence WHERE id=?', [input.id]);
          let previous = '';
          try { if (existing.goToFirstRow()) { previous = existing.getString(0); } } finally { existing.close(); }
          if (previous === payload) { continue; }
          if (previous) { throw new Error('同一证据 ID 的内容不一致'); }
          await this.store.executeSql('INSERT OR REPLACE INTO profile_evidence VALUES (?,?)', [input.id, payload]);
          if (input.kind.startsWith('feedback:')) {
            const channel = ['accepted', 'rejected', 'later'].includes(input.value) ? 'acceptance' : 'effect';
            await this.store.executeSql('INSERT OR REPLACE INTO intervention_feedback VALUES (?,?)',
              [`${input.sessionId}:${input.requestId}:${channel}`, payload]);
          }
          changed = true;
        }
      }
      const raw = await this.payloads('profile_evidence');
      const inputs = raw.map((s: string) => JSON.parse(s) as ProfileInput);
      const exclusions: string[] = [];
      const corrected = await this.store.querySql('SELECT evidence_id FROM profile_correction');
      try { while (corrected.goToNextRow()) { exclusions.push(corrected.getString(0)); } } finally { corrected.close(); }
      const observations = state.clearPending ? [] : ProfileEngine.build(inputs, exclusions, command.now, this.policy);
      const oldObservations = await this.payloads('profile_observation');
      observations.sort((a: ProfileObservation, b: ProfileObservation) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      if (JSON.stringify(oldObservations) !== JSON.stringify(observations.map((o: ProfileObservation) => JSON.stringify(o)))) { changed = true; }
      if (changed) {
        state.version++;
        await this.store.executeSql('DELETE FROM profile_observation');
        for (const observation of observations) {
          if (!observation.evidenceIds.every((id: string) => inputs.some((i: ProfileInput) => i.id === id))) {
            throw new Error('画像引用了不存在的证据');
          }
          await this.store.executeSql('INSERT INTO profile_observation VALUES (?,?)', [observation.id, JSON.stringify(observation)]);
        }
        if (!state.clearPending && command.action !== 'end_clear') {
          await this.store.executeSql('INSERT INTO profile_snapshot VALUES (?,?,?,?)',
            [state.version, command.now, this.policy.version, JSON.stringify(observations)]);
          // Retain a bounded local revision history; corrections never read from snapshots.
          await this.store.executeSql('DELETE FROM profile_snapshot WHERE revision < ?', [state.version - 30]);
        }
        await this.store.executeSql('UPDATE profile_meta SET revision=?,enabled=?,epoch=?,clear_pending=? WHERE id=1',
          [state.version, state.enabled ? 1 : 0, state.epoch, state.clearPending ? 1 : 0]);
      }
      state.observations = state.enabled ? observations : [];
      state.feedback = state.enabled ? (await this.payloads('intervention_feedback')).map((s: string) => JSON.parse(s) as ProfileInput)
        .filter((i: ProfileInput) => !exclusions.includes(i.id)) : [];
      this.store.commit(); return state;
    } catch (error) { this.store.rollBack(); throw new Error((error as Error).message); }
  }
}
