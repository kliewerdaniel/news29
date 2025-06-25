'use server'

import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export interface PersonaVersion {
  version: string;
  name: string;
  date: string;
  traits: string[] | Record<string, number>;
}

export async function loadPersonaVersions(slug: string): Promise<PersonaVersion[]> {
  const personaDir = path.join(process.cwd(), 'data', 'personas', slug);
  const versions: PersonaVersion[] = [];

  try {
    const files = await fs.readdir(personaDir);
    const yamlFiles = files.filter(file => file.endsWith('.yaml'));
    
    for (const file of yamlFiles) {
      const content = await fs.readFile(path.join(personaDir, file), 'utf-8');
      const data = yaml.load(content) as any;
      versions.push({
        version: file.replace('.yaml', ''),
        name: data.name || 'Unknown',
        date: data.date || 'Unknown',
        traits: data.traits || []
      });
    }

    // Sort by date, newest first
    return versions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error loading persona versions:', error);
    return [];
  }
}

export async function loadLatestPersonaVersion(slug: string): Promise<PersonaVersion | null> {
  const versions = await loadPersonaVersions(slug);
  return versions[0] || null;
}
