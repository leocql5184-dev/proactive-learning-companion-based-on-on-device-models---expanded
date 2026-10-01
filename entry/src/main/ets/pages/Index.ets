import { common } from '@kit.AbilityKit';
import { LearningFileStore } from '../learning/LearningFileStore';
import { LearningRepository } from '../learning/LearningRepository';
import { LearningSession, taskById } from '../learning/LearningTypes';

@Entry
@Component
struct Index {
  private repository: LearningRepository = new LearningRepository(new LearningFileStore());
  @State currentTitle: string = '';
  @State currentStatus: string = '';
  @State notice: string = '';

  aboutToAppear(): void { this.loadProgress(); }
  onPageShow(): void { this.loadProgress(); }

  private loadProgress(): void {
    try {
      const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
      const store = new LearningFileStore();
      store.configure(context.filesDir);
      this.repository = new LearningRepository(store);
      this.repository.load();
      const session: LearningSession | undefined = this.repository.collector.active();
      this.currentTitle = session && session.status !== 'finished' ? taskById(session.taskId)?.title || '' : '';
      this.currentStatus = session ? session.status : '';
    } catch (_) { this.notice = '学习进度暂时无法读取，请稍后再试。'; }
  }

  private openWorkspace(section: string = 'study'): void {
    this.getUIContext().getRouter().pushUrl({ url: 'pages/LearningWorkspace', params: { section: section } })
      .catch(() => { this.notice = '学习空间暂时无法打开，请重试。'; });
  }

  @Builder
  companionMark() {
    Stack() {
      Circle().width(70).height(70).fill('#E6C96A')
      Row({ space: 13 }) {
        Circle().width(7).height(10).fill('#1F2A44')
        Circle().width(7).height(10).fill('#1F2A44')
      }.translate({ y: -7 })
      Text('⌣').fontSize(27).fontColor('#1F2A44').translate({ y: 15 })
    }.width(76).height(76).borderRadius(38).backgroundColor('#C9A227')
      .border({ width: 3, color: '#FDF8EE', radius: 38 })
  }

  @Builder
  entryCard(label: string, detail: string, symbol: string, section: string) {
    Row({ space: 14 }) {
      Text(symbol).fontSize(23).fontColor('#1F2A44').width(46).height(46)
        .textAlign(TextAlign.Center).backgroundColor('#F5E9C9').borderRadius(12)
      Column({ space: 5 }) {
        Text(label).fontSize(17).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
        Text(detail).fontSize(12).fontColor('#7A7468').maxLines(2)
      }.alignItems(HorizontalAlign.Start).layoutWeight(1)
      Text('›').fontSize(24).fontColor('#C9A227')
    }.width('100%').padding(16).backgroundColor('#FFFFFF').borderRadius(12)
      .border({ width: 1, color: '#E6DCC4', radius: 12 }).onClick(() => { this.openWorkspace(section); })
  }

  build() {
    Scroll() {
      Column({ space: 18 }) {
        Column({ space: 7 }) {
          Text('智伴同行').fontSize(30).fontWeight(FontWeight.Bold).fontColor('#E6C96A').letterSpacing(2)
          Text('动态懂你，主动相伴').fontSize(13).fontColor('#C9D3E6')
        }.width('100%').padding({ top: 28, bottom: 12 })
        Column({ space: 20 }) {
          Row({ space: 15 }) {
            this.companionMark()
            Column({ space: 8 }) {
              Text('今天，从哪一步开始？').fontSize(22).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
              Text('遇到难题时，我会陪你拆开来想。').fontSize(13).fontColor('#7A7468').lineHeight(20)
            }.alignItems(HorizontalAlign.Start).layoutWeight(1)
          }.width('100%')
          Column({ space: 9 }) {
            Text(this.currentTitle ? '继续上次的学习' : '开始一段专注学习')
              .fontSize(12).fontColor('#7A7468')
            Text(this.currentTitle || '选一道题，按自己的节奏试一试')
              .fontSize(19).fontWeight(FontWeight.Medium).fontColor('#1F2A44')
            if (this.currentTitle) {
              Text(this.currentStatus === 'paused' ? '上次已暂停，作答进度还在' : '你的作答进度已保存')
                .fontSize(12).fontColor('#7A7468')
            }
          }.width('100%').alignItems(HorizontalAlign.Start).padding(16)
            .backgroundColor('#FFFFFF').borderRadius(12)
            .border({ width: 1, color: '#E6DCC4', radius: 12 })
          Button(this.currentTitle ? '继续学习' : '开始学习')
            .width('100%').height(50).fontSize(16).fontWeight(FontWeight.Bold)
            .fontColor('#2A2106').backgroundColor('#C9A227').borderRadius(9)
            .onClick(() => { this.openWorkspace(); })
        }.width('100%').padding(20).backgroundColor('#FDF8EE').borderRadius(16)
          .border({ width: 1, color: '#E6DCC4', radius: 16 })
          .shadow({ radius: 22, color: '#35000000', offsetY: 8 })
        Text('你的学习空间').fontSize(17).fontWeight(FontWeight.Medium).fontColor('#FDF8EE')
          .width('100%').margin({ top: 5 })
        this.entryCard('章节目录', '按知识点选择今天的学习内容', '✎', 'catalog')
        this.entryCard('成长记录', '看看自己的理解、状态与学习习惯', '✦', 'growth')
        this.entryCard('我的选择', '决定是否记录学习过程和主动提醒', '⚙', 'settings')
        if (this.notice) { Text(this.notice).fontSize(13).fontColor('#FDF8EE') }
        Text('学习进度保存在这台设备上').fontSize(12).fontColor('#C9D3E6')
          .width('100%').textAlign(TextAlign.Center).margin({ top: 8, bottom: 20 })
      }.width('100%').constraintSize({ maxWidth: 680 }).padding({ left: 16, right: 16 })
    }.width('100%').height('100%').backgroundColor('#1F2A44').scrollBar(BarState.Off)
      .align(Alignment.Top)
  }
}
