import fs from 'fs/promises';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { motion } from 'framer-motion';
import Link from 'next/link';
import path from 'path';
import yaml from 'js-yaml';
import { CritiquePanel } from '@/components/critique/CritiquePanel';
import { ClientArticle } from './client';

// Types for our frontmatter
interface Frontmatter {
  topic: string;
  date: string;
  style: string;
  tone: string;
  persona: string;
}

// Parse frontmatter from MDX content
function parseFrontmatter(content: string): { content: string; frontmatter: Frontmatter } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const matches = content.match(frontmatterRegex);

  if (!matches) {
    throw new Error('No frontmatter found');
  }

  const [, frontmatterYaml, contentRest] = matches;
  
  // Parse YAML frontmatter
  const frontmatterObj = frontmatterYaml.split('\n').reduce((acc, line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      acc[key.trim()] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  // Validate and cast frontmatter
  const frontmatter: Frontmatter = {
    topic: frontmatterObj.topic ?? '',
    date: frontmatterObj.date ?? '',
    style: frontmatterObj.style ?? '',
    tone: frontmatterObj.tone ?? '',
    persona: frontmatterObj.persona ?? ''
  };

  // Validate required fields
  if (!frontmatter.topic || !frontmatter.date || !frontmatter.style || 
      !frontmatter.tone || !frontmatter.persona) {
    throw new Error('Missing required frontmatter fields');
  }

  return {
    content: contentRest,
    frontmatter,
  };
}

// Dynamic page component
async function getPersonaData(slug: string) {
  // Try to find the latest version by listing files and sorting
  const personaDir = path.join(process.cwd(), 'data', 'personas', slug);
  
  try {
    const files = await fs.readdir(personaDir);
    const yamlFiles = files.filter(file => file.endsWith('.yaml'));
    
    // Sort by date (version) in descending order
    yamlFiles.sort().reverse();
    
    if (yamlFiles.length === 0) {
      throw new Error('No persona versions found');
    }
    
    // Read the latest version
    const latestVersion = yamlFiles[0];
    const content = await fs.readFile(path.join(personaDir, latestVersion), 'utf-8');
    return yaml.load(content) as any;
  } catch (error) {
    console.error('Error loading persona:', error);
    return null;
  }
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string; filename: string };
}) {
  // Get persona data
  const personaData = await getPersonaData(params.slug);
  
  // Read the MDX file
  const filepath = path.join(process.cwd(), 'data', 'articles', params.slug, `${params.filename}.mdx`);
  const file = await fs.readFile(filepath, 'utf-8');
  
  // Parse the frontmatter and content
  const { content, frontmatter } = parseFrontmatter(file);

  // Format the date
  const formattedDate = new Date(frontmatter.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Back Link */}
      <Link
        href={`/personas/${params.slug}/articles`}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
      >
        ← Back to Articles
      </Link>

      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{frontmatter.topic}</h1>
        <p className="text-lg text-gray-600 mb-2">
          {frontmatter.style} • {frontmatter.tone} • {formattedDate}
        </p>
        <p className="text-md text-gray-500">
          Written by {frontmatter.persona}
        </p>
      </header>

      {/* Article Content */}
      <div className="prose max-w-none dark:prose-invert">
        <MDXRemote source={content} />
      </div>

      {/* Critique Panel */}
      <CritiquePanel 
        slug={params.slug}
        content={content}
        topic={frontmatter.topic}
      />

      {/* Client-side components */}
      <div className="mt-8">
        <ClientArticle 
          personaData={personaData} 
          slug={params.slug}
        />
      </div>
    </motion.article>
  );
}
