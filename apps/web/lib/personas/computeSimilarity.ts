import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { tsne } from '@tensorflow/tfjs-tsne';
import * as tf from '@tensorflow/tfjs';

// Types
export type Persona = {
  name: string;
  slug: string;
  traits: Record<string, number>;
};

export type PersonaNode = {
  id: string;
  position: { x: number; y: number };
  data: {
    label: string;
    persona: Persona;
  };
};

/**
 * Load all persona files from the data/personas directory
 */
export async function loadPersonas(): Promise<Persona[]> {
  const personasDir = path.join(process.cwd(), 'data/personas');
  const personas: Persona[] = [];
  
  try {
    const entries = fs.readdirSync(personasDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Find the latest version in this directory
        const versions = fs.readdirSync(path.join(personasDir, entry.name))
          .filter(file => file.endsWith('.yaml'))
          .sort();
        
        if (versions.length > 0) {
          const latestVersion = versions[versions.length - 1];
          const filePath = path.join(personasDir, entry.name, latestVersion);
          const content = fs.readFileSync(filePath, 'utf8');
          const data = yaml.load(content) as any;
          
          if (data.name && data.traits) {
            personas.push({
              name: data.name,
              slug: entry.name,
              traits: data.traits
            });
          }
        }
      } else if (entry.name.endsWith('.yaml')) {
        // Handle top-level YAML files
        const filePath = path.join(personasDir, entry.name);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content) as any;
        
        if (data.name && data.traits) {
          personas.push({
            name: data.name,
            slug: entry.name.replace('.yaml', ''),
            traits: data.traits
          });
        }
      }
    }
  } catch (error) {
    console.error('Error loading personas:', error);
    return [];
  }
  
  return personas;
}

/**
 * Convert traits to vectors and compute similarity matrix
 */
export function computeSimilarityMatrix(personas: Persona[]): number[][] {
  // Get all unique trait names
  const allTraits = new Set<string>();
  personas.forEach(persona => {
    Object.keys(persona.traits).forEach(trait => allTraits.add(trait));
  });
  const traitsList = Array.from(allTraits);

  // Convert personas to vectors
  const vectors = personas.map(persona => {
    return traitsList.map(trait => persona.traits[trait] || 0);
  });

  // Compute cosine similarity matrix
  const matrix: number[][] = [];
  for (let i = 0; i < vectors.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < vectors.length; j++) {
      matrix[i][j] = cosineSimilarity(vectors[i], vectors[j]);
    }
  }

  return matrix;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Project personas into 2D space using t-SNE
 */
export async function computePositions(personas: Persona[]): Promise<PersonaNode[]> {
  // Convert traits to vectors like before
  const allTraits = new Set<string>();
  personas.forEach(persona => {
    Object.keys(persona.traits).forEach(trait => allTraits.add(trait));
  });
  const traitsList = Array.from(allTraits);

  const vectors = personas.map(persona => {
    return traitsList.map(trait => persona.traits[trait] || 0);
  });

  // Convert to tensor
  const tensorData = tf.tensor2d(vectors);
  
  // Initialize t-SNE
  const tsneModel = tsne(tensorData);
  
  // Run t-SNE
  await tsneModel.iterate(1000);
  
  // Get 2D coordinates
  const positions = await tsneModel.coordinates();
  
  // Scale positions to reasonable ranges (e.g., 0-1000)
  const scaleFactor = 1000;
  
  // Create nodes for ReactFlow
  return personas.map((persona, i) => ({
    id: persona.slug,
    position: {
      x: positions[i][0] * scaleFactor,
      y: positions[i][1] * scaleFactor
    },
    data: {
      label: persona.name,
      persona: persona
    }
  }));
}
