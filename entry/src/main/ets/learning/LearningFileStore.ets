import { fileIo as fs } from '@kit.CoreFileKit';
import { LearningStore } from './LearningRepository';

export class LearningFileStore implements LearningStore {
  private path: string = '';
  configure(filesDir: string): void { this.path = `${filesDir}/learning-behavior-v1.json`; }
  read(): string {
    if (!this.path) { throw new Error('学习存储未配置'); }
    // Pending is never used for recovery: after a crash, only the committed snapshot is authoritative.
    try {
      if (!fs.accessSync(this.path)) { return ''; }
      return fs.readTextSync(this.path);
    } catch (_) { throw new Error('学习记录读取失败'); }
  }
  write(value: string): void {
    if (!this.path) { throw new Error('学习存储未配置'); }
    const pending = `${this.path}.pending`;
    try {
      const file = fs.openSync(pending, fs.OpenMode.CREATE | fs.OpenMode.WRITE_ONLY | fs.OpenMode.TRUNC);
      try { fs.writeSync(file.fd, value); fs.fsyncSync(file.fd); } finally { fs.closeSync(file); }
      fs.renameSync(pending, this.path);
    } catch (_) {
      try { if (fs.accessSync(pending)) { fs.unlinkSync(pending); } } catch (_) { /* Never restore a pending file. */ }
      throw new Error('学习记录保存失败，请重试');
    }
  }
}
