import { readdir, readFile } from "fs/promises";
import { parse } from "yaml";
import { notFound } from "next/navigation";
import { join } from "path";
import VersionComparer from "@/components/persona/VersionComparer";

type Params = {
  params: {
    slug: string;
  };
};

type Persona = {
  name: string;
  [trait: string]: number | string;
};

export default async function PersonaComparePage({ params }: Params) {
  const folder = `data/personas/${params.slug}`;
  let files: string[];
  
  try {
    files = await readdir(folder);
  } catch (error) {
    return notFound();
  }

  const versions = files
    .filter((f) => f.endsWith(".yaml"))
    .sort();

  if (versions.length === 0) {
    return notFound();
  }

  // Pre-load first and last versions
  const firstVersion = versions[0];
  const lastVersion = versions[versions.length - 1];
  
  const [contentA, contentB] = await Promise.all([
    readFile(join(folder, firstVersion), 'utf-8'),
    readFile(join(folder, lastVersion), 'utf-8')
  ]);

  const personaA = parse(contentA);
  const personaB = parse(contentB);

  return (
    <div className="container py-10">
      <VersionComparer 
        slug={params.slug}
        versions={versions}
        initialPersonaA={personaA}
        initialPersonaB={personaB}
        initialVersionA={firstVersion}
        initialVersionB={lastVersion}
      />
      <div className="mt-4">
        <a href={`/personas/${params.slug}`} className="text-sm text-blue-500 hover:underline">
          ← Back to Persona
        </a>
      </div>
    </div>
  );
}
