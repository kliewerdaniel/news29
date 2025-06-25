import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import TSNE from "tsne-js";
import { embedText } from "@/lib/llm";

interface Point {
  x: number;
  y: number;
  label: string;
}

export function useTSNE(texts: string[]) {
  const [points, setPoints] = useState<Point[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function performTSNE() {
      if (!texts.length) return;
      
      setIsLoading(true);
      try {
        // Get embeddings for all texts
        const embeddings = await Promise.all(texts.map(embedText));

        // Configure and run TSNE
        const tsne = new TSNE({
          dim: 2,
          perplexity: 10,
          earlyExaggeration: 4.0,
          learningRate: 100,
          nIter: 500
        });

        tsne.init({
          data: embeddings,
          type: 'dense'
        });

        tsne.run();
        const result = tsne.getOutputScaled();

        // Convert to points with labels
        const newPoints = result.map((coords: number[], i: number) => ({
          x: coords[0],
          y: coords[1],
          label: texts[i].substring(0, 50) + "..." // First 50 chars as label
        }));

        setPoints(newPoints);
      } catch (error) {
        console.error("TSNE Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    performTSNE();
  }, [texts]);

  return { points, isLoading };
}
