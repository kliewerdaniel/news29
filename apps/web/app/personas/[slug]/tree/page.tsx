import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'yaml';
import PersonaTreeGraph from '@/components/tree/PersonaTreeGraph';

interface PageProps {
  params: {
    slug: string;
  };
}

interface PersonaVersion {
  id: string;
  date: string;
  traits: Record<string, number>;
  parentId?: string;
  event?: 'article' | 'debate' | 'manual';
}

async function loadPersonaVersions(slug: string): Promise<PersonaVersion[]> {
  // Get all YAML files in the persona directory
  const personaDir = path.join(process.cwd(), 'data', 'personas', slug);
  let files: string[];
  
  try {
    files = await fs.readdir(personaDir);
  } catch (error) {
    console.error('Error reading persona directory:', error);
    return [];
  }

  const yamlFiles = files.filter(file => file.endsWith('.yaml'));
  
  // Load and parse each YAML file
  const versions: PersonaVersion[] = [];
  
  for (const file of yamlFiles) {
    const filePath = path.join(personaDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    const data = parse(content);
    
    // Extract version ID and date from filename (e.g., v1.yaml, v2.yaml)
    const id = path.basename(file, '.yaml');
    
    // If the file has a createdAt field, use that, otherwise use file stats
    const stats = await fs.stat(filePath);
    const date = data.createdAt || stats.mtime.toISOString();
    
    versions.push({
      id,
      date,
      traits: data.traits,
      parentId: data.parentId,
      event: data.event,
    });
  }
  
  // Sort versions by date
  return versions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default async function PersonaTreePage({ params }: PageProps) {
  const versions = await loadPersonaVersions(params.slug);
  
  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Persona Evolution Tree</h1>
      <PersonaTreeGraph
        slug={params.slug}
        initialVersions={versions}
      />
    </div>
  );
}
