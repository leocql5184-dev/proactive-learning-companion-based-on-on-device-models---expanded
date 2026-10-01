export const generate: (modelDirectory: string, tokens: Int32Array) => Promise<Int32Array>;
export const progress: () => Int32Array;
export const cancel: () => void;
