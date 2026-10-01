import { common } from '@kit.AbilityKit';
import { EventCollector } from '../learning/EventCollector';
import { LearningRepository } from '../learning/LearningRepository';
import { LearningFileStore } from '../learning/LearningFileStore';
import { ProactivePolicy } from '../learning/ProactivePolicy';
import { CompanionGuidance } from '../learning/CompanionGuidance';
import { LearningTask, LearningSession, LEARNING_TASKS, taskById } from '../learning/LearningTypes';
import { MathKnowledgeRdb } from '../knowledge/MathKnowledgeRdb';
import { BehaviorEmotionRdb, EmotionReference } from '../knowledge/BehaviorEmotionRdb';
import { BehaviorInterpreter } from '../knowledge/BehaviorInterpreter';
import { ProfileAgent } from '../profile/ProfileAgent';
import { ProfileState, ProfileObservation, ProfileInput, REPORT_OPTIONS, ReportOption, FEEDBACK_VALUES, FEEDBACK_LABELS } from '../profile/ProfileTypes';

@Entry
@Component
struct LearningWorkspace {
  private store: LearningFileStore = new LearningFileStore();
  private repository: LearningRepository = new LearningRepository(this.store);
  private behaviorGraph: BehaviorEmotionRdb | undefined = undefined;
  private mathGraph: MathKnowledgeRdb | undefined = undefined;
  private profileAgent: ProfileAgent | undefined = undefined;
  private profileSignature: string = '';
  @State profileOn: boolean = false;
  @State profileBusy: boolean = false;
  @State profileAvailable: boolean = false;
  @State profileExpanded: boolean = false;
  @State reportExpanded: boolean = false;
  @State profileStatus: string = '画像准备中';
  @State profileItems: ProfileObservation[] = [];
  @State profileFeedback: ProfileInput[] = [];
  @State profileGuidance: string = '';
  private graphRequest: number = 0;
  private graphTimer: number = -1;
  private proactiveTimer: number = -1;
  private visibleSince: number = 0;
  @State behaviorGraphStatus: string = '行为图谱准备中';
  @State graphFact: string = '';
  @State graphAdvice: string = '';
  @State graphEvidence: string = '';
  @State graphReferences: EmotionReference[] = [];
  @State graphExpanded: boolean = false;
  @State collectionOn: boolean = false;
  @State proactiveOn: boolean = false;
  @State offerId: string = '';
  @State offerKind: string = '';
  @State offerReason: string = '';
  @State offerResponse: string = '';
  @State ready: boolean = false;
  @State taskId: string = '';
  @State status: string = '';
  @State draft: string = '';
  @State result: string = '';
  @State notice: string = '';
  @State cardKind: string = '';
  @State cardDepth: number = 1;
  @State requestId: string = '';
  @State clearing: boolean = false;
  @State mathGraphStatus: string = '数学知识图谱准备中';
  @State activeTab: string = 'study';
  @State catalogOpen: boolean = false;
  @State guidanceOpen: boolean = false;
  @State submissionMessageOpen: boolean = false;

  aboutToAppear(): void {
    const params = this.getUIContext().getRouter().getParams() as Record<string, string>;
    this.catalogOpen = params?.section === 'catalog';
    if (params && ['study', 'growth', 'settings'].includes(params.section)) {
      this.activeTab = params.section;
    }
    try {
      const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
      this.store.configure(context.filesDir);
      this.repository.load(); this.ready = true;
      this.initializeMathGraph(context);
      this.initializeBehaviorGraph(context);
      this.initializeProfile(context);
    } catch (_) { this.notice = '学习记录未能读取。可重试打开；清除记录将重新开始。'; }
    this.refresh();
  }

  private async initializeProfile(context: common.UIAbilityContext): Promise<void> {
    try {
      this.profileAgent = await ProfileAgent.open(context);
      if (this.profileAgent.state.clearPending) {
        this.repository.clear();
        await this.profileAgent.finishClear();
        this.ready = true; this.refresh();
      }
      this.profileAvailable = true;
      this.showProfile(this.profileAgent.state);
      await this.syncProfile();
    } catch (_) { this.profileStatus = '画像未就绪，请重试；学习任务仍可使用'; }
  }

  private showProfile(state: ProfileState): void {
    this.profileOn = state.enabled; this.profileItems = state.observations.slice();
    this.profileFeedback = state.feedback.slice();
    this.profileGuidance = this.profileAgent ? this.profileAgent.guidance() : '';
    this.profileStatus = state.clearPending ? '记录清除尚未完成，请重试' :
      state.enabled ? '成长记录已开启' : '成长记录已关闭';
  }

  private async syncProfile(force: boolean = false): Promise<void> {
    if (!this.profileAgent || this.profileBusy || this.profileAgent.state.clearPending) { return; }
    const state = this.repository.collector.state;
    const signature = `${state.collectionEnabled}:${this.mathGraph !== undefined}:` +
      state.sessions.map((s: LearningSession) => `${s.sessionId}:${s.events.length}:${s.coverageComplete}:${s.status}`).join('|');
    try {
      if (signature !== this.profileSignature) {
        this.profileSignature = signature;
        await this.profileAgent.sync(state, this.mathGraph);
      } else if (force) { await this.profileAgent.refresh(); } else { return; }
      this.showProfile(this.profileAgent.state);
    } catch (_) { this.profileSignature = ''; this.profileStatus = '画像更新未保存，请重试'; }
  }

  private async profileAction(action: string, value: string = '', facet: string = '', id: string = ''): Promise<void> {
    if (this.profileBusy || !this.profileAgent) { return; }
    this.profileBusy = true;
    try {
      if (action === 'enable') { await this.profileAgent.enable(value === 'true'); }
      else if (action === 'correct') { await this.profileAgent.correct(id); }
      else if (action === 'report') {
        await this.profileAgent.report(this.repository.collector.active(), facet, value);
        const reason = ProactivePolicy.restForReport(this.repository.collector.active(),
          this.repository.collector.state.proactiveEnabled, this.profileAgent.state.enabled,
          facet, value, Date.now());
        if (reason) {
          this.repository.change((c: EventCollector) => c.offer('rest', reason, Date.now()));
          this.refresh();
        }
      }
      else if (action === 'feedback') { await this.profileAgent.feedback(this.repository.collector.active(), id, this.cardKind, value); }
      this.showProfile(this.profileAgent.state); this.notice = '已记录你的选择';
    }
    catch (error) { this.notice = (error as Error).message; }
    finally { this.profileBusy = false; this.profileSignature = ''; }
    await this.syncProfile();
  }

  private feedbackText(): string {
    const rows = this.profileFeedback.filter((f: ProfileInput) => f.requestId === this.requestId);
    return rows.length ? '已记录：' + rows.map((f: ProfileInput) => FEEDBACK_LABELS[FEEDBACK_VALUES.indexOf(f.value)]).join('、') : '尚无反馈，效果未知';
  }

  private async initializeBehaviorGraph(context: common.UIAbilityContext): Promise<void> {
    try {
      this.behaviorGraph = await BehaviorEmotionRdb.open(context);
      this.behaviorGraphStatus = '学习观察已准备好';
      this.refreshBehaviorGraph();
    } catch (_) { this.behaviorGraphStatus = '学习观察暂不可用'; }
  }

  private async refreshBehaviorGraph(): Promise<void> {
    const request = ++this.graphRequest;
    this.graphReferences = [];
    const collector = this.repository.collector;
    const observation = BehaviorInterpreter.inspect(collector.active(), collector.state.collectionEnabled, Date.now());
    this.graphFact = observation.fact;
    this.graphAdvice = observation.suggestion;
    this.graphEvidence = observation.eventIds.length ?
      `本次依据：${observation.eventIds.join('、')}；规则 ${observation.ruleVersion}` : '';
    if (!observation.ready || !observation.pattern || !this.behaviorGraph || !this.graphExpanded) { return; }
    try {
      const references = await this.behaviorGraph.references(observation.pattern);
      // Revoking consent, clearing records or changing sessions invalidates an in-flight read.
      if (request === this.graphRequest && this.collectionOn && this.graphExpanded) {
        this.graphReferences = references;
      }
    } catch (_) {
      if (request === this.graphRequest) { this.graphAdvice = '历史参考查询失败，请重试；当前操作仍可继续'; }
    }
  }

  onPageShow(): void {
    this.visibleSince = Date.now();
    this.refreshBehaviorGraph();
    this.syncProfile(true);
    if (this.graphTimer < 0) {
      this.graphTimer = setInterval(() => { this.refreshBehaviorGraph(); this.syncProfile(true); }, 30000);
    }
    if (this.proactiveTimer < 0) {
      this.proactiveTimer = setInterval(() => { this.checkProactivePause(); }, 5000);
    }
  }

  aboutToDisappear(): void { this.stopGraphTimer(); }

  private stopGraphTimer(): void {
    if (this.graphTimer >= 0) { clearInterval(this.graphTimer); this.graphTimer = -1; }
    if (this.proactiveTimer >= 0) { clearInterval(this.proactiveTimer); this.proactiveTimer = -1; }
    this.graphRequest++;
    this.graphReferences = [];
  }

  private async initializeMathGraph(context: common.UIAbilityContext): Promise<void> {
    try {
      const graph: MathKnowledgeRdb = await MathKnowledgeRdb.open(context);
      this.mathGraph = graph;
      this.mathGraphStatus = '学习内容已准备好';
      this.profileSignature = ''; this.syncProfile();
    } catch (_) {
      this.mathGraphStatus = '部分学习内容暂不可用';
    }
  }

  onPageHide(): void {
    this.guidanceOpen = false;
    this.submissionMessageOpen = false;
    if (this.repository.collector.active()?.status === 'active') {
      this.apply((c: EventCollector) => c.pause(Date.now()));
    }
    this.stopGraphTimer();
  }

  private refresh(): void {
    const c = this.repository.collector; const s = c.active();
    this.collectionOn = c.state.collectionEnabled;
    this.proactiveOn = c.state.proactiveEnabled;
    this.offerId = s ? s.offerId : '';
    this.offerKind = s ? s.offerKind : '';
    this.offerReason = s ? s.offerReason : '';
    this.offerResponse = s ? s.offerResponse : '';
    this.taskId = s ? s.taskId : ''; this.status = s ? s.status : '';
    this.draft = s ? s.draft : ''; this.result = s ? s.lastResult : '';
    this.cardKind = s ? (s.pendingKind || s.cardKind) : '';
    this.cardDepth = s ? (s.pendingDepth || s.cardDepth) : 1;
    this.requestId = s ? (s.pendingRequestId || s.cardRequestId) : '';
    this.refreshBehaviorGraph();
    this.syncProfile();
  }

  private checkProactivePause(): void {
    if (!this.ready || !this.visibleSince || this.activeTab !== 'study' || this.catalogOpen || this.guidanceOpen ||
      this.submissionMessageOpen) { return; }
    const collector = this.repository.collector;
    if (!ProactivePolicy.helpForPause(collector.active(), collector.state.collectionEnabled,
      collector.state.proactiveEnabled, this.visibleSince, Date.now())) { return; }
    this.apply((c: EventCollector) => c.offer('help', 'long_pause', Date.now()));
  }

  private changeTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'study') { this.visibleSince = Date.now(); }
  }

  private respondToOffer(response: string): void {
    const kind = this.offerKind;
    this.apply((c: EventCollector) => {
      c.respondOffer(response, Date.now());
      if (response === 'accepted') { c.request(kind === 'rest' ? 'break' : 'hint', Date.now(), 1); }
    });
    if (response === 'accepted' && kind === 'rest') { this.shown(this.requestId); }
    if (response === 'accepted' && kind === 'help') {
      this.openChat('我在这道题上卡住了，请根据我的思路给一点引导，先不要直接给完整答案。');
    }
  }

  private apply(action: (collector: EventCollector) => void): void {
    try {
      this.repository.change(action); this.notice = '已保存在本机';
      this.refresh();
    } catch (error) { this.notice = (error as Error).message; this.refresh(); }
  }

  private showRequest(kind: string, depth: number = 1): void {
    this.apply((c: EventCollector) => c.request(kind, Date.now(), depth));
    // Explicit rest requests pause immediately; they do not depend on scrolling to a card.
    if (kind === 'break') { this.shown(this.requestId); }
    else { this.guidanceOpen = true; }
  }

  private openChat(question: string = ''): void {
    this.guidanceOpen = false;
    this.submissionMessageOpen = false;
    const task = taskById(this.taskId);
    this.getUIContext().getRouter().pushUrl({
      url: 'pages/CompanionChat',
      params: { stem: task?.stem || '', draft: this.draft, question: question }
    }).catch(() => { this.notice = '对话暂时无法打开，请重试。'; });
  }

  private submitAnswer(): void {
    this.apply((c: EventCollector) => c.submit(Date.now()));
    if (this.draft.trim() && this.result && this.notice === '已保存在本机') {
      this.submissionMessageOpen = true;
    }
  }

  private cardText(): string {
    const task = taskById(this.taskId);
    if (!task) { return ''; }
    if (this.cardKind === 'hint') { return this.cardDepth === 2 ? task.hint2 : task.hint1; }
    if (this.cardKind === 'split') { return task.split; }
    return '可以先暂停，当前作答进度已保存在本机；准备好后再继续。';
  }

  private shown(id: string): void {
    if (this.repository.collector.active()?.pendingRequestId !== id) { return; }
    // Keep the pre-response feature preview for this request; acknowledgment is separately persisted.
    try {
      this.repository.change((c: EventCollector) => c.acknowledge(id, Date.now()));
      this.refresh();
    } catch (_) { this.notice = '提示展示记录未保存，请重试'; }
  }

  private async clearData(): Promise<void> {
    if (!this.profileAgent || this.profileBusy) { this.notice = '请先重试加载画像，再清除全部个人记录'; return; }
    this.profileBusy = true; this.ready = false;
    try {
      await this.profileAgent.beginClear();
      this.repository.clear();
      this.showProfile(await this.profileAgent.finishClear());
      this.ready = true; this.clearing = false; this.profileSignature = '';
      this.refresh(); this.notice = '学习记录、感受和成长观察已清除，相关设置已关闭';
    } catch (_) { this.notice = '清除未完成，请重试；完成前暂停画像更新'; }
    finally { this.profileBusy = false; }
  }

  @Builder
  proactiveCard() {
    Column({ space: 13 }) {
      Text('智伴同行 · 给你一个选择').fontSize(12).fontColor('#7A7468')
      Text(this.offerKind === 'rest' ? '要不要休息一会？' : '需要一点帮助吗？')
        .fontSize(22).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
      Text(this.offerKind === 'rest' ?
        '你刚才说有点累或烦躁。可以先停一停，做几次慢呼吸。' :
        '已经安静思考一会儿了。要不要看一点提示？你也可以继续自己想。')
        .fontSize(15).lineHeight(24).fontColor('#2A2A2A')
      Text(this.offerReason === 'long_pause' ?
        '你在这道题上停留了约 3 分钟。停顿也可能是在思考。' :
        '根据你刚才自己填写的感受。')
        .fontSize(12).fontColor('#7A7468')
      Button(this.offerKind === 'rest' ? '好，休息一会' : '给我一点提示')
        .width('100%').height(48).fontSize(15).fontWeight(FontWeight.Bold)
        .fontColor('#2A2106').backgroundColor('#C9A227').borderRadius(9)
        .onClick(() => { this.respondToOffer('accepted'); })
      Row({ space: 8 }) {
        Button('稍后再说').layoutWeight(1).height(43).fontColor('#1F2A44')
          .backgroundColor('#FFFFFF').borderRadius(8)
          .onClick(() => { this.respondToOffer('later'); })
        Button('不需要').layoutWeight(1).height(43).fontColor('#1F2A44')
          .backgroundColor('#FFFFFF').borderRadius(8)
          .onClick(() => { this.respondToOffer('rejected'); })
      }.width('100%')
    }.width('100%').constraintSize({ maxWidth: 420 }).padding(20).backgroundColor('#FDF8EE').borderRadius(16)
      .border({ width: 1, color: '#E6DCC4', radius: 16 })
      .alignItems(HorizontalAlign.Start)
  }

  @Builder
  guidanceDialog() {
    Column({ space: 15 }) {
      Text('学伴发来一条引导').fontSize(12).fontColor('#7A7468')
      Text(this.cardKind === 'split' ? '我们把题目拆开' :
        this.cardDepth === 2 ? '再往前走一步' : '先从这一步想起')
        .fontSize(22).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
      Row({ space: 10 }) {
        Text('伴').width(40).height(40).textAlign(TextAlign.Center).fontSize(17)
          .fontColor('#1F2A44').backgroundColor('#E6C96A').borderRadius(20)
        Text(this.cardText()).fontSize(15).lineHeight(24).fontColor('#2A2A2A')
          .layoutWeight(1).padding(13).backgroundColor('#FFFFFF').borderRadius(10)
          .border({ width: 1, color: '#E6DCC4', radius: 10 })
      }.width('100%').alignItems(VerticalAlign.Top)
      if (this.cardKind === 'hint' && this.cardDepth === 1) {
        Button('继续引导，给我下一步').width('100%').height(46)
          .fontColor('#2A2106').backgroundColor('#C9A227').borderRadius(9)
          .onClick(() => {
            this.shown(this.requestId);
            this.showRequest('hint', 2);
          })
      }
      if (this.cardKind === 'hint' && this.cardDepth === 2) {
        Button('把题目拆成步骤').width('100%').height(44)
          .fontColor('#1F2A44').backgroundColor('#F5E9C9').borderRadius(9)
          .onClick(() => {
            this.shown(this.requestId);
            this.showRequest('split');
          })
      }
      if (this.profileOn) {
        Text('这次引导有帮助吗？').fontSize(12).fontColor('#7A7468')
        Flex({ wrap: FlexWrap.Wrap }) {
          ForEach(FEEDBACK_VALUES, (value: string, index: number) => {
            Button(FEEDBACK_LABELS[index]).fontSize(12).margin(3)
              .enabled(!this.profileBusy).onClick(() => {
                this.shown(this.requestId);
                this.profileAction('feedback', value, '', this.requestId);
              })
          }, (value: string) => value)
        }
      }
      Button('和学伴聊聊').width('100%').height(44).fontColor('#1F2A44')
        .backgroundColor('#F5E9C9').onClick(() => { this.openChat(); })
      Button('我再试试').width('100%').height(44).fontColor('#1F2A44')
        .backgroundColor('#FFFFFF').borderRadius(9)
        .onClick(() => { this.shown(this.requestId); this.guidanceOpen = false; })
    }.width('100%').constraintSize({ maxWidth: 430 }).padding(20)
      .backgroundColor('#FDF8EE').borderRadius(16)
      .border({ width: 1, color: '#E6DCC4', radius: 16 })
      .alignItems(HorizontalAlign.Start)
      .onVisibleAreaChange([0.5], (visible: boolean, ratio: number) => {
        if (visible && ratio >= 0.5) { this.shown(this.requestId); }
      })
  }

  @Builder
  submissionDialog() {
    Column({ space: 14 }) {
      Text('学伴发来一条消息').fontSize(12).fontColor('#7A7468')
      Text(this.result === '本次选择正确' ? '做得好，我们回顾一下' : '我们一起看下一步')
        .fontSize(21).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
      Row({ space: 10 }) {
        Text('伴').width(40).height(40).textAlign(TextAlign.Center).fontSize(17)
          .fontColor('#1F2A44').backgroundColor('#E6C96A').borderRadius(20)
        Text(CompanionGuidance.afterSubmission(taskById(this.taskId), this.result))
          .fontSize(15).lineHeight(24).fontColor('#2A2A2A').layoutWeight(1)
          .padding(13).backgroundColor('#FFFFFF').borderRadius(10)
          .border({ width: 1, color: '#E6DCC4', radius: 10 })
      }.width('100%').alignItems(VerticalAlign.Top)
      if (this.result !== '本次选择正确') {
        Button('带我看下一步').width('100%').height(46)
          .fontColor('#2A2106').backgroundColor('#C9A227').borderRadius(9)
          .onClick(() => { this.submissionMessageOpen = false; this.showRequest('hint', 1); })
      }
      Button('我继续试试').width('100%').height(44).fontColor('#1F2A44')
        .backgroundColor('#FFFFFF').borderRadius(9)
        .onClick(() => { this.submissionMessageOpen = false; })
    }.width('100%').constraintSize({ maxWidth: 430 }).padding(20)
      .backgroundColor('#FDF8EE').borderRadius(16)
      .border({ width: 1, color: '#E6DCC4', radius: 16 })
      .alignItems(HorizontalAlign.Start)
  }

  @Builder
  tabItem(title: string, symbol: string, tab: string) {
    Button({ type: ButtonType.Normal }) {
      Column({ space: 2 }) {
        Text(symbol).fontSize(19).fontColor(this.activeTab === tab ? '#C9A227' : '#C9D3E6')
        Text(title).fontSize(11).fontColor(this.activeTab === tab ? '#E6C96A' : '#C9D3E6')
      }
    }.layoutWeight(1).height(58).backgroundColor(Color.Transparent)
      .onClick(() => { this.changeTab(tab); })
  }

  @Builder
  studyView() {
    Column({ space: 16 }) {
      Column({ space: 7 }) {
        Text('专注学习').fontSize(24).fontWeight(FontWeight.Bold).fontColor('#1F2A44')
        Text('先自己想一想，需要的时候再叫我。').fontSize(13).fontColor('#7A7468')
      }.width('100%').alignItems(HorizontalAlign.Start)
      if (!this.collectionOn || !this.proactiveOn) {
        Row({ space: 8 }) {
          Text('想试试 3 分钟主动帮助？先到设置开启学习记录和主动提醒。')
            .fontSize(12).lineHeight(19).fontColor('#27415C').layoutWeight(1)
          Button('去设置').fontSize(12).onClick(() => { this.changeTab('settings'); })
        }.width('100%').padding(12).backgroundColor('#EEF4F8').borderRadius(9)
      } else if (this.taskId && this.status === 'active' &&
        this.repository.collector.active()?.coverageComplete === false) {
        Text('本题开始时未开启学习记录。要体验主动帮助，请结束本题后重新开始一道题。')
          .fontSize(12).lineHeight(19).fontColor('#27415C').width('100%')
          .padding(12).backgroundColor('#EEF4F8').borderRadius(9)
      }
      if (!this.ready) {
        Text('学习空间正在准备，请稍后重试。').fontSize(14).fontColor('#7A7468')
      } else {
        Button('和学伴聊聊').fontColor('#1F2A44').backgroundColor('#E6C96A')
          .onClick(() => { this.openChat(); })
        Button(this.catalogOpen ? '继续学习' : '章节目录')
          .fontColor('#1F2A44').backgroundColor('#F5E9C9')
          .onClick(() => { this.catalogOpen = !this.catalogOpen; this.visibleSince = Date.now(); })
        if (this.taskId && this.status !== 'finished' && !this.catalogOpen) {
          Column({ space: 15 }) {
            Row() {
              Text(this.status === 'paused' ? '已暂停' : '进行中').fontSize(11)
                .fontColor('#2A2106').padding({ left: 10, right: 10, top: 5, bottom: 5 })
                .backgroundColor('#E6C96A').borderRadius(12)
              Blank()
              Text('数学 · 一起练习').fontSize(12).fontColor('#7A7468')
            }.width('100%')
            Text(taskById(this.taskId)?.title || '').fontSize(21).fontWeight(FontWeight.Medium)
              .fontColor('#1F2A44')
            Text(taskById(this.taskId)?.stem || '').fontSize(17).lineHeight(27).fontColor('#2A2A2A')
              .width('100%').padding(14).backgroundColor('#FBF6EA')
              .border({ width: { left: 4 }, color: '#C9A227' }).borderRadius(8)
            TextArea({ text: this.draft, placeholder: this.taskId === 'FUNC-SC-0193' ?
              '在这里写下 A、B、C 或 D' : '在这里记下你的答案或思路' })
              .height(112).fontSize(15).fontColor('#2A2A2A').maxLength(500)
              .enabled(this.status === 'active').backgroundColor('#FFFFFF').borderRadius(9)
              .border({ width: 1, color: '#E6DCC4', radius: 9 })
              .onChange((value: string) => { this.apply((c: EventCollector) => c.updateDraft(value)); })
            if (this.status === 'active') {
              Button('提交答案').width('100%').height(48).fontSize(15).fontWeight(FontWeight.Bold)
                .fontColor('#2A2106').backgroundColor('#C9A227').borderRadius(9)
                .onClick(() => { this.submitAnswer(); })
              if (this.result) {
                Row({ space: 10 }) {
                  Text('伴').width(36).height(36).textAlign(TextAlign.Center).fontSize(15)
                    .fontColor('#1F2A44').backgroundColor('#E6C96A').borderRadius(18)
                  Column({ space: 7 }) {
                    Text('学伴 · 对上次提交的回应').fontSize(11).fontColor('#7A7468')
                    Text(CompanionGuidance.afterSubmission(taskById(this.taskId), this.result))
                      .fontSize(14).lineHeight(23).fontColor('#2A2A2A')
                    if (this.result !== '本次选择正确') {
                      Button('带我看下一步').fontSize(13).fontColor('#5B6F92')
                        .backgroundColor(Color.Transparent)
                        .onClick(() => { this.showRequest('hint', 1); })
                    }
                  }.layoutWeight(1).alignItems(HorizontalAlign.Start)
                }.width('100%').alignItems(VerticalAlign.Top).padding(13)
                  .backgroundColor('#EEF4F8').borderRadius(10)
              }
              Row({ space: 8 }) {
                Button('给一点提示').layoutWeight(1).height(45).fontSize(13)
                  .fontColor('#FFFFFF').backgroundColor('#5B6F92').borderRadius(8)
                  .onClick(() => { this.showRequest('hint', 1); })
                Button('拆成小步骤').layoutWeight(1).height(45).fontSize(13)
                  .fontColor('#1F2A44').backgroundColor('#FDF8EE').borderRadius(8)
                  .border({ width: 1, color: '#1F2A44', radius: 8 })
                  .onClick(() => { this.showRequest('split'); })
              }.width('100%')
              Button('我有点累，想休息一会').width('100%').height(44).fontSize(14)
                .fontColor('#1F2A44').backgroundColor('#F5E9C9').borderRadius(8)
                .onClick(() => { this.showRequest('break'); })
              Button('记录此刻感受').fontSize(13).fontColor('#5B6F92')
                .backgroundColor(Color.Transparent)
                .onClick(() => { this.changeTab('growth'); })
              Button('暂停学习').fontSize(13).fontColor('#7A7468').backgroundColor(Color.Transparent)
                .onClick(() => { this.apply((c: EventCollector) => c.pause(Date.now())); })
            } else {
              Button('继续这道题').width('100%').height(48).fontSize(15)
                .fontColor('#2A2106').backgroundColor('#C9A227').borderRadius(9)
                .onClick(() => { this.apply((c: EventCollector) => c.resume(Date.now())); })
            }
            if (this.cardKind) {
              if (this.cardKind === 'hint' || this.cardKind === 'split') {
                Button('查看学伴上一条引导').fontSize(13).fontColor('#5B6F92')
                  .backgroundColor(Color.Transparent)
                  .onClick(() => { this.guidanceOpen = true; })
              }
              ForEach([this.requestId], (id: string) => {
                Column({ space: 10 }) {
                  Text(this.cardKind === 'break' ? '休息一下' : '一起往下想')
                    .fontSize(16).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
                  Text(this.cardText()).fontSize(15).lineHeight(24).fontColor('#3A2F1A')
                  if (this.cardKind === 'hint' && this.cardDepth === 1) {
                    Button('再给我一点提示').fontSize(13).fontColor('#5B6F92')
                      .backgroundColor(Color.Transparent).onClick(() => { this.showRequest('hint', 2); })
                  }
                  if (this.cardKind === 'break') {
                    Text('舒缓音乐以后可在这里加入；现在不会播放音频。')
                      .fontSize(12).fontColor('#7A7468')
                  }
                  if (this.profileOn && this.cardKind !== 'break') {
                    Text('这次帮助对你有用吗？').fontSize(13).fontColor('#7A7468')
                    Flex({ wrap: FlexWrap.Wrap }) {
                      ForEach(FEEDBACK_VALUES, (value: string, index: number) => {
                        Button(FEEDBACK_LABELS[index]).fontSize(12).margin(3)
                          .enabled(!this.profileBusy).onClick(() => {
                            this.profileAction('feedback', value, '', id);
                          })
                      }, (value: string) => value)
                    }
                  }
                }.width('100%').padding(14).backgroundColor('#FBF3D9').borderRadius(9)
                  .border({ width: 1, color: '#C9A227', radius: 9 })
                  .alignItems(HorizontalAlign.Start)
                  .onVisibleAreaChange([0.5], (visible: boolean, ratio: number) => {
                    if (visible && ratio >= 0.5) { this.shown(id); }
                  })
              }, (id: string) => id)
            }
            Button('结束本次学习').fontSize(13).fontColor('#7A7468')
              .backgroundColor(Color.Transparent)
              .onClick(() => { this.apply((c: EventCollector) => c.finish(Date.now())); })
          }.width('100%').padding(18).backgroundColor('#FDF8EE').borderRadius(14)
            .border({ width: 1, color: '#E6DCC4', radius: 14 }).alignItems(HorizontalAlign.Start)
        }
        if (this.catalogOpen || !this.taskId || this.status === 'finished') {
          Column({ space: 10 }) {
            Text('章节目录')
              .fontSize(19).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
            ForEach(LEARNING_TASKS, (task: LearningTask) => {
              Row({ space: 12 }) {
                Text('✎').fontSize(18).fontColor('#C9A227')
                Column({ space: 5 }) {
                  Text(task.title).fontSize(16).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
                  Text('数学 · 专项练习').fontSize(12).fontColor('#7A7468')
                }.alignItems(HorizontalAlign.Start).layoutWeight(1)
                Text('›').fontSize(21).fontColor('#C9A227')
              }.width('100%').padding(14).backgroundColor('#FFFFFF').borderRadius(10)
                .border({ width: 1, color: '#E6DCC4', radius: 10 })
                .onClick(() => {
                  if (this.taskId && this.status !== 'finished') {
                    if (this.taskId !== task.id) {
                      this.notice = '请先继续并结束当前学习，再选择其他内容。';
                      return;
                    }
                  } else {
                    this.apply((c: EventCollector) => c.start(task.id, Date.now()));
                  }
                  this.catalogOpen = false;
                  this.visibleSince = Date.now();
                })
            }, (task: LearningTask) => task.id)
          }.width('100%').padding(18).backgroundColor('#FDF8EE').borderRadius(14)
            .alignItems(HorizontalAlign.Start)
        }
      }
      Text('你可以随时求助、暂停，或选择不接受学伴的建议。')
        .fontSize(12).fontColor('#C9D3E6').lineHeight(18)
    }.width('100%').alignItems(HorizontalAlign.Start)
  }

  @Builder
  growthDimension(title: string, dimension: string) {
    Column({ space: 10 }) {
      Text(title).fontSize(17).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
      if (this.profileItems.filter((o: ProfileObservation) => o.dimension === dimension).length === 0) {
        Text('还没有足够的信息，慢慢来。').fontSize(13).fontColor('#7A7468')
      }
      ForEach(this.profileItems.filter((o: ProfileObservation) => o.dimension === dimension),
        (o: ProfileObservation) => {
          Column({ space: 8 }) {
            Text(o.description).fontSize(14).lineHeight(22).fontColor('#2A2A2A')
            Text(o.status === 'USER_CONFIRMED' ? '来自你的自述' :
              o.status === 'SUPPORTED' ? '来自多次学习记录' : '仍在了解中')
              .fontSize(11).fontColor('#7A7468')
            if (o.evidenceIds.length) {
              Button('这条不符合我').fontSize(12).fontColor('#5B6F92')
                .backgroundColor(Color.Transparent).enabled(!this.profileBusy)
                .onClick(() => { this.profileAction('correct', '', '', o.id); })
            }
          }.width('100%').padding(12).backgroundColor('#FFFFFF').borderRadius(9)
            .border({ width: 1, color: '#E6DCC4', radius: 9 })
            .alignItems(HorizontalAlign.Start)
        }, (o: ProfileObservation) => o.id)
    }.width('100%').padding(16).backgroundColor('#FDF8EE').borderRadius(14)
      .alignItems(HorizontalAlign.Start)
  }

  @Builder
  growthView() {
    Column({ space: 16 }) {
      Text('我的成长').fontSize(24).fontWeight(FontWeight.Bold).fontColor('#1F2A44')
      Text('只记录有依据的变化，你也可以随时纠正。').fontSize(13).fontColor('#7A7468')
      Column({ space: 12 }) {
        Row() {
          Text('更新我的成长记录').fontSize(16).fontWeight(FontWeight.Medium)
            .fontColor('#1F2A44').layoutWeight(1)
          Toggle({ type: ToggleType.Switch, isOn: this.profileOn })
            .enabled(this.profileAvailable && !this.profileBusy)
            .onChange((value: boolean) => { this.profileAction('enable', value ? 'true' : 'false'); })
        }.width('100%')
        Text('开启后，用你允许保存的学习过程与主动填写的感受更新记录。')
          .fontSize(12).lineHeight(20).fontColor('#7A7468')
        if (!this.profileAvailable) {
          Button('重新载入成长记录').fontSize(13).onClick(() => {
            this.initializeProfile(this.getUIContext().getHostContext() as common.UIAbilityContext);
          })
        }
      }.width('100%').padding(16).backgroundColor('#FDF8EE').borderRadius(14)
        .alignItems(HorizontalAlign.Start)
      if (this.profileOn) {
        if (this.taskId && this.status === 'active') {
          Column({ space: 10 }) {
            Text('此刻感觉怎么样？').fontSize(17).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
            Text('由你自己选择；学伴不会把沉默当成疲惫或焦躁。')
              .fontSize(12).fontColor('#7A7468')
            Flex({ wrap: FlexWrap.Wrap }) {
              ForEach(REPORT_OPTIONS, (option: ReportOption) => {
                Button(option.label).fontSize(13).margin(3).enabled(!this.profileBusy)
                  .fontColor('#1F2A44').backgroundColor('#F5E9C9').borderRadius(8)
                  .onClick(() => { this.profileAction('report', option.value, option.facet); })
              }, (option: ReportOption) => `${option.facet}:${option.value}`)
            }
          }.width('100%').padding(16).backgroundColor('#FDF8EE').borderRadius(14)
            .alignItems(HorizontalAlign.Start)
        }
        this.growthDimension('知识理解', 'knowledge')
        this.growthDimension('情绪与性格', 'emotion_personality')
        this.growthDimension('学习态度与习惯', 'learning_attitude_habits')
      } else {
        Text('开启后，这里会逐步呈现你的成长观察。')
          .fontSize(14).fontColor('#7A7468').width('100%').padding(18)
          .backgroundColor('#FDF8EE').borderRadius(14)
      }
    }.width('100%').alignItems(HorizontalAlign.Start)
  }

  @Builder
  settingsView() {
    Column({ space: 16 }) {
      Text('我的选择').fontSize(24).fontWeight(FontWeight.Bold).fontColor('#1F2A44')
      Text('由你决定学伴可以记住什么、何时主动开口。').fontSize(13).fontColor('#7A7468')
      Column({ space: 15 }) {
        Row() {
          Column({ space: 5 }) {
            Text('记录应用内学习过程').fontSize(16).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
            Text('作答、求助和暂停等记录只保存在本机').fontSize(12).fontColor('#7A7468')
          }.alignItems(HorizontalAlign.Start).layoutWeight(1)
          Toggle({ type: ToggleType.Switch, isOn: this.collectionOn }).enabled(this.ready)
            .onChange((value: boolean) => { this.apply((c: EventCollector) => c.setCollection(value)); })
        }.width('100%')
        Row() {
          Column({ space: 5 }) {
            Text('允许学伴主动提醒').fontSize(16).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
            Text('思考停顿满 3 分钟时询问是否需要帮助').fontSize(12).fontColor('#7A7468')
          }.alignItems(HorizontalAlign.Start).layoutWeight(1)
          Toggle({ type: ToggleType.Switch, isOn: this.proactiveOn }).enabled(this.ready)
            .onChange((value: boolean) => { this.apply((c: EventCollector) => c.setProactive(value)); })
        }.width('100%')
        Text('请在开始新题前开启学习记录和主动提醒。休息建议只在你主动填写疲惫或烦躁时出现；两种建议都可以拒绝。')
          .fontSize(12).lineHeight(20).fontColor('#7A7468')
      }.width('100%').padding(18).backgroundColor('#FDF8EE').borderRadius(14)
        .alignItems(HorizontalAlign.Start)
      Column({ space: 10 }) {
        Text('管理本机记录').fontSize(17).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
        Text('清除后，题目进度、学习记录、自报和成长观察将无法找回。')
          .fontSize(12).lineHeight(20).fontColor('#7A7468')
        if (this.clearing) {
          Button('确认清除').width('100%').height(45).fontColor('#FFFFFF')
            .backgroundColor('#B23A3A').enabled(!this.profileBusy)
            .onClick(() => { this.clearData(); })
          Button('保留记录').fontColor('#1F2A44').backgroundColor(Color.Transparent)
            .onClick(() => { this.clearing = false; })
        } else {
          Button('清除我的学习记录').width('100%').height(45).fontColor('#B23A3A')
            .backgroundColor('#FFFFFF').borderRadius(8)
            .border({ width: 1, color: '#B23A3A', radius: 8 })
            .onClick(() => { this.clearing = true; })
        }
      }.width('100%').padding(18).backgroundColor('#FDF8EE').borderRadius(14)
        .alignItems(HorizontalAlign.Start)
    }.width('100%').alignItems(HorizontalAlign.Start)
  }

  build() {
    Stack({ alignContent: Alignment.Center }) {
      Column() {
        Row({ space: 12 }) {
          Button('‹').width(42).height(42).fontSize(28).fontColor('#FDF8EE')
            .backgroundColor(Color.Transparent).onClick(() => { this.getUIContext().getRouter().back(); })
          Column({ space: 3 }) {
            Text('智伴同行').fontSize(21).fontWeight(FontWeight.Bold).fontColor('#E6C96A')
            Text('你的专注学习空间').fontSize(11).fontColor('#C9D3E6')
          }.alignItems(HorizontalAlign.Start)
          Blank()
          Text('✦').fontSize(24).fontColor('#E6C96A')
        }.width('100%').height(66).padding({ left: 10, right: 20 })
        Scroll() {
          Column({ space: 15 }) {
            if (this.notice) {
              Text(this.notice).fontSize(13).fontColor('#27415C').width('100%')
                .padding(12).backgroundColor('#EEF4F8').borderRadius(8)
            }
            if (this.activeTab === 'study') { this.studyView() }
            else if (this.activeTab === 'growth') { this.growthView() }
            else { this.settingsView() }
          }.width('100%').constraintSize({ maxWidth: 720 }).padding({ left: 16, right: 16, top: 18, bottom: 24 })
        }.layoutWeight(1).width('100%').backgroundColor('#F7F1E5')
          .scrollBar(BarState.Off).align(Alignment.Top)
        Row() {
          this.tabItem('学习', '✎', 'study')
          this.tabItem('成长', '✦', 'growth')
          this.tabItem('设置', '⚙', 'settings')
        }.width('100%').height(64).backgroundColor('#1F2A44')
      }.width('100%').height('100%').backgroundColor('#1F2A44')
      if (this.offerId && !this.offerResponse && this.status === 'active') {
        Column() {
          this.proactiveCard()
        }.width('100%').height('100%').padding(24).backgroundColor('#AA141B2D')
          .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
      }
      if (this.guidanceOpen && (this.cardKind === 'hint' || this.cardKind === 'split') &&
        this.status === 'active') {
        Column() {
          this.guidanceDialog()
        }.width('100%').height('100%').padding(20).backgroundColor('#AA141B2D')
          .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
      }
      if (this.submissionMessageOpen && this.status === 'active') {
        Column() {
          this.submissionDialog()
        }.width('100%').height('100%').padding(20).backgroundColor('#AA141B2D')
          .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
      }
    }.width('100%').height('100%')
  }
}
