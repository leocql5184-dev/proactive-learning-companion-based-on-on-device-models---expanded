import { ProfileInput, ProfileObservation, ProfilePolicy, reportLabel } from './ProfileTypes';

/** Deterministic executor of the bundled Skill policy, not language-model inference. */
export class ProfileEngine {
  static build(inputs: ProfileInput[], excluded: string[], now: number, policy: ProfilePolicy): ProfileObservation[] {
    const evidence = inputs.filter((e: ProfileInput) => !excluded.includes(e.id) && e.timestamp <= now &&
      e.timestamp >= now - policy.windowMs).sort((a: ProfileInput, b: ProfileInput) => a.timestamp - b.timestamp);
    const out: ProfileObservation[] = [];
    const sessions: string[] = [];
    for (const e of evidence) { if (!sessions.includes(e.sessionId)) { sessions.push(e.sessionId); } }
    for (const sessionId of sessions) {
      const rows = evidence.filter((e: ProfileInput) => e.sessionId === sessionId);
      const answers = rows.filter((e: ProfileInput) => e.kind === 'answer_submitted');
      if (answers.length) {
        const last = answers[answers.length - 1];
        const supported = rows.some((e: ProfileInput) => ['hint_shown', 'split_shown'].includes(e.kind) && e.timestamp <= last.timestamp);
        const description = last.value === 'unknown' ? '已作答，未判分，知识表现待观察' :
          last.value === 'correct' ? `${supported ? '提示后' : '未显示提示时'}本次作答正确；独立理解与迁移待观察` : '本次作答不正确，具体知识卡点待观察';
        ProfileEngine.add(out, `knowledge:${sessionId}`, 'knowledge', 'knowledge_point',
          `${last.taskId}：${description}${last.context ? '；题目关联：' + last.context : ''}`, answers,
          'app_observation', last.timestamp + policy.windowMs);
      }
      const lastWrong = rows.find((e: ProfileInput) => e.kind === 'answer_submitted' && e.value === 'wrong');
      if (lastWrong) {
        const later = rows.filter((e: ProfileInput) => e.timestamp > lastWrong.timestamp &&
          ['help_requested', 'task_split_requested', 'task_resumed'].includes(e.kind));
        if (later.length) {
          ProfileEngine.add(out, `recovery:${sessionId}`, 'learning_attitude_habits', 'resilience',
            '本次遇错后有求助或恢复学习行为；长期韧性待观察', [lastWrong, ...later], 'app_observation',
            later[later.length - 1].timestamp + policy.windowMs);
        }
      }
      const facets: string[] = ['emotion', 'confidence', 'attention', 'strategy', 'interaction', 'planning', 'checking'];
      for (const facet of facets) {
        const reports = rows.filter((e: ProfileInput) => e.kind === `report:${facet}` ||
          (facet === 'emotion' && e.kind === 'break_requested'));
        if (!reports.length) { continue; }
        const last = reports[reports.length - 1];
        const longitudinal = facet === 'interaction';
        const expiry = last.timestamp + (longitudinal ? policy.windowMs : policy.currentTtlMs);
        const paused = rows.filter((e: ProfileInput) => e.kind === 'session_state' && e.value === 'paused' && e.timestamp <= last.timestamp);
        const ended = rows.some((e: ProfileInput) => e.timestamp >= last.timestamp &&
          (e.kind === 'task_finished' || e.kind === 'task_resumed' || (e.kind === 'session_state' &&
            (e.value === 'finished' || (e.value === 'active' && paused.length > 0 && e.timestamp > last.timestamp)))));
        if (!longitudinal && (ended || expiry <= now)) { continue; }
        const dimension = ['emotion', 'confidence', 'interaction'].includes(facet) ? 'emotion_personality' : 'learning_attitude_habits';
        const mapped = facet === 'emotion' ? 'current_emotion' : facet === 'confidence' ? 'learning_confidence' :
          facet === 'strategy' ? 'strategy_flexibility' : facet === 'interaction' ? 'personality_tendency' :
          facet === 'checking' ? 'self_monitoring' : facet;
        const label = last.kind === 'break_requested' ? '有点累，想休息' : reportLabel(facet, last.value);
        ProfileEngine.add(out, `report:${facet}:${sessionId}`, dimension, mapped,
          `用户自述：${label}（${last.taskId}）`, [last], 'user_self_report', expiry, 'USER_CONFIRMED');
      }
    }
    // One latest emotional report per session; repeated clicks cannot inflate the distribution.
    const emotional: ProfileInput[] = [];
    for (const sid of sessions) {
      const rows = evidence.filter((e: ProfileInput) => e.sessionId === sid &&
        (e.kind === 'report:emotion' || e.kind === 'break_requested'));
      if (rows.length) { emotional.push(rows[rows.length - 1]); }
    }
    const emotions: string[] = ['calm', 'happy', 'tense', 'frustrated', 'tired'];
    for (const value of emotions) {
      const matches = emotional.filter((e: ProfileInput) => e.value === value);
      if (matches.length) {
        ProfileEngine.add(out, `recurring:${value}`, 'emotion_personality', 'recurring_emotion',
          `近 ${Math.round(policy.windowMs / 86400000)} 天 ${emotional.length} 个有自报的会话中，${matches.length} 个最后自报“${reportLabel('emotion', value)}”；不代表全部学习时间`,
          emotional, 'user_self_report', matches[matches.length - 1].timestamp + policy.windowMs);
      }
    }
    const splits = evidence.filter((e: ProfileInput) => e.kind === 'task_split_requested');
    if (splits.length) {
      const uniqueSessions: string[] = []; const days: string[] = [];
      for (const e of splits) {
        if (!uniqueSessions.includes(e.sessionId)) { uniqueSessions.push(e.sessionId); }
        const day = new Date(e.timestamp).toDateString(); if (!days.includes(day)) { days.push(day); }
      }
      const latestFeedback = evidence.filter((e: ProfileInput) => e.kind === 'feedback:split' &&
        !evidence.some((later: ProfileInput) => later.kind === e.kind && later.requestId === e.requestId &&
          later.sessionId === e.sessionId && later.timestamp > e.timestamp &&
          ['accepted', 'rejected', 'later'].includes(later.value) === ['accepted', 'rejected', 'later'].includes(e.value)));
      const recentReject = latestFeedback.some((e: ProfileInput) =>
        ['rejected', 'unhelpful'].includes(e.value) && e.timestamp >= splits[splits.length - 1].timestamp);
      const stable = !recentReject && uniqueSessions.length >= policy.preferenceSessions && days.length >= policy.preferenceDays;
      const refs = evidence.filter((e: ProfileInput) => e.kind === 'task_split_requested' || e.kind === 'feedback:split');
      ProfileEngine.add(out, 'preference:split', 'learning_attitude_habits', 'guidance_preference',
        `${uniqueSessions.length} 个会话主动请求分步骤${recentReject ? '；最近反馈不适合，已降低支持程度' : '；可优先提供分步选项'}`,
        refs, 'app_observation', splits[splits.length - 1].timestamp + policy.windowMs, stable ? 'SUPPORTED' : 'OBSERVING');
    }
    for (const dimension of ['knowledge', 'emotion_personality', 'learning_attitude_habits']) {
      if (!out.some((o: ProfileObservation) => o.dimension === dimension)) {
        const unknown = new ProfileObservation(); unknown.id = `unknown:${dimension}`;
        unknown.dimension = dimension; unknown.facet = 'unknown'; unknown.status = 'UNKNOWN';
        unknown.description = '暂无足够记录，待观察'; out.push(unknown);
      }
    }
    return out;
  }

  private static add(out: ProfileObservation[], id: string, dimension: string, facet: string, description: string,
    rows: ProfileInput[], source: string, expiresAt: number, status: string = 'OBSERVING'): void {
    const o = new ProfileObservation(); o.id = id; o.dimension = dimension; o.facet = facet;
    o.description = description; o.source = source; o.expiresAt = expiresAt; o.status = status;
    o.evidenceIds = rows.map((e: ProfileInput) => e.id); out.push(o);
  }
}
