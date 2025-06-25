import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import yaml from 'yaml';

interface Debate {
  createdAt: string;
  clusterSlug: string;
  rounds: {
    personaSlug: string;
    response: string;
  }[];
}

interface PersonaTrait {
  version: string;
  date: string;
  traits: Record<string, number>;
}

interface PersonaVersion {
  name: string;
  traits: Record<string, number>;
}

export async function loadTimelineData() {
  try {
    // Load debates
    const debatesDir = join(process.cwd(), 'data/debates');
    const debateFiles = await readdir(debatesDir);
    
    const debates = await Promise.all(
      debateFiles
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const content = await readFile(join(debatesDir, file), 'utf-8');
          return JSON.parse(content) as Debate;
        })
    );

    // Load persona data
    const personasDir = join(process.cwd(), 'data/personas');
    const personaSlugs = await readdir(personasDir);
    
    const personaTraits = new Map<string, PersonaTrait[]>();
    
    await Promise.all(
      personaSlugs.map(async (slug) => {
        if ((await readdir(join(personasDir, slug)))
            .some(file => file.endsWith('.yaml'))) {
          const versions = await readdir(join(personasDir, slug));
          const traitVersions = await Promise.all(
            versions
              .filter(v => v.endsWith('.yaml'))
              .map(async (version) => {
                const content = await readFile(
                  join(personasDir, slug, version),
                  'utf-8'
                );
                const data = yaml.parse(content) as PersonaVersion;
                return {
                  version: version.replace('.yaml', ''),
                  date: version.split('_')[0], // Assumes date_version.yaml format
                  traits: data.traits
                };
              })
          );
          personaTraits.set(slug, traitVersions);
        }
      })
    );

    // Process timeline events
    const events = debates.map(debate => {
      const participants = debate.rounds.map(round => {
        const personaVersions = personaTraits.get(round.personaSlug) || [];
        const currentVersion = findClosestVersion(personaVersions, debate.createdAt);
        const previousVersion = findPreviousVersion(personaVersions, currentVersion);
        
        const deltaFromLast: Record<string, number> = {};
        if (previousVersion && currentVersion) {
          Object.entries(currentVersion.traits).forEach(([trait, value]) => {
            const prevValue = previousVersion.traits[trait];
            if (prevValue !== undefined) {
              deltaFromLast[trait] = value - prevValue;
            }
          });
        }

        return {
          slug: round.personaSlug,
          name: round.personaSlug, // TODO: Get actual name from persona data
          traits: currentVersion?.traits || {},
          text: round.response.slice(0, 150) + '...', // Truncate for preview
          deltaFromLast
        };
      });

      return {
        date: debate.createdAt,
        cluster: debate.clusterSlug,
        participants
      };
    });

    return events.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch (error) {
    console.error('Error loading timeline data:', error);
    return [];
  }
}

function findClosestVersion(
  versions: PersonaTrait[],
  date: string
): PersonaTrait | undefined {
  const targetTime = new Date(date).getTime();
  return versions
    .filter(v => new Date(v.date).getTime() <= targetTime)
    .sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
}

function findPreviousVersion(
  versions: PersonaTrait[],
  current?: PersonaTrait
): PersonaTrait | undefined {
  if (!current) return undefined;
  
  const sorted = versions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const currentIndex = sorted.findIndex(v => v.version === current.version);
  return sorted[currentIndex + 1];
}
