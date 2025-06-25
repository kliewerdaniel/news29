'use server'

import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export interface Persona {
  name: string
  traits: string[] | Record<string, number>
  slug: string
  isGuest?: boolean
}

export interface Cluster {
  topic: string
  summary: string
  articles: {
    title: string
    url: string
    source: string
  }[]
}

export async function loadPersonas(): Promise<Persona[]> {
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
        ...data,
        slug
      });
    }
  } catch (error) {
    console.error('Error loading personas:', error);
    return [];
  }

  return personas;
}

export async function loadClusterData(slug: string): Promise<Cluster> {
  const clusterPath = path.join(process.cwd(), 'data/clusters', `${slug}.json`);
  
  try {
    const content = await fs.readFile(clusterPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading cluster ${slug}:`, error);
    return {
      topic: 'Unknown Topic',
      summary: 'Failed to load cluster data',
      articles: []
    };
  }
}
