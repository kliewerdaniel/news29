import fs from 'fs/promises';
import yaml from 'js-yaml';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AnimatedCard from "@/components/AnimatedCard";
import { motion } from 'framer-motion';

type PersonaSummary = {
  name: string;
  slug: string;
  traits: Record<string, number>;
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default async function Page() {
  const personaFiles = await fs.readdir("./persona");

  const personas: PersonaSummary[] = await Promise.all(
    personaFiles.filter(file => file.endsWith(".yaml")).map(async (file) => {
      const fileContent = await fs.readFile(`./persona/${file}`, "utf-8");
      const persona = yaml.load(fileContent) as { name: string; traits: Record<string, number> };
      const slug = file.replace(".yaml", "");
      return {
        name: persona.name,
        slug: slug,
        traits: persona.traits,
      };
    })
  );

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">Personas</h1>
        <Link href="/personas/new">
          <Button>Add New Persona</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((persona, index) => (
          <AnimatedCard key={persona.slug} variants={cardVariants} index={index}>
            <CardHeader>
              <CardTitle>{persona.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul>
                {Object.entries(persona.traits)
                  .slice(0, 2)
                  .map(([trait, value]) => (
                    <li key={trait} className="mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{trait}</span>
                        <span className="text-sm">{value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
                      </div>
                    </li>
                  ))}
              </ul>
              <Link href={`/personas/${persona.slug}`}>
                <Button variant="secondary">View</Button>
              </Link>
            </CardContent>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
