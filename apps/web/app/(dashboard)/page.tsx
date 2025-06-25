import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TraitProgressBar } from '@/components/persona/TraitProgressBar';
import { ExportButton } from '@/components/persona/ExportButton';

interface PersonaVersion {
  slug: string;
  name: string;
  version: string;
  traits: Record<string, number>;
}

async function getPersonaVersions(): Promise<PersonaVersion[]> {
  const personasDir = path.join(process.cwd(), 'data/personas');
  const personaFolders = await fs.readdir(personasDir, { withFileTypes: true });
  
  const versions: PersonaVersion[] = [];
  
  for (const folder of personaFolders) {
    if (!folder.isDirectory()) continue;
    
    const personaPath = path.join(personasDir, folder.name);
    const files = await fs.readdir(personaPath);
    const yamlFiles = files.filter(file => file.endsWith('.yaml'));
    
    for (const file of yamlFiles) {
      const content = await fs.readFile(path.join(personaPath, file), 'utf-8');
      const data = yaml.load(content) as any;
      
      versions.push({
        slug: folder.name,
        name: data.name,
        version: path.basename(file, '.yaml'),
        traits: data.traits || {}
      });
    }
  }
  
  return versions;
}


export default async function DashboardPage() {
  const versions = await getPersonaVersions();
  
  // Group versions by persona slug
  const personas = versions.reduce((acc, version) => {
    if (!acc[version.slug]) {
      acc[version.slug] = [];
    }
    acc[version.slug].push(version);
    return acc;
  }, {} as Record<string, PersonaVersion[]>);
  
  // Sort versions for each persona
  Object.values(personas).forEach(versions => {
    versions.sort((a, b) => a.version.localeCompare(b.version));
  });
  
  const keyTraits = ['empathy', 'confidence', 'curiosity'];
  
  // Handle empty state
  if (Object.keys(personas).length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Persona Evolution</h1>
            <p className="text-gray-600 mt-1">Track how personas change over time</p>
          </div>
          <Link
            href="/personas"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Personas
          </Link>
        </div>
        
        <Card className="w-full p-6 text-center">
          <div className="py-8">
            <h2 className="text-xl font-semibold mb-2">No Persona Versions Found</h2>
            <p className="text-gray-600 mb-4">
              Start by creating a persona and adding multiple versions to track their evolution.
            </p>
            <Link 
              href="/personas/new"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create First Persona
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Persona Evolution</h1>
          <p className="text-gray-600 mt-1">Track how personas change over time</p>
        </div>
        <div className="flex gap-4 items-center">
          <ExportButton personas={personas} keyTraits={keyTraits} />
          <Link
            href="/personas"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Personas
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(personas).map(([slug, versions]) => (
          <Card key={slug} className="w-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{versions[0].name}</span>
                <span className="text-sm font-normal text-gray-500">
                  {versions.length} version{versions.length !== 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keyTraits.map(trait => (
                  <div key={trait} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="capitalize">{trait}</span>
                      <span className="text-sm text-gray-500">
                        {versions.length > 1 ? (
                          `${versions[0].traits[trait]} → ${versions[versions.length - 1].traits[trait]}`
                        ) : (
                          versions[0].traits[trait]
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      {versions.length === 1 ? (
                        <>
                          <div className="flex-1">
                            <TraitProgressBar value={versions[0].traits[trait]} animate={false} />
                            <div className="text-xs text-center mt-1 text-gray-500">Current</div>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-100 rounded-full" />
                            <div className="text-xs text-center mt-1 text-gray-400">Future</div>
                          </div>
                        </>
                      ) : (
                        versions.map((version, idx) => (
                          <div key={version.version} className="flex-1">
                            <TraitProgressBar value={version.traits[trait]} />
                            <div className="text-xs text-center mt-1 text-gray-500">v{idx + 1}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
