declare module 'tsne-js' {
  interface TSNEOptions {
    dim: number;
    perplexity: number;
    earlyExaggeration: number;
    learningRate: number;
    nIter: number;
    metric: string;
  }

  interface InitOptions {
    data: number[][];
    type: 'dense';
  }

  class TSNE {
    constructor(options: TSNEOptions);
    init(options: InitOptions): void;
    run(): void;
    getOutput(): number[][];
  }

  export = TSNE;
}
