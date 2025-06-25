'use server'

import { promises as fs } from 'fs'
import path from 'path'

export interface Cluster {
  slug: string;
  topic: string;
  summary: string;
  articles: {
    title: string;
    url: string;
    source: string;
  }[];
  timeline?: {
    date: string;
    event: string;
  }[];
  keywords?: string[];
}

export async function loadClusters(): Promise<Cluster[]> {
  const clustersDir = path.join(process.cwd(), 'data/clusters');
  const clusters: Cluster[] = [];

  try {
    const files = await fs.readdir(clustersDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(clustersDir, file), 'utf-8');
      const data = JSON.parse(content);
      clusters.push({
        ...data,
        slug: file.replace('.json', '')
      });
    }

    // Sort by slug for consistent ordering
    return clusters.sort((a, b) => a.slug.localeCompare(b.slug));
  } catch (error) {
    console.error('Error loading clusters:', error);
    return [];
  }
}

export async function loadClusterBySlug(slug: string): Promise<Cluster | null> {
  try {
    const filePath = path.join(process.cwd(), 'data/clusters', `${slug}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    return {
      ...data,
      slug
    };
  } catch (error) {
    console.error(`Error loading cluster ${slug}:`, error);
    return null;
  }
}

export async function loadClusterSummaries(): Promise<{ slug: string; topic: string }[]> {
  const clusters = await loadClusters();
  return clusters.map(c => ({
    slug: c.slug,
    topic: c.topic
  }));
}
