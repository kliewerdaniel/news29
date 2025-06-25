'use server'

import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'

interface Persona {
  name: string;
  traits: string[] | Record<string, number>;
  slug: string;
}

export interface SimilarityResult {
  source: string;
  target: string;
  similarity: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const aMagnitude = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const bMagnitude = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (aMagnitude * bMagnitude);
}

function normalizeTraits(traits: string[] | Record<string, number>): Record<string, number> {
  if (Array.isArray(traits)) {
    return traits.reduce((acc, trait) => {
      acc[trait] = 1;
      return acc;
    }, {} as Record<string, number>);
  }
  return traits;
}

export async function computePersonaSimilarities(): Promise<SimilarityResult[]> {
  const personasDir = path.join(process.cwd(), 'data/personas');
  const personas: Persona[] = [];

  try {
    const slugs = await fs.readdir(personasDir);

    for (const slug of slugs) {
      const personaDir = path.join(personasDir, slug);
      const stat = await fs.stat(personaDir);
      
      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(personaDir);
      const yamlFiles = files.filter(file => file.endsWith('.yaml'));
      
      if (yamlFiles.length === 0) continue;

      // Get latest version
      yamlFiles.sort().reverse();
      const latestVersion = yamlFiles[0];
      
      const content = await fs.readFile(
        path.join(personaDir, latestVersion),
        'utf-8'
      );
      
      const data = yaml.load(content) as any;
      personas.push({
        name: data.name,
        traits: data.traits,
        slug
      });
    }

    // Compute similarities between all pairs
    const similarities: SimilarityResult[] = [];
    
    for (let i = 0; i < personas.length; i++) {
      for (let j = i + 1; j < personas.length; j++) {
        const persona1 = personas[i];
        const persona2 = personas[j];

        // Normalize trait representations
        const traits1 = normalizeTraits(persona1.traits);
        const traits2 = normalizeTraits(persona2.traits);

        // Get all unique trait keys
        const allTraits = new Set([
          ...Object.keys(traits1),
          ...Object.keys(traits2)
        ]);

        // Convert to vectors
        const vector1: number[] = [];
        const vector2: number[] = [];

        allTraits.forEach(trait => {
          vector1.push(traits1[trait] || 0);
          vector2.push(traits2[trait] || 0);
        });

        // Calculate similarity
        const similarity = cosineSimilarity(vector1, vector2);

        similarities.push({
          source: persona1.slug,
          target: persona2.slug,
          similarity
        });
      }
    }

    return similarities;
  } catch (error) {
    console.error('Error computing similarities:', error);
    return [];
  }
}
