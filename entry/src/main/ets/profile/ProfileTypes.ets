export class ProfileInput {
  id: string = '';
  sessionId: string = '';
  taskId: string = '';
  kind: string = '';
  value: string = '';
  timestamp: number = 0;
  requestId: string = '';
  context: string = '';
}

export class ProfileObservation {
  id: string = '';
  dimension: string = '';
  facet: string = '';
  description: string = '';
  status: string = 'OBSERVING';
  source: string = 'app_observation';
  evidenceIds: string[] = [];
  expiresAt: number = 0;
}

export class ProfileState {
  version: number = 0;
  enabled: boolean = false;
  clearPending: boolean = false;
  epoch: number = 0;
  observations: ProfileObservation[] = [];
  feedback: ProfileInput[] = [];
}

export interface ProfilePolicy {
  id: string;
  version: number;
  mode: string;
  steps: string[];
  currentTtlMs: number;
  windowMs: number;
  preferenceSessions: number;
  preferenceDays: number;
}

export class ReportOption {
  facet: string;
  value: string;
  label: string;
  constructor(facet: string, value: string, label: string) {
    this.facet = facet; this.value = value; this.label = label;
  }
}

export const REPORT_OPTIONS: ReportOption[] = [
  new ReportOption('emotion', 'calm', '心情平静'), new ReportOption('emotion', 'happy', '有成就感'),
  new ReportOption('emotion', 'tense', '有点紧张'), new ReportOption('emotion', 'frustrated', '有点烦躁'),
  new ReportOption('emotion', 'tired', '有点累'),
  new ReportOption('confidence', 'low', '这道题没信心'), new ReportOption('confidence', 'high', '这道题有信心'),
  new ReportOption('attention', 'distracted', '刚才走神了'), new ReportOption('attention', 'focused', '已回到题目'),
  new ReportOption('strategy', 'stuck', '一直用原方法，没进展'), new ReportOption('strategy', 'changed', '我换了一个思路'),
  new ReportOption('interaction', 'independent', '我喜欢先独立想一想'), new ReportOption('interaction', 'discuss', '我喜欢边讨论边想'),
  new ReportOption('planning', 'planned', '我已想好分步计划'),
  new ReportOption('checking', 'checked', '我检查过答案和步骤')
];

export function reportLabel(facet: string, value: string): string {
  const option = REPORT_OPTIONS.find((o: ReportOption) => o.facet === facet && o.value === value);
  return option ? option.label : '';
}

export const FEEDBACK_VALUES: string[] = ['accepted', 'rejected', 'later', 'helpful', 'unhelpful', 'unknown'];
export const FEEDBACK_LABELS: string[] = ['愿意尝试', '不需要', '稍后再说', '有帮助', '没帮助', '还不确定'];
