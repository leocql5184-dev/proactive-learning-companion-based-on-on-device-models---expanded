import { fileIo as fs } from '@kit.CoreFileKit';

// Small local UI snapshot; replace with the learning-domain repository in a later phase.
export class ChatStorage {
  private path: string = '';
  configure(filesDir: string): void { this.path = `${filesDir}/learning-chat-ui.json`; }
  read(): string {
    try {
      if (!this.path || !fs.accessSync(this.path)) { return ''; }
      return fs.readTextSync(this.path);
    } catch (_) { throw new Error('Could not read local conversations'); }
  }
  write(text: string): void {
    if (!this.path) { throw new Error('Local storage is not ready'); }
    try {
      const pending = `${this.path}.pending`;
      const file = fs.openSync(pending, fs.OpenMode.CREATE | fs.OpenMode.WRITE_ONLY | fs.OpenMode.TRUNC);
      try { fs.writeSync(file.fd, text); } finally { fs.closeSync(file); }
      fs.renameSync(pending, this.path);
    } catch (_) { throw new Error('Could not save local conversations'); }
  }
}
