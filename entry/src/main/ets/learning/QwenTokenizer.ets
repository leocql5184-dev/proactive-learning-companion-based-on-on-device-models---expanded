import { util } from '@kit.ArkTS';

export interface QwenTokenizerSpec {
  pre: string;
  tokens: string[];
  types: number[];
  merges: string[];
}

/** Same Qwen2 byte BPE as the verified desktop tokenizer. No inference here. */
export class QwenTokenizer {
  private tokens: string[];
  private vocab: Map<string, number> = new Map<string, number>();
  private ranks: Map<string, number> = new Map<string, number>();
  private special: Map<string, number> = new Map<string, number>();
  private encoder: string[] = [];
  private decoder: Map<string, number> = new Map<string, number>();
  private utf8: util.TextEncoder = new util.TextEncoder();
  private pattern: RegExp = /'(?:[sS]|[tT]|[rR][eE]|[vV][eE]|[mM]|[lL][lL]|[dD])|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/gu;
  private specialPattern: RegExp;

  constructor(spec: QwenTokenizerSpec) {
    if (spec.pre !== 'qwen2' || spec.tokens.length !== 151936 || spec.types.length !== spec.tokens.length) {
      throw new Error('TOKENIZER_VERSION_MISMATCH');
    }
    this.tokens = spec.tokens;
    spec.tokens.forEach((token: string, index: number) => {
      this.vocab.set(token, index);
      if (spec.types[index] === 3 || spec.types[index] === 4) { this.special.set(token, index); }
    });
    spec.merges.forEach((pair: string, index: number) => { this.ranks.set(pair, index); });
    const bytes: number[] = [];
    for (let i = 33; i < 127; i++) { bytes.push(i); }
    for (let i = 161; i < 173; i++) { bytes.push(i); }
    for (let i = 174; i < 256; i++) { bytes.push(i); }
    const chars = bytes.slice();
    for (let i = 0; i < 256; i++) {
      if (bytes.indexOf(i) === -1) { bytes.push(i); chars.push(256 + chars.length - 188); }
    }
    bytes.forEach((value: number, index: number) => {
      const character = String.fromCharCode(chars[index]);
      this.encoder[value] = character;
      this.decoder.set(character, value);
    });
    const specials = Array.from(this.special.keys()).sort((a: string, b: string) => b.length - a.length);
    this.specialPattern = new RegExp('(' + specials.map((token: string) =>
      token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  }

  encode(text: string, parseSpecial: boolean = false): Int32Array {
    const output: number[] = [];
    const chunks: string[] = parseSpecial ? text.split(this.specialPattern) : [text];
    chunks.forEach((chunk: string) => {
      const specialId = parseSpecial ? this.special.get(chunk) : undefined;
      if (specialId !== undefined) { output.push(specialId); return; }
      const pieces: string[] = chunk.match(this.pattern) || [];
      pieces.forEach((piece: string) => {
        const parts: string[] = [];
        this.utf8.encodeInto(piece).forEach((byte: number) => { parts.push(this.encoder[byte]); });
        while (parts.length > 1) {
          let bestRank = Number.POSITIVE_INFINITY;
          let bestIndex = -1;
          for (let i = 0; i < parts.length - 1; i++) {
            const rank = this.ranks.get(parts[i] + ' ' + parts[i + 1]);
            if (rank !== undefined && rank < bestRank) { bestRank = rank; bestIndex = i; }
          }
          if (bestIndex === -1) { break; }
          parts.splice(bestIndex, 2, parts[bestIndex] + parts[bestIndex + 1]);
        }
        parts.forEach((part: string) => {
          const id = this.vocab.get(part);
          if (id === undefined) { throw new Error('TOKENIZER_UNKNOWN_BYTE'); }
          output.push(id);
        });
      });
    });
    return new Int32Array(output);
  }

  decode(ids: Int32Array): string {
    const bytes: number[] = [];
    ids.forEach((id: number) => {
      const token = this.tokens[id];
      if (token === undefined) { throw new Error('INVALID_TOKEN_ID'); }
      if (this.special.has(token)) {
        this.utf8.encodeInto(token).forEach((byte: number) => { bytes.push(byte); });
      } else {
        for (let i = 0; i < token.length; i++) {
          const byte = this.decoder.get(token[i]);
          if (byte === undefined) { throw new Error('INVALID_TOKEN_BYTE'); }
          bytes.push(byte);
        }
      }
    });
    return new util.TextDecoder('utf-8').decodeWithStream(new Uint8Array(bytes));
  }
}
