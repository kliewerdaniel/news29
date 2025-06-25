import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Persona = {
  name: string;
  [trait: string]: string | number;
};

interface PersonaPageProps {
  params: {
    slug: string;
  };
}

export default async function PersonaPage({ params }: PersonaPageProps) {
  const { slug } = params;
  let persona: Persona | null = null;
  let error: string | null = null;

  try {
    const filePath = path.join(process.cwd(), "data", "personas", `${slug}.yaml`);
    const fileContents = await fs.readFile(filePath, "utf-8");
    persona = yaml.load(fileContents) as Persona;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      error = "Persona not found.";
    } else {
      error = "Failed to load persona data.";
      console.error(`Error loading persona ${slug}:`, err);
    }
  }

  if (error || !persona) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-screen p-4"
      >
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">{error || "Persona not found."}</p>
        <Link href="/personas" passHref>
          <Button>Back to All Personas</Button>
        </Link>
      </motion.div>
    );
  }

  const traits = Object.entries(persona).filter(([key]) => key !== "name");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-screen p-4"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-3xl">{persona.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {traits.map(([traitName, traitValue]) => (
              <div key={traitName} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium capitalize">{traitName}:</span>
                  <span className="text-sm text-gray-500">{typeof traitValue === 'number' ? traitValue.toFixed(2) : traitValue}</span>
                </div>
                {typeof traitValue === 'number' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={cn("bg-primary h-2 rounded-full")}
                      style={{ width: `${Math.min(Math.max(traitValue, 0), 1) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/personas" passHref>
              <Button>Back to All Personas</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
