import { common } from '@kit.AbilityKit';
import { util } from '@kit.ArkTS';
import { LearningState, LearningSession, taskById } from '../learning/LearningTypes';
import { MathKnowledgeRdb } from '../knowledge/MathKnowledgeRdb';
import { ProfileRdb, ProfileCommand } from './ProfileRdb';
import { ProfileInput, ProfileState, ProfilePolicy, ProfileObservation, reportLabel, FEEDBACK_VALUES } from './ProfileTypes';

/** App Agent: loads a bundled Skill and dispatches its registered offline workflow. No cloud or LLM calls. */
export class ProfileAgent {
  state: ProfileState = new ProfileState();
  private db: ProfileRdb;
  private generation: number = 0;
  private constructor(db: ProfileRdb) { this.db = db; }

  /** @throws Missing/invalid bundled Skill or local database failure. */
  static async open(context: common.UIAbilityContext): Promise<ProfileAgent> {
    const bytes = await context.resourceManager.getRawFileContent('profile_skill_v2.json');
    const policy = JSON.parse(util.TextDecoder.create('utf-8').decodeToString(bytes)) as ProfilePolicy;
    const instructions = util.TextDecoder.create('utf-8').decodeToString(
      await context.resourceManager.getRawFileContent('dynamic_growth_profile_skill.md'));
    if (!instructions.includes('name: dynamic-growth-profile') || policy.id !== 'dynamic-growth-profile' ||
      policy.version !== 2 || policy.mode !== 'local_workflow' || JSON.stringify(policy.steps) !==
      JSON.stringify(['authorize', 'read_evidence', 'read_graphs', 'derive_three_dimensions', 'validate', 'commit']) ||
      !Number.isSafeInteger(policy.currentTtlMs) || policy.currentTtlMs <= 0 || policy.currentTtlMs > 86400000 ||
      !Number.isSafeInteger(policy.windowMs) || policy.windowMs < policy.currentTtlMs || policy.windowMs > 31536000000 ||
      !Number.isSafeInteger(policy.preferenceSessions) || policy.preferenceSessions < 2 ||
      !Number.isSafeInteger(policy.preferenceDays) || policy.preferenceDays < 2) {
      throw new Error('画像 Skill 资源不匹配');
    }
    const agent = new ProfileAgent(await ProfileRdb.open(context, policy));
    await agent.command('refresh'); return agent;
  }

  /** @throws Command failure, propagated to the page. */
  private async command(action: string, inputs: ProfileInput[] = [], observationId: string = '',
    now: number = Date.now()): Promise<ProfileState> {
    const command = new ProfileCommand(); command.action = action; command.epoch = this.state.epoch;
    command.inputs = inputs; command.observationId = observationId; command.now = now;
    const state = await this.db.execute(command);
    if (state.version >= this.state.version) { this.state = state; }
    return this.state;
  }

  /** @throws RDB failure. */
  async refresh(): Promise<ProfileState> { return this.command('refresh'); }
  /** @throws RDB failure. */
  async enable(enabled: boolean): Promise<ProfileState> { this.generation++; return this.command(enabled ? 'enable' : 'disable'); }
  /** @throws RDB failure or stale observation. */
  async correct(id: string): Promise<ProfileState> { this.generation++; return this.command('correct', [], id); }
  /** @throws RDB failure. */
  async beginClear(): Promise<ProfileState> { this.generation++; return this.command('begin_clear'); }
  /** @throws RDB failure. */
  async finishClear(): Promise<ProfileState> { return this.command('end_clear'); }

  /** @throws Graph or RDB failure; the caller can retry without duplicating evidence. */
  async sync(learning: LearningState, math: MathKnowledgeRdb | undefined): Promise<ProfileState> {
    // A newer learning snapshot (including revoked collection) supersedes in-flight graph reads.
    const generation = ++this.generation;
    const state = JSON.parse(JSON.stringify(learning)) as LearningState;
    if (!this.state.enabled) { return this.refresh(); }
    const now = Date.now(); const inputs: ProfileInput[] = [];
    for (const session of state.sessions) {
      // Task lifecycle expires explicitly authorized self-reports even when optional behavior collection is off.
      inputs.push(this.lifecycle(session));
      if (!state.collectionEnabled || !session.coverageComplete) { continue; }
      const context = math ? await math.knowledgeContext(session.taskId) : '';
      for (const event of session.events) {
        if (event.timestamp > now) { continue; }
        const input = new ProfileInput(); input.id = event.eventId; input.sessionId = session.sessionId;
        input.taskId = session.taskId; input.timestamp = event.timestamp; input.kind = event.kind;
        input.requestId = event.requestId;
        input.value = event.kind === 'answer_submitted' ? event.correct === null ? 'unknown' : event.correct ? 'correct' : 'wrong' :
          event.kind === 'break_requested' && event.source === 'user_self_report' && event.loadHigh === true ? 'tired' : '';
        // Context is graph-derived and immutable for a published seed; require graph readiness before importing answers.
        if (event.kind === 'answer_submitted' && !math) { continue; }
        input.context = event.kind === 'answer_submitted' ? context : '';
        inputs.push(input);
      }
    }
    if (generation !== this.generation) { return this.state; }
    return this.command('ingest', inputs, '', now);
  }

  private sessionInput(session: LearningSession | undefined): ProfileInput {
    if (!this.state.enabled || !session || !taskById(session.taskId) || session.status === 'finished') {
      throw new Error('请开启画像并开始一个任务');
    }
    const input = new ProfileInput(); input.sessionId = session.sessionId; input.taskId = session.taskId;
    input.timestamp = Date.now(); return input;
  }

  private lifecycle(session: LearningSession): ProfileInput {
    const input = new ProfileInput(); input.sessionId = session.sessionId; input.taskId = session.taskId;
    input.timestamp = session.updatedAt; input.kind = 'session_state'; input.value = session.status;
    input.id = `lifecycle:${session.sessionId}:${session.updatedAt}:${session.status}`; return input;
  }

  /** @throws Invalid report, missing authorization or RDB failure. */
  async report(session: LearningSession | undefined, facet: string, value: string): Promise<ProfileState> {
    if (!reportLabel(facet, value)) { throw new Error('无效自报选项'); }
    const input = this.sessionInput(session); input.kind = `report:${facet}`; input.value = value;
    input.id = `self:${this.state.epoch}:${input.sessionId}:${facet}:${input.timestamp}`;
    return this.command('ingest', [this.lifecycle(session!), input]);
  }

  /** @throws Stale request, missing authorization or RDB failure. */
  async feedback(session: LearningSession | undefined, requestId: string, action: string, value: string): Promise<ProfileState> {
    if (!this.state.enabled || !session || !requestId || requestId !== session.cardRequestId || action !== session.cardKind ||
      !['hint', 'split', 'break'].includes(action) || !FEEDBACK_VALUES.includes(value)) { throw new Error('该引导已变化，请重新选择'); }
    const input = new ProfileInput(); input.sessionId = session.sessionId; input.taskId = session.taskId;
    input.timestamp = Date.now(); input.kind = `feedback:${action}`; input.value = value; input.requestId = requestId;
    const channel = ['accepted', 'rejected', 'later'].includes(value) ? 'acceptance' : 'effect';
    input.id = `feedback:${session.sessionId}:${requestId}:${channel}:${input.timestamp}`;
    return this.command('ingest', [input]);
  }

  guidance(): string {
    if (!this.state.enabled) { return ''; }
    const preference = this.state.observations.find((o: ProfileObservation) => o.facet === 'guidance_preference' && o.status === 'SUPPORTED');
    return preference ? '根据近期分步偏好，本次提示建议先完成第一步，再继续。' : '';
  }
}
