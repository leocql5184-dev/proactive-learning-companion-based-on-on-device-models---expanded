// UI-only conversation model. No inference, microphone or camera is invoked here.
export class ChatMessage {
  id: string = '';
  role: string = 'user';
  text: string = '';
  constructor(id: string, role: string, text: string) {
    this.id = id;
    this.role = role;
    this.text = text;
  }
}

export class Conversation {
  id: string = '';
  title: string = '新对话';
  projectId: string = '';
  draft: string = '';
  messages: ChatMessage[] = [];
  updatedAt: number = 0;
  constructor(id: string, projectId: string) {
    this.id = id;
    this.projectId = projectId;
    this.updatedAt = Date.now();
  }
}

export class LearningProject {
  id: string = '';
  name: string = '';
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class ChatSnapshot {
  version: number = 1;
  conversations: Conversation[] = [];
  projects: LearningProject[] = [];
  activeId: string = '';
  projectId: string = '';
  dark: boolean = false;
}

export class ChatModel {
  state: ChatSnapshot = new ChatSnapshot();
  private sequence: number = 0;

  private id(prefix: string): string {
    this.sequence += 1;
    return `${prefix}-${Date.now()}-${this.sequence}`;
  }

  active(): Conversation | undefined {
    return this.state.conversations.find((item: Conversation) => item.id === this.state.activeId);
  }

  newConversation(projectId: string = this.state.projectId): Conversation {
    const thread = new Conversation(this.id('chat'), projectId);
    this.state.conversations.unshift(thread);
    this.state.activeId = thread.id;
    this.state.projectId = projectId;
    return thread;
  }

  select(id: string): void {
    const thread = this.state.conversations.find((item: Conversation) => item.id === id);
    if (thread) {
      this.state.activeId = id;
      this.state.projectId = thread.projectId;
    }
  }

  selectProject(id: string): void {
    this.state.projectId = id;
    this.state.activeId = '';
  }

  createProject(name: string): LearningProject | undefined {
    const cleaned = name.trim().slice(0, 32);
    if (cleaned.length === 0) { return undefined; }
    const project = new LearningProject(this.id('project'), cleaned);
    this.state.projects.push(project);
    this.selectProject(project.id);
    return project;
  }

  rename(id: string, title: string): void {
    const thread = this.state.conversations.find((item: Conversation) => item.id === id);
    if (thread && title.trim().length > 0) { thread.title = title.trim().slice(0, 40); }
  }

  remove(id: string): void {
    this.state.conversations = this.state.conversations.filter((item: Conversation) => item.id !== id);
    if (this.state.activeId === id) { this.state.activeId = ''; }
  }

  move(id: string, projectId: string): void {
    const thread = this.state.conversations.find((item: Conversation) => item.id === id);
    if (thread) {
      thread.projectId = projectId;
      this.state.projectId = projectId;
    }
  }

  send(text: string): boolean {
    const cleaned = text.trim();
    if (cleaned.length === 0) { return false; }
    const thread = this.active() || this.newConversation();
    if (thread.messages.length === 0 && thread.title === '新对话') { thread.title = cleaned.slice(0, 24); }
    thread.messages.push(new ChatMessage(this.id('message'), 'user', cleaned));
    thread.messages.push(new ChatMessage(this.id('message'), 'assistant',
      '问题已经记下了。\n\n这里先为你留出一起思考的空间。当前是页面原型，尚未接入智能模型，因此这是一条固定的界面示例，不是对问题的实际解答。'));
    thread.draft = '';
    thread.updatedAt = Date.now();
    this.state.conversations.sort((a: Conversation, b: Conversation) => b.updatedAt - a.updatedAt);
    return true;
  }

  setDraft(text: string): void {
    const thread = this.active();
    if (thread) { thread.draft = text; }
  }

  serialize(): string { return JSON.stringify(this.state); }

  restore(raw: string): boolean {
    try {
      const data = JSON.parse(raw) as ChatSnapshot;
      if (data.version !== 1 || !Array.isArray(data.conversations) || !Array.isArray(data.projects)) { return false; }
      for (const thread of data.conversations) {
        if (typeof thread.id !== 'string' || typeof thread.title !== 'string' ||
          typeof thread.projectId !== 'string' || typeof thread.draft !== 'string' ||
          typeof thread.updatedAt !== 'number' || !Array.isArray(thread.messages)) { return false; }
        for (const message of thread.messages) {
          if (typeof message.id !== 'string' || typeof message.text !== 'string' ||
            (message.role !== 'user' && message.role !== 'assistant')) { return false; }
        }
      }
      for (const project of data.projects) {
        if (typeof project.id !== 'string' || typeof project.name !== 'string') { return false; }
      }
      if (typeof data.activeId !== 'string' || typeof data.projectId !== 'string' || typeof data.dark !== 'boolean') {
        return false;
      }
      this.state = data;
      return true;
    } catch (_) { return false; }
  }
}
