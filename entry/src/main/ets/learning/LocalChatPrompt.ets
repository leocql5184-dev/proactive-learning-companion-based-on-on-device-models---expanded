export class ChatTurn {
  role: string;
  content: string;
  constructor(role: string, content: string) { this.role = role; this.content = content; }
}

export class LocalChatPrompt {
  private static clean(text: string, limit: number): string {
    return text.replace(/<\|/g, '＜|').replace(/\|>/g, '|＞').slice(0, limit);
  }

  static build(stem: string, draft: string, turns: ChatTurn[], question: string): string {
    const system = '你是中文学习伙伴。根据学生的问题自然交流，每次只引导一小步，优先提问帮助理解。' +
      '不要编造学生状态，不确定时明确说明；不能把猜测当作正确答案。回复简短，不输出思考过程。' +
      '\n当前题目：' + LocalChatPrompt.clean(stem, 250) + '\n学生思路：' + LocalChatPrompt.clean(draft, 100);
    let prompt = '<|im_start|>system\n' + system + '<|im_end|>\n';
    turns.slice(-4).forEach((turn: ChatTurn) => {
      const role = turn.role === 'assistant' ? 'assistant' : 'user';
      prompt += '<|im_start|>' + role + '\n' + LocalChatPrompt.clean(turn.content, 120) + '<|im_end|>\n';
    });
    return prompt + '<|im_start|>user\n' + LocalChatPrompt.clean(question, 300) +
      '\n/no_think<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n';
  }
}
