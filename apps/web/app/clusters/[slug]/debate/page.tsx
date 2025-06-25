import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { revalidatePath } from "next/cache";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const saveDebateLog = async (clusterSlug: string, opinions: DebateResponse[]) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const logPath = path.join(process.cwd(), 'data/debates', `${clusterSlug}-${timestamp}.json`);
  
  // Create debates directory if it doesn't exist
  const debatesDir = path.dirname(logPath);
  await fs.mkdir(debatesDir, { recursive: true });
  
  await fs.writeFile(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    clusterSlug,
    opinions
  }, null, 2));
};

interface Persona {
  name: string;
  slug: string;
  traits: Record<string, number>;
}

interface DebateResponse {
  name: string;
  slug: string;
  opinion: string;
  traits: Record<string, number>;
}

async function getCluster(slug: string) {
  const filePath = path.join(process.cwd(), 'data/clusters', `${slug}.json`);
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function getPersonas() {
  const personasDir = path.join(process.cwd(), 'data/personas');
  const personas: Persona[] = [];

  async function processDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        // Find the latest version in this directory
        const files = await fs.readdir(fullPath);
        const yamlFiles = files.filter(f => f.endsWith('.yaml'));
        if (yamlFiles.length > 0) {
          // Get the most recent file
          const latestFile = yamlFiles.sort().pop();
          if (latestFile) {
            const content = await fs.readFile(path.join(fullPath, latestFile), 'utf8');
            const persona = yaml.load(content) as Persona;
            personas.push(persona);
          }
        }
      } else if (entry.name.endsWith('.yaml')) {
        // Process top-level YAML files
        const content = await fs.readFile(fullPath, 'utf8');
        const persona = yaml.load(content) as Persona;
        personas.push(persona);
      }
    }
  }

  await processDirectory(personasDir);
  return personas;
}

export default async function DebatePage({ params }: { params: { slug: string } }) {
  // Add keys for optimistic updates
  const generateKey = Math.random().toString(36).substring(7);
  const cluster = await getCluster(params.slug);
  const personas = await getPersonas();
  
  // Generate opinions in parallel
  const responses = await Promise.allSettled(
    personas.map(persona =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, cluster }),
      }).then(res => res.json())
    )
  );

  const opinions: DebateResponse[] = responses
    .filter((result): result is PromiseFulfilledResult<DebateResponse> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);

  // Save debate results
  await saveDebateLog(params.slug, opinions);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Debate: {cluster.title}</h1>
        <Button
          onClick={async () => {
            "use server";
            // This will trigger a page reload with fresh opinions
            revalidatePath(`/clusters/${params.slug}/debate`);
          }}
        >
          🔄 Replay Debate
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opinions.map((opinion, index) => (
          <motion.div
            key={opinion.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 h-full">
              <div className="flex flex-col h-full">
                <h2 className="text-xl font-semibold mb-2">{opinion.name}</h2>
                
                <div className="mb-4 flex flex-wrap gap-2">
                  {Object.entries(opinion.traits)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([trait, value]) => (
                      <span
                        key={trait}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                      >
                        {trait}: {value}
                      </span>
                    ))}
                </div>
                
                <p className="flex-1 text-gray-600 whitespace-pre-wrap">
                  {opinion.opinion}
                </p>
                
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    👍 Insightful
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    😠 Biased
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
