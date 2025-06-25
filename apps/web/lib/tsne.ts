import TSNE from 'tsne-js';

export async function embedAndCluster(vectors: number[][]): Promise<number[][]> {
  const model = new TSNE({
    dim: 2,
    perplexity: 30.0,
    earlyExaggeration: 4.0,
    learningRate: 100.0,
    nIter: 1000,
    metric: 'euclidean'
  });

  // Initialize model with input data
  model.init({
    data: vectors,
    type: 'dense'
  });

  // Run t-SNE iterations
  model.run();

  // Get output coordinates (n_samples x 2 matrix)
  const output = model.getOutput();
  
  // Convert to array of [x, y] coordinates
  return output.map((point: number[]) => [point[0], point[1]]);
}
