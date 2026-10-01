import { LearningSession, LearningEvent } from '../learning/LearningTypes';

export class BehaviorObservation {
  ruleVersion: string = 'app-behavior-v1';
  ready: boolean = false;
  pattern: string = '';
  fact: string = '还没有足够的行为记录';
  source: string = 'app_observation';
  state: string = 'UNKNOWN';
  action: string = 'stay_quiet';
  suggestion: string = '继续学习，暂不推测情绪';
  eventIds: string[] = [];
}

/** Engineering rules for this app, not learned thresholds or validated emotion classification. */
export class BehaviorInterpreter {
  static inspect(session: LearningSession | undefined, enabled: boolean, now: number): BehaviorObservation {
    const out = new BehaviorObservation();
    if (!enabled) { out.fact = '行为采集已关闭'; return out; }
    if (!session || !session.coverageComplete) {
      out.fact = '请在开启采集后开始新任务，确保记录完整'; return out;
    }
    if (!Number.isSafeInteger(now) || now < session.startedAt) { return out; }
    // Expire current-state claims; older records stay available only in the learning log.
    const events = session.events.filter((e: LearningEvent) => e.timestamp <= now);
    if (!events.length || now - events[events.length - 1].timestamp > 600000 || session.status === 'finished') {
      out.fact = '任务已结束或近期无新记录，暂不推测当前状态'; return out;
    }
    let start = 0;
    for (let i = 0; i < events.length; i++) {
      if (events[i].kind === 'task_resumed') { start = i; }
    }
    const segment = events.slice(start);
    const operations = segment.filter((e: LearningEvent) => ['answer_submitted', 'help_requested',
      'task_split_requested', 'break_requested'].includes(e.kind));
    if (!operations.length) { return out; }
    const last = operations[operations.length - 1];
    out.eventIds = operations.map((e: LearningEvent) => e.eventId);
    out.ready = true;
    if (last.kind === 'break_requested' && last.source === 'user_self_report' && last.loadHigh === true) {
      out.pattern = 'explicit_break'; out.source = 'user_self_report'; out.state = 'SELF_REPORTED_TIRED';
      out.fact = '你点击了“我有点累，想休息”'; out.action = 'suggest_break';
      out.suggestion = '按你的请求暂停，准备好后再继续'; out.eventIds = [last.eventId]; return out;
    }
    if (session.status !== 'active') {
      out.ready = false; out.fact = '任务已暂停，暂不推测当前状态'; out.eventIds = []; return out;
    }
    if (last.kind === 'task_split_requested') {
      out.pattern = 'explicit_split'; out.source = 'user_request'; out.fact = '你明确请求了分步骤引导';
      out.action = 'split_task'; out.suggestion = '先给出下一步，不把分步偏好当作认知负荷诊断';
      out.eventIds = [last.eventId]; return out;
    }
    const answers = operations.filter((e: LearningEvent) => e.kind === 'answer_submitted');
    const help = operations.filter((e: LearningEvent) => e.kind === 'help_requested');
    const wrong = answers.filter((e: LearningEvent) => e.correct === false).length;
    if (last.kind === 'help_requested') {
      out.source = 'user_request'; out.fact = '你明确请求了学习提示';
      out.action = 'hint'; out.suggestion = '提供所请求层级的提示';
      out.pattern = wrong > 0 ? 'help_after_error' : answers.length === 0 ? 'early_help' : '';
      return out;
    }
    // Unknown grading must not become failure or inferred success.
    if (answers.some((e: LearningEvent) => e.correct === null)) {
      out.fact = '已记录作答，存在未判分答案'; return out;
    }
    if (last.correct === true) {
      out.fact = '本次提交正确，是否理解仍需后续观察';
      if (wrong > 0) { out.pattern = help.length ? 'breakthrough_hint' : 'self_repair'; }
      return out;
    }
    if (wrong >= 3 && answers.every((e: LearningEvent) => e.correct === false)) {
      out.pattern = help.length >= 2 ? 'repeated_help' : help.length === 0 ? 'repeated_failed' : 'help_after_error';
      out.fact = `本段已观察到 ${wrong} 次错误提交，尚未出现正确提交`;
      out.action = 'offer_help'; out.suggestion = '可以先询问是否需要帮助，当前情绪仍未知';
      return out;
    }
    out.fact = '已记录本次尝试，尚不足以判断学习状态';
    return out;
  }
}
