import { FeatureSnapshot, LearningSession, LearningEvent, taskById } from './LearningTypes';

export const FEATURE_ORDER: string[] = ['answer_count', 'incorrect_count', 'correct_count', 'hint_observed_count',
  'consecutive_incorrect', 'last_action_code', 'first_action_offset_ms', 'decision_offset_ms', 'observed_span_ms',
  'last_event_gap_ms', 'median_answer_gap_ms', 'since_last_hint_ms', 'incorrect_ratio', 'help_request_pending',
  'requested_hint_depth', 'explicit_break_requested', 'self_report_load_high', 'self_report_prerequisite_gap',
  'requested_prerequisite_review', 'requested_task_split', 'requested_branch_reduction', 'visible_method_count',
  'task_subpart_count', 'help_declined_recently', 'task_difficulty', 'task_progress', 'related_mastery',
  'prerequisite_mastery', 'active_time_ms'];

export class FeatureBuilder {
  static build(session: LearningSession, time: number, enabled: boolean): FeatureSnapshot {
    const result = new FeatureSnapshot();
    result.sessionId = session.sessionId; result.taskId = session.taskId; result.capturedAt = time;
    result.values = new Array<number | null>(29).fill(null); result.mask = new Array<number>(29).fill(0);
    if (!enabled || !session.coverageComplete || !Number.isSafeInteger(time) || time < session.startedAt) {
      result.reason = '采集未开启或本次记录不完整，请开启后开始新任务'; return result;
    }
    const events = session.events.filter((e: LearningEvent) => e.timestamp <= time);
    if (events.length === 0) { result.reason = '尚无事件'; return result; }
    result.eventIds = events.map((e: LearningEvent) => e.eventId);
    const operations = events.filter((e: LearningEvent) => ['answer_submitted', 'help_requested',
      'hint_shown', 'task_split_requested', 'break_requested'].includes(e.kind));
    const answers = operations.filter((e: LearningEvent) => e.kind === 'answer_submitted');
    const hints = operations.filter((e: LearningEvent) => e.kind === 'hint_shown');
    const f = result.values;
    f[0] = answers.length;
    const unknownGrade = answers.some((e: LearningEvent) => e.correct === null);
    f[1] = unknownGrade ? null : answers.filter((e: LearningEvent) => e.correct === false).length;
    f[2] = unknownGrade ? null : answers.filter((e: LearningEvent) => e.correct === true).length;
    f[3] = hints.length; f[4] = 0; f[5] = 0;
    for (let i = operations.length - 1; i >= 0; i--) {
      const e = operations[i];
      if (e.kind !== 'answer_submitted' || e.correct === true) { break; }
      if (e.correct === null) { f[4] = null; break; }
      f[4] = (f[4] as number) + 1;
    }
    if (operations.length > 0) {
      const last = operations[operations.length - 1];
      f[5] = last.kind === 'answer_submitted' ? (last.correct === null ? null : last.correct ? 2 : 1) :
        last.kind === 'hint_shown' ? 3 : last.kind === 'break_requested' ? 5 : 4;
      f[6] = operations[0].offsetMs; f[8] = time - operations[0].timestamp;
    }
    f[7] = time - session.startedAt;
    if (operations.length >= 2) { f[9] = operations[operations.length - 1].timestamp - operations[operations.length - 2].timestamp; }
    if (answers.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < answers.length; i++) { gaps.push(answers[i].timestamp - answers[i - 1].timestamp); }
      gaps.sort((a: number, b: number) => a - b);
      const middle = Math.floor(gaps.length / 2);
      f[10] = gaps.length % 2 === 1 ? gaps[middle] : (gaps[middle - 1] + gaps[middle]) / 2;
    }
    if (hints.length) { f[11] = time - hints[hints.length - 1].timestamp; }
    f[12] = answers.length > 0 && !unknownGrade ? (f[1] as number) / answers.length : null;
    f[13] = 0; f[15] = 0; f[19] = 0;
    let requestId = '';
    for (const e of events) {
      if (['help_requested', 'task_split_requested', 'break_requested'].includes(e.kind)) {
        requestId = e.requestId;
        f[13] = e.kind === 'break_requested' ? 0 : 1;
        f[14] = e.hintDepth; f[15] = e.kind === 'break_requested' ? 1 : 0;
        f[19] = e.kind === 'task_split_requested' ? 1 : 0;
        if (e.loadHigh !== null) { f[16] = e.loadHigh ? 1 : 0; }
      }
      if ((['hint_shown', 'split_shown'].includes(e.kind) && e.requestId === requestId) ||
        ['task_paused', 'task_resumed', 'task_finished'].includes(e.kind)) {
        requestId = ''; f[13] = 0; f[14] = null; f[15] = 0; f[19] = 0;
        if (e.kind === 'task_resumed') { f[16] = null; }
      }
    }
    f[22] = 1; f[24] = taskById(session.taskId)?.difficulty || null;
    // Mastery, exact progress, visible method counts and active time have no reliable measurement yet.
    result.mask = f.map((value: number | null) => value === null ? 0 : 1);
    result.ready = true; return result;
  }
}
