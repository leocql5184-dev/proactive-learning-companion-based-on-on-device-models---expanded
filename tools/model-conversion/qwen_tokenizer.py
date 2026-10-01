"""Qwen2 byte-level BPE using tokenizer metadata exported from the source GGUF.

No model inference or network requests occur in this module.
"""
import json
from pathlib import Path
import regex


class Tokenizer:
    def __init__(self, path):
        spec = json.loads(Path(path).read_text(encoding='utf-8'))
        if spec['pre'] != 'qwen2':
            raise ValueError('Unsupported pre-tokenizer')
        self.tokens = spec['tokens']
        self.vocab = {s: i for i, s in enumerate(self.tokens)}
        self.ranks = {tuple(s.split(' ')): i for i, s in enumerate(spec['merges'])}
        self.special = {s: i for i, (s, t) in enumerate(zip(self.tokens, spec['types'])) if t in (3, 4)}
        values = list(range(33, 127)) + list(range(161, 173)) + list(range(174, 256))
        chars = list(values)
        for b in range(256):
            if b not in values:
                values.append(b)
                chars.append(256 + len(chars) - 188)
        self.encoder = dict(zip(values, map(chr, chars)))
        self.decoder = {v: k for k, v in self.encoder.items()}
        self.pattern = regex.compile(r"(?i:'s|'t|'re|'ve|'m|'ll|'d)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+")
        self.special_pattern = regex.compile('(' + '|'.join(regex.escape(s) for s in sorted(self.special, key=len, reverse=True)) + ')')

    def encode(self, text, parse_special=False):
        result = []
        chunks = self.special_pattern.split(text) if parse_special else [text]
        for chunk in chunks:
            if parse_special and chunk in self.special:
                result.append(self.special[chunk])
                continue
            for piece in self.pattern.findall(chunk):
                parts = [self.encoder[b] for b in piece.encode('utf-8')]
                while len(parts) > 1:
                    candidates = [(self.ranks.get((parts[i], parts[i+1]), float('inf')), i)
                                  for i in range(len(parts)-1)]
                    rank, index = min(candidates)
                    if rank == float('inf'):
                        break
                    parts[index:index+2] = [parts[index] + parts[index+1]]
                result.extend(self.vocab[p] for p in parts)
        return result

    def decode(self, ids):
        output = bytearray()
        for i in ids:
            token = self.tokens[i]
            if token in self.special:
                output.extend(token.encode('utf-8'))
            else:
                output.extend(self.decoder[c] for c in token)
        return output.decode('utf-8', errors='replace')

    def chat(self, question):
        # Encode user text separately so literal control tokens cannot create roles.
        prefix = '<|im_start|>user\n'
        suffix = '<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n'
        return self.encode(prefix, True) + self.encode(question + ' /no_think') + self.encode(suffix, True)


if __name__ == '__main__':
    import sys
    from export_qwen import ROOT, GGUFReader
    reader = GGUFReader(str(ROOT/'models/qwen3/Qwen3-0.6B-Q8_0.gguf'))
    output = Path(sys.argv[1])
    output.write_text(json.dumps({
        'pre': reader.fields['tokenizer.ggml.pre'].contents(),
        'tokens': reader.fields['tokenizer.ggml.tokens'].contents(),
        'types': reader.fields['tokenizer.ggml.token_type'].contents(),
        'merges': reader.fields['tokenizer.ggml.merges'].contents(),
    }, ensure_ascii=False), encoding='utf-8')
    print(output)
