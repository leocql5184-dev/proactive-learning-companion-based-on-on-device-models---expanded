import { LearningSession } from './LearningTypes';

export class ProactivePolicy {
  // Three minutes of visible inactivity for the current test setting; silence never implies an emotion.
  static readonly THINKING_PAUSE_MS: number = 180000;

  static helpForPause(session: LearningSession | undefined, collectionEnabled: boolean,
    proactiveEnabled: boolean, visibleSince: number, now: number): boolean {
    if (!session || !proactiveEnabled || !collectionEnabled || !session.coverageComplete ||
      session.status !== 'active' || session.pendingRequestId ||
      (session.offerId && !session.offerResponse) || now < session.suppressUntil) { return false; }
    const since = Math.max(session.lastActivityAt || session.updatedAt, visibleSince);
    return now >= since && now - since >= ProactivePolicy.THINKING_PAUSE_MS;
  }

  static restForReport(session: LearningSession | undefined, proactiveEnabled: boolean,
    profileEnabled: boolean, facet: string, value: string, now: number): string {
    if (!session || !proactiveEnabled || !profileEnabled || session.status !== 'active' ||
      session.pendingRequestId || (session.offerId && !session.offerResponse) ||
      now < session.suppressUntil || facet !== 'emotion') { return ''; }
    if (value === 'tired') { return 'self_report_tired'; }
    if (value === 'frustrated') { return 'self_report_frustrated'; }
    return '';
  }
}
