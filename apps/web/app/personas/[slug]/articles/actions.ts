'use server'

import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  summary: string;
}

export interface ArticleContent {
  content: string;
  frontmatter: {
    topic: string;
    date: string;
    style: string;
    tone: string;
    persona: string;
  };
}

export async function loadArticleMetas(personaSlug: string): Promise<ArticleMeta[]> {
  const articlesDir = path.join(process.cwd(), 'data/articles', personaSlug);
  
  try {
    const files = await fs.readdir(articlesDir);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));

    const metas = await Promise.all(
      mdxFiles.map(async (file) => {
        const content = await fs.readFile(path.join(articlesDir, file), 'utf-8');
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        const frontmatter = frontmatterMatch 
          ? yaml.load(frontmatterMatch[1]) as { topic?: string; date?: string; style?: string; tone?: string; persona?: string; }
          : {};

        return {
          slug: file.replace('.mdx', ''),
          title: frontmatter.topic || 'Untitled',
          date: frontmatter.date || 'Unknown Date',
          summary: content.split('\n').slice(1).join('\n').slice(0, 200) + '...'
        };
      })
    );

    // Sort by date, newest first
    return metas.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  } catch (error) {
    console.error('Error loading articles:', error);
    return [];
  }
}

export async function loadArticleContent(personaSlug: string, articleId: string): Promise<ArticleContent> {
  const filepath = path.join(process.cwd(), 'data/articles', personaSlug, `${articleId}.mdx`);
  const file = await fs.readFile(filepath, 'utf-8');
  
  // Parse the frontmatter and content
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const matches = file.match(frontmatterRegex);

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
  const frontmatter = {
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
