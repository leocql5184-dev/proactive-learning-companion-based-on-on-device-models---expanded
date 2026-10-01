import { LearningTask } from './LearningTypes';

/** Short, task-specific teaching messages. These are authored prompts, not model output. */
export class CompanionGuidance {
  static afterSubmission(task: LearningTask | undefined, result: string): string {
    if (!task || !result) { return ''; }
    if (result === '本次选择正确') {
      return task.id === 'FUNC-SC-0193' ?
        '答对了！lg 表示以 10 为底，lg x = 2 可以改写成 x = 10²，所以 x = 100。' :
        '这一步完成了。试着回头说说，你用了哪个条件？';
    }
    if (result === '本次选择不正确，可以继续尝试') {
      return `先别急着重选。${task.hint1} 想清楚这一步，再试一次。`;
    }
    return `我已记下你的思路，目前不能自动判断这道题的对错。我们先看第一步：${task.hint1}`;
  }
}
