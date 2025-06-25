import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { compile } from "@mdx-js/mdx";
import { MDXProps } from "mdx/types";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Persona = {
  name: string;
  [trait: string]: string | number;
};

interface ArticlePageProps {
  params: {
    slug: string;
    cluster: string;
  };
}

async function getMdxContent(filePath: string) {
  const content = await fs.readFile(filePath, "utf-8");
  const compiled = await compile(content, { outputFormat: "function-body" });
  return compiled.toString();
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug, cluster } = params;
  let persona: Persona | null = null;
  let mdxContent: string | null = null;
  let error: string | null = null;

  try {
    // Load persona data
    const personaPath = path.join(process.cwd(), "data", "personas", `${slug}.yaml`);
    const personaContents = await fs.readFile(personaPath, "utf-8");
    persona = yaml.load(personaContents) as Persona;

    // Load MDX content
    const articlePath = path.join(process.cwd(), "data", "articles", slug, `${cluster}.mdx`);
    mdxContent = await getMdxContent(articlePath);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      error = "Article or persona not found.";
    } else {
      error = "Failed to load content.";
      console.error(`Error loading content for ${slug}/${cluster}:`, err);
    }
  }

  if (error || !persona || !mdxContent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-screen p-4"
      >
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">{error || "Content not found."}</p>
        <Link href={`/personas/${slug}`} passHref>
          <Button>Back to Persona</Button>
        </Link>
      </motion.div>
    );
  }

  // Using dynamic import for MDX content
  const MDXContent = (await import("@mdx-js/react")).MDXProvider;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <Link href={`/personas/${slug}`} passHref>
          <Button variant="ghost" className="mb-4">
            ← Back to {persona.name}
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-4">
          {persona.name} on {cluster.replace(/-/g, " ")}
        </h1>
        <div className="text-gray-600 mb-8">
          Written by {persona.name}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="prose prose-lg dark:prose-invert max-w-none"
      >
        <MDXContent>{mdxContent}</MDXContent>
      </motion.div>
    </motion.div>
  );
}
