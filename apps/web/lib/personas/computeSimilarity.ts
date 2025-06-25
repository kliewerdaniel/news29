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

interface Position {
  x: number;
  y: number;
  id: string;
  name: string;
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

export async function loadPersonas(): Promise<Persona[]> {
  const personas: Persona[] = [];
  const personasDir = path.join(process.cwd(), 'data/personas');

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
      
      const data = yaml.load(content) as { name: string; traits: string[] | Record<string, number> };
      personas.push({
        name: data.name,
        traits: data.traits,
        slug
      });
    }

    return personas;
  } catch (error) {
    console.error('Error loading personas:', error);
    return [];
  }
}

export function computePositions(similarities: SimilarityResult[]): Position[] {
  // Create a map of all unique persona IDs
  const personaIds = new Set<string>();
  similarities.forEach(s => {
    personaIds.add(s.source);
    personaIds.add(s.target);
  });

  // Initialize positions around a circle
  const positions: Position[] = Array.from(personaIds).map((id, i) => {
    const angle = (2 * Math.PI * i) / personaIds.size;
    return {
      id,
      x: Math.cos(angle) * 100 + 200, // Center at 200,200 with radius 100
      y: Math.sin(angle) * 100 + 200,
      name: id // You might want to map this to a real name
    };
  });

  // Force-directed layout iterations
  const iterations = 50;
  const repulsion = 1000; // Repulsion force between all nodes
  const attraction = 0.01; // Base attraction force along edges

  for (let i = 0; i < iterations; i++) {
    // Calculate forces
    const forces = positions.map(() => ({ x: 0, y: 0 }));

    // Repulsion between all pairs of nodes
    for (let j = 0; j < positions.length; j++) {
      for (let k = j + 1; k < positions.length; k++) {
        const dx = positions[k].x - positions[j].x;
        const dy = positions[k].y - positions[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (distance * distance);

        forces[j].x -= (dx / distance) * force;
        forces[j].y -= (dy / distance) * force;
        forces[k].x += (dx / distance) * force;
        forces[k].y += (dy / distance) * force;
      }
    }

    // Attraction along edges based on similarity
    similarities.forEach(sim => {
      const source = positions.findIndex(p => p.id === sim.source);
      const target = positions.findIndex(p => p.id === sim.target);
      if (source !== -1 && target !== -1) {
        const dx = positions[target].x - positions[source].x;
        const dy = positions[target].y - positions[source].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = distance * attraction * sim.similarity;

        forces[source].x += (dx / distance) * force;
        forces[source].y += (dy / distance) * force;
        forces[target].x -= (dx / distance) * force;
        forces[target].y -= (dy / distance) * force;
      }
    });

    // Apply forces
    positions.forEach((pos, j) => {
      pos.x += forces[j].x;
      pos.y += forces[j].y;

      // Keep within bounds
      pos.x = Math.max(50, Math.min(350, pos.x));
      pos.y = Math.max(50, Math.min(350, pos.y));
    });
  }

  return positions;
}

export async function computePersonaSimilarities(): Promise<SimilarityResult[]> {
  const personas: Persona[] = await loadPersonas();
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
}
