import { common } from '@kit.AbilityKit';
import { fileIo as fs, picker } from '@kit.CoreFileKit';
import { cryptoFramework } from '@kit.CryptoArchitectureKit';
import { QwenTokenizer, QwenTokenizerSpec } from '../learning/QwenTokenizer';
import llm from 'libcompanion_llm.so';
import { ChatTurn, LocalChatPrompt } from '../learning/LocalChatPrompt';

@Entry
@Component
struct CompanionChat {
  @State turns: ChatTurn[] = [];
  @State question: string = '';
  @State partial: string = '';
  @State pendingQuestion: string = '';
  @State notice: string = '';
  @State busy: boolean = false;
  @State importing: boolean = false;
  @State modelReady: boolean = false;
  @State stem: string = '';
  private draft: string = '';
  private modelPath: string = '';
  private tokenizer: QwenTokenizer | undefined = undefined;
  private timer: number = -1;
  private visible: boolean = true;
  private scroller: Scroller = new Scroller();

  aboutToAppear(): void {
    const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
    this.modelPath = context.filesDir + '/qwen3-ms';
    const params = this.getUIContext().getRouter().getParams() as Record<string, string>;
    this.stem = params?.stem || '';
    this.draft = params?.draft || '';
    this.question = params?.question || '';
    try {
      if (!fs.accessSync(this.modelPath)) { fs.mkdirSync(this.modelPath); }
      const spec = JSON.parse(fs.readTextSync(this.modelPath + '/tokenizer.json')) as QwenTokenizerSpec;
      this.tokenizer = new QwenTokenizer(spec);
      this.modelReady = fs.statSync(this.modelPath + '/qwen-prefill.ms').size === 1503568288 &&
        fs.statSync(this.modelPath + '/qwen-decode.ms').size === 1503579280;
    }
    catch (_) { this.modelReady = false; }
    if (this.modelReady && this.question) { this.send(); }
  }
  onPageShow(): void { this.visible = true; }
  onPageHide(): void { this.stop(); this.visible = false; }
  aboutToDisappear(): void { this.stop(); this.visible = false; }

  private stop(): void {
    if (this.busy) { llm.cancel(); this.partial = ''; this.notice = '正在停止回复…'; }
    if (this.timer !== -1) { clearInterval(this.timer); this.timer = -1; }
  }

  /** @throws {Error} File and digest errors are handled by importModel without replacing the existing model. */
  private async verifyModel(path: string, expected: string): Promise<void> {
    const file = await fs.open(path, fs.OpenMode.READ_ONLY);
    try {
      const digest = cryptoFramework.createMd('SHA256');
      const buffer = new ArrayBuffer(1024 * 1024);
      let size = await fs.read(file.fd, buffer);
      while (size > 0) {
        await digest.update({ data: new Uint8Array(buffer, 0, size) });
        size = await fs.read(file.fd, buffer);
      }
      const hash = await digest.digest();
      let hex: string = '';
      hash.data.forEach((value: number) => { hex += value.toString(16).padStart(2, '0'); });
      if (hex !== expected) {
        throw new Error('模型文件不完整或版本不符，请重新复制官方模型。');
      }
    } finally { await fs.close(file); }
  }

  private async importModel(): Promise<void> {
    if (this.busy || this.importing) { return; }
    this.importing = true;
    const names: string[] = ['qwen-prefill.ms', 'qwen-decode.ms', 'tokenizer.json'];
    const sizes: number[] = [1503568288, 1503579280, 4566419];
    const hashes: string[] = ["b03f905fac1359fcf309d1bf923aba4461f0285bd7c53bf006bf8b390122ee87", "f5919a4230e9b2333a7cc1302968a73a5e2c4654fb0b739ada51356b542c8e2e", "fa6eb6bb1fe78fd84273532a17c7ff3e8235b0e75f29ad1b06ed8cede80fd759"];
    try {
      const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
      const options = new picker.DocumentSelectOptions(); options.maxSelectNumber = 3;
      const selected = await new picker.DocumentViewPicker(context).select(options);
      if (selected.length === 0) { return; }
      if (selected.length !== 3) { throw new Error('SELECT_THREE_FILES'); }
      this.notice = '正在复制并校验 .ms 双模型和分词器…';
      const imported: boolean[] = [false, false, false];
      for (let i = 0; i < selected.length; i++) {
        const source = await fs.open(selected[i], fs.OpenMode.READ_ONLY);
        try {
          const index = sizes.indexOf((await fs.stat(source.fd)).size);
          if (index < 0 || imported[index]) { throw new Error('INVALID_MODEL_FILES'); }
          const temporary = this.modelPath + '/' + names[index] + '.part';
          await fs.copyFile(source.fd, temporary);
          await this.verifyModel(temporary, hashes[index]); imported[index] = true;
        } finally { await fs.close(source); }
      }
      // Each staged file has passed SHA-256 before replacing the current set.
      this.modelReady = false;
      for (let i = 0; i < names.length; i++) {
        await fs.rename(this.modelPath + '/' + names[i] + '.part', this.modelPath + '/' + names[i]);
      }
      this.tokenizer = new QwenTokenizer(JSON.parse(fs.readTextSync(this.modelPath + '/tokenizer.json')) as QwenTokenizerSpec);
      this.modelReady = true; this.notice = 'MindSpore 离线资源已准备。';
    } catch (_) {
      this.notice = '导入失败，请同时选择配套的两个 .ms 文件和 tokenizer.json，并检查剩余空间。';
    } finally {
      for (let i = 0; i < names.length; i++) {
        try { await fs.unlink(this.modelPath + '/' + names[i] + '.part'); } catch (_) {}
      }
      this.importing = false;
    }
  }

  private async send(): Promise<void> {
    const text = this.question.trim();
    if (!text || this.busy || this.importing || !this.modelReady || !this.tokenizer) { return; }
    const prompt = LocalChatPrompt.build(this.stem, this.draft, this.turns, text);
    const tokenizer = this.tokenizer;
    const tokens = tokenizer.encode(prompt, true);
    this.busy = true; this.partial = ''; this.notice = '学伴正在本机思考…';
    this.pendingQuestion = text;
    this.question = '';
    this.timer = setInterval(() => {
      this.partial = tokenizer.decode(llm.progress());
      if (this.partial) { this.notice = '正在回复…'; }
    }, 200);
    try {
      const response = tokenizer.decode(await llm.generate(this.modelPath, tokens));
      if (!this.visible) { return; }
      this.turns = this.turns.concat([new ChatTurn('user', text), new ChatTurn('assistant', response)]).slice(-12);
      this.partial = ''; this.notice = '';
      this.scroller.scrollEdge(Edge.Bottom);
    } catch (error) {
      if (!this.visible) { return; }
      this.question = text;
      const reason = (error as Error).message;
      if (reason.includes('CANCELLED')) { this.notice = '回复已停止或等待超时，可以重新发送。'; }
      else if (reason.includes('CONTEXT_TOO_LONG')) { this.notice = '本次内容较长，请清空对话或缩短问题后重试。'; }
      else { this.notice = '本机模型暂时无法回复，请检查模型文件或重新进入后再试。'; }
      // An interrupted response is never added to the next turn as a complete answer.
      this.partial = '';
    } finally {
      if (this.timer !== -1) { clearInterval(this.timer); this.timer = -1; }
      this.busy = false;
    }
  }

  build() {
    Column({ space: 12 }) {
      Row() {
        Button('‹ 返回学习').fontColor('#E6C96A').backgroundColor(Color.Transparent)
          .onClick(() => { this.stop(); this.getUIContext().getRouter().back(); })
        Blank()
        Text('和学伴聊聊').fontSize(19).fontColor('#FDF8EE')
      }.width('100%')
      Text('在这台设备上交流 · 对话仅在本页保留').fontSize(12).fontColor('#C9D3E6')
      if (!this.modelReady) {
        Column({ space: 12 }) {
          Text('准备离线学伴').fontSize(20).fontColor('#1F2A44')
          Text('首次使用请同时选择 qwen-prefill.ms、qwen-decode.ms 和 tokenizer.json。约需 3 GB 模型存储空间。')
            .fontSize(14).fontColor('#7A7468').lineHeight(22)
          Button(this.importing ? '正在准备…' : '选择本机模型文件').enabled(!this.importing)
            .backgroundColor('#C9A227').fontColor('#1F2A44').onClick(() => { this.importModel(); })
        }.padding(18).backgroundColor('#FDF8EE').borderRadius(14).width('100%')
      }
      if (this.modelReady && !this.busy) {
        Button('重新选择模型文件').fontSize(12).backgroundColor(Color.Transparent).fontColor('#C9D3E6')
          .enabled(!this.importing).onClick(() => { this.importModel(); })
      }
      Scroll(this.scroller) {
        Column({ space: 12 }) {
          if (this.stem) {
            Text('正在讨论：' + this.stem).fontSize(13).fontColor('#7A7468')
              .padding(14).backgroundColor('#FDF8EE').borderRadius(10).width('100%')
          }
          if (this.turns.length === 0 && !this.busy) {
            Text('哪里没想明白？把你的问题或思路告诉我，我们一起看。')
              .fontSize(15).fontColor('#1F2A44').padding(16).backgroundColor('#FDF8EE').borderRadius(12)
          }
          ForEach(this.turns, (turn: ChatTurn) => {
            Column({ space: 7 }) {
              Text(turn.role === 'user' ? '我' : '学伴').fontSize(12).fontColor('#7A7468')
              Text(turn.content).fontSize(15).lineHeight(24).fontColor('#1F2A44').copyOption(CopyOptions.InApp)
            }.width('100%').alignItems(HorizontalAlign.Start).padding(15).borderRadius(12)
              .backgroundColor(turn.role === 'user' ? '#F5E9C9' : '#FDF8EE')
          }, (turn: ChatTurn, index: number) => index.toString() + turn.role)
          if (this.busy) {
            Text(this.pendingQuestion).fontSize(15).lineHeight(24).fontColor('#1F2A44')
              .padding(15).backgroundColor('#F5E9C9').borderRadius(12).width('100%')
          }
          if (this.partial) {
            Text(this.partial).fontSize(15).lineHeight(24).fontColor('#1F2A44')
              .padding(15).backgroundColor('#FDF8EE').borderRadius(12).width('100%')
          }
        }.width('100%')
      }.layoutWeight(1).width('100%')
      if (this.notice) { Text(this.notice).fontSize(12).fontColor('#E6C96A') }
      TextArea({ text: this.question, placeholder: '问问学伴，或说说你的想法…' })
        .maxLength(300).height(88).backgroundColor('#FDF8EE').enabled(!this.busy)
        .onChange((value: string) => { this.question = value; })
      Row({ space: 12 }) {
        Button('清空对话').enabled(!this.busy).backgroundColor('#FDF8EE').fontColor('#1F2A44')
          .onClick(() => { this.turns = []; this.partial = ''; this.notice = ''; })
        Button(this.busy ? '停止回复' : '发送').layoutWeight(1).backgroundColor('#C9A227').fontColor('#1F2A44')
          .enabled(this.busy || (this.modelReady && !this.importing && this.question.trim().length > 0))
          .onClick(() => { if (this.busy) { this.stop(); } else { this.send(); } })
      }.width('100%')
    }.width('100%').height('100%').padding(16).backgroundColor('#1F2A44')
  }
}
