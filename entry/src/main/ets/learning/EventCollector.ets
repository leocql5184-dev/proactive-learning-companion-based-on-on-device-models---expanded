import { EventKind, LearningEvent, LearningSession, LearningState, taskById, gradeAnswer } from './LearningTypes';

const EVENT_KINDS: string[] = ['task_started', 'answer_submitted', 'help_requested', 'hint_shown',
  'task_split_requested', 'split_shown', 'break_requested', 'task_paused', 'task_resumed', 'task_finished',
  'proactive_offered', 'proactive_responded'];

function validId(id: string, prefix: string, maximum: number): boolean {
  if (typeof id !== 'string' || !id.startsWith(`${prefix}-`)) { return false; }
  const n = Number(id.slice(prefix.length + 1));
  return Number.isSafeInteger(n) && n > 0 && n <= maximum && id === `${prefix}-${n}`;
}

export class EventCollector {
  state: LearningState = new LearningState();

  active(): LearningSession | undefined {
    return this.state.sessions.find((s: LearningSession) => s.sessionId === this.state.activeSessionId);
  }

  private id(prefix: string): string {
    this.state.sequence += 1;
    return `${prefix}-${this.state.sequence}`;
  }

  private checkTime(session: LearningSession, time: number): void {
    if (!Number.isSafeInteger(time) || time < session.updatedAt) {
      throw new Error('设备时间发生变化，请校准时间后再继续');
    }
  }

  private record(s: LearningSession, kind: EventKind, time: number, correct: boolean | null = null,
    depth: number | null = null, requestId: string = '', load: boolean | null = null): void {
    this.checkTime(s, time);
    s.updatedAt = time;
    if (kind !== 'proactive_offered') { s.lastActivityAt = time; }
    if (!this.state.collectionEnabled) { s.coverageComplete = false; return; }
    // Stop collecting instead of silently evicting evidence that affects cumulative features.
    if (s.events.length >= 2000) { s.coverageComplete = false; return; }
    const e = new LearningEvent();
    e.eventId = this.id('event'); e.sessionId = s.sessionId; e.taskId = s.taskId;
    e.sequence = s.events.length + 1; e.timestamp = time; e.offsetMs = time - s.startedAt;
    e.kind = kind; e.correct = correct; e.hintDepth = depth; e.requestId = requestId; e.loadHigh = load;
    e.source = kind === 'break_requested' ? 'user_self_report' : 'app_observation';
    s.events.push(e);
  }

  setCollection(enabled: boolean): void {
    if (this.state.collectionEnabled === enabled) { return; }
    this.state.collectionEnabled = enabled;
    const session = this.active();
    if (session && session.status !== 'finished') {
      // Re-enabling cannot reconstruct events that were not observed.
      session.coverageComplete = false;
    }
  }

  setProactive(enabled: boolean): void {
    this.state.proactiveEnabled = enabled;
    const s = this.active();
    if (!enabled && s) { s.offerResponse = 'disabled'; }
  }

  start(taskId: string, time: number): void {
    if (!taskById(taskId) || !Number.isSafeInteger(time) || time < 0) { throw new Error('无效任务或时间'); }
    if (this.active() && this.active()!.status !== 'finished') { throw new Error('请先结束当前任务'); }
    if (this.state.sessions.length >= 30) { throw new Error('已保留 30 次任务，请先清除学习记录'); }
    const s = new LearningSession();
    s.sessionId = this.id('session'); s.taskId = taskId; s.startedAt = time; s.updatedAt = time;
    s.lastActivityAt = time;
    s.coverageComplete = this.state.collectionEnabled;
    this.state.sessions.push(s); this.state.activeSessionId = s.sessionId;
    this.record(s, 'task_started', time);
  }

  private running(): LearningSession {
    const s = this.active();
    if (!s || s.status !== 'active') { throw new Error('请先开始或继续任务'); }
    return s;
  }

  updateDraft(text: string): void {
    const s = this.running(); s.draft = text.slice(0, 500);
    s.lastActivityAt = Date.now();
  }

  offer(kind: string, reason: string, time: number): void {
    const s = this.running(); this.checkTime(s, time);
    if (!this.state.proactiveEnabled || !['help', 'rest'].includes(kind) ||
      !['long_pause', 'self_report_tired', 'self_report_frustrated'].includes(reason) ||
      (kind === 'help' && (reason !== 'long_pause' || !this.state.collectionEnabled || !s.coverageComplete)) ||
      (kind === 'rest' && reason === 'long_pause') ||
      (s.offerId && !s.offerResponse) || time < s.suppressUntil || s.pendingRequestId) { return; }
    s.offerId = this.id('offer'); s.offerKind = kind; s.offerReason = reason;
    s.offerResponse = ''; s.offerAt = time;
    this.record(s, 'proactive_offered', time, null, null, s.offerId);
    if (this.state.collectionEnabled && s.events.length) {
      s.events[s.events.length - 1].reasonCode = reason;
      if (kind === 'rest') { s.events[s.events.length - 1].source = 'user_self_report'; }
    }
  }

  respondOffer(response: string, time: number): void {
    const s = this.running(); this.checkTime(s, time);
    if (!s.offerId || s.offerResponse || !['accepted', 'later', 'rejected'].includes(response)) { return; }
    s.offerResponse = response;
    s.suppressUntil = time + (response === 'rejected' ? 600000 : 300000);
    this.record(s, 'proactive_responded', time, null, null, s.offerId);
    if (this.state.collectionEnabled && s.events.length) {
      s.events[s.events.length - 1].response = response;
      s.events[s.events.length - 1].source = 'user_self_report';
    }
  }

  submit(time: number): void {
    const s = this.running(); this.checkTime(s, time);
    if (!s.draft.trim()) { throw new Error('请先填写答案'); }
    const result = gradeAnswer(s.taskId, s.draft);
    this.record(s, 'answer_submitted', time, result);
    s.lastResult = result === null ? '已记录作答，未自动判分' : result ? '本次选择正确' : '本次选择不正确，可以继续尝试';
  }

  request(kind: string, time: number, depth: number = 1): void {
    const s = this.running(); this.checkTime(s, time);
    if (!['hint', 'split', 'break'].includes(kind) || (kind === 'hint' && depth !== 1 && depth !== 2)) {
      throw new Error('无效请求');
    }
    if (s.pendingRequestId && (kind !== 'break' || s.pendingKind === 'break')) { return; }
    // An explicit rest request supersedes an unseen hint; its stale display callback cannot consume the new request.
    s.pendingRequestId = this.id('request'); s.pendingKind = kind;
    s.pendingDepth = kind === 'hint' ? depth : null;
    s.cardKind = ''; s.cardRequestId = '';
    const eventKind: EventKind = kind === 'hint' ? 'help_requested' : kind === 'split' ? 'task_split_requested' : 'break_requested';
    this.record(s, eventKind, time, null, s.pendingDepth, s.pendingRequestId, kind === 'break' ? true : null);
  }

  // Called on actual card appearance, not when the help button is pressed.
  acknowledge(requestId: string, time: number): void {
    const s = this.active();
    if (!s || !requestId || requestId !== s.pendingRequestId || s.status !== 'active') { return; }
    this.checkTime(s, time);
    const kind = s.pendingKind;
    this.record(s, kind === 'hint' ? 'hint_shown' : kind === 'split' ? 'split_shown' : 'task_paused',
      time, null, s.pendingDepth, requestId);
    s.cardKind = kind; s.cardDepth = s.pendingDepth || 1; s.cardRequestId = requestId;
    if (kind === 'break') { s.status = 'paused'; }
    s.pendingKind = ''; s.pendingRequestId = ''; s.pendingDepth = null;
  }

  pause(time: number): void {
    const s = this.active(); if (!s || s.status !== 'active') { return; }
    this.record(s, 'task_paused', time, null, null, s.pendingRequestId);
    s.status = 'paused'; s.pendingKind = ''; s.pendingRequestId = ''; s.pendingDepth = null;
  }

  resume(time: number): void {
    const s = this.active(); if (!s || s.status !== 'paused') { return; }
    this.record(s, 'task_resumed', time);
    s.status = 'active'; s.cardKind = ''; s.cardRequestId = '';
  }

  finish(time: number): void {
    const s = this.active(); if (!s || s.status === 'finished') { return; }
    this.record(s, 'task_finished', time);
    s.status = 'finished'; s.pendingRequestId = ''; s.pendingKind = ''; s.pendingDepth = null;
  }

  clear(): void {
    const sequence = this.state.sequence;
    this.state = new LearningState(); this.state.sequence = sequence;
  }
  serialize(): string { return JSON.stringify(this.state); }

  restore(raw: string): boolean {
    try {
      const value = JSON.parse(raw) as LearningState;
      if (!value || value.version !== 1 || typeof value.collectionEnabled !== 'boolean' ||
        !Number.isSafeInteger(value.sequence) || value.sequence < 0 || typeof value.activeSessionId !== 'string' ||
        !Array.isArray(value.sessions) || value.sessions.length > 30) { return false; }
      if (value.proactiveEnabled === undefined) { value.proactiveEnabled = false; }
      if (typeof value.proactiveEnabled !== 'boolean') { return false; }
      const ids: string[] = [];
      for (const s of value.sessions) {
        if (!s) { return false; }
        if (s.lastActivityAt === undefined) { s.lastActivityAt = s.updatedAt; }
        if (s.offerId === undefined) { s.offerId = ''; s.offerKind = ''; s.offerReason = ''; s.offerResponse = ''; s.offerAt = 0; s.suppressUntil = 0; }
        if (!s || !validId(s.sessionId, 'session', value.sequence) || ids.includes(s.sessionId) || !taskById(s.taskId) ||
          !Number.isSafeInteger(s.startedAt) || s.startedAt < 0 || !Number.isSafeInteger(s.updatedAt) || s.updatedAt < s.startedAt ||
          !['active', 'paused', 'finished'].includes(s.status) || typeof s.coverageComplete !== 'boolean' ||
          typeof s.draft !== 'string' || s.draft.length > 500 || typeof s.lastResult !== 'string' ||
          typeof s.pendingRequestId !== 'string' || !['', 'hint', 'split', 'break'].includes(s.pendingKind) ||
          !['', 'hint', 'split', 'break'].includes(s.cardKind) || typeof s.cardRequestId !== 'string' ||
          (s.cardDepth !== 1 && s.cardDepth !== 2) ||
          (s.pendingDepth !== null && s.pendingDepth !== 1 && s.pendingDepth !== 2) ||
          !Array.isArray(s.events) || s.events.length > 2000 ||
          !Number.isSafeInteger(s.lastActivityAt) || s.lastActivityAt < s.startedAt ||
          typeof s.offerId !== 'string' || typeof s.offerKind !== 'string' || typeof s.offerReason !== 'string' ||
          typeof s.offerResponse !== 'string' || !Number.isSafeInteger(s.offerAt) ||
          !Number.isSafeInteger(s.suppressUntil)) { return false; }
        if (s.offerId && !validId(s.offerId, 'offer', value.sequence)) { return false; }
        ids.push(s.sessionId);
        if ((s.pendingRequestId && !validId(s.pendingRequestId, 'request', value.sequence)) ||
          (s.cardRequestId && !validId(s.cardRequestId, 'request', value.sequence)) ||
          Boolean(s.pendingRequestId) !== Boolean(s.pendingKind) ||
          (s.pendingRequestId && s.status !== 'active') ||
          (s.pendingKind === 'hint' && s.pendingDepth === null) ||
          (s.pendingKind !== 'hint' && s.pendingDepth !== null)) { return false; }
        let previous = s.startedAt;
        for (let i = 0; i < s.events.length; i++) {
          const e = s.events[i];
          if (!e || !validId(e.eventId, 'event', value.sequence) || ids.includes(e.eventId) ||
            e.sessionId !== s.sessionId || e.taskId !== s.taskId || e.sequence !== i + 1 ||
            !EVENT_KINDS.includes(e.kind) || !Number.isSafeInteger(e.timestamp) || e.timestamp < previous ||
            e.timestamp > s.updatedAt || e.offsetMs !== e.timestamp - s.startedAt ||
            (e.correct !== null && typeof e.correct !== 'boolean') ||
            (e.hintDepth !== null && e.hintDepth !== 1 && e.hintDepth !== 2) ||
            (e.loadHigh !== null && typeof e.loadHigh !== 'boolean') || typeof e.requestId !== 'string' ||
            !['app_observation', 'user_self_report'].includes(e.source)) { return false; }
          if (e.requestId && !validId(e.requestId,
            ['proactive_offered', 'proactive_responded'].includes(e.kind) ? 'offer' : 'request', value.sequence)) { return false; }
          previous = e.timestamp; ids.push(e.eventId);
        }
        if (s.coverageComplete && (s.events.length === 0 || s.events[0].kind !== 'task_started')) { return false; }
      }
      if (value.activeSessionId && !value.sessions.some((s: LearningSession) => s.sessionId === value.activeSessionId)) { return false; }
      if (value.sessions.some((s: LearningSession) => s.status !== 'finished' && s.sessionId !== value.activeSessionId)) { return false; }
      this.state = value; return true;
    } catch (_) { return false; }
  }
}
