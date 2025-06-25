'use server'

import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'

interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  style: string;
  tone: string;
  summary: string;
}

interface PersonaMeta {
  name: string;
  date: string;
  traits: string[] | Record<string, number>;
}

interface YearInReviewData {
  articles: ArticleMeta[];
  versions: PersonaMeta[];
  yearStart: string;
  yearEnd: string;
}

export async function loadYearInReviewData(personaSlug: string): Promise<YearInReviewData> {
  // Calculate the year range
  const now = new Date();
  const yearEnd = now.toISOString();
  const yearStart = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();

  // Load articles
  const articlesDir = path.join(process.cwd(), 'data/articles', personaSlug);
  const articles: ArticleMeta[] = [];

  try {
    const files = await fs.readdir(articlesDir);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));

    for (const file of mdxFiles) {
      const content = await fs.readFile(path.join(articlesDir, file), 'utf-8');
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      const frontmatter = frontmatterMatch 
        ? yaml.load(frontmatterMatch[1]) as any
        : {};

      const article: ArticleMeta = {
        slug: file.replace('.mdx', ''),
        title: frontmatter.topic || 'Untitled',
        date: frontmatter.date || 'Unknown Date',
        style: frontmatter.style || 'Unknown Style',
        tone: frontmatter.tone || 'Unknown Tone',
        summary: content.split('\n').slice(1).join('\n').slice(0, 200) + '...'
      };

      // Only include articles from the past year
      if (new Date(article.date) >= new Date(yearStart)) {
        articles.push(article);
      }
    }
  } catch (error) {
    console.error('Error loading articles:', error);
  }

  // Load persona versions
  const personaDir = path.join(process.cwd(), 'data/personas', personaSlug);
  const versions: PersonaMeta[] = [];

  try {
    const files = await fs.readdir(personaDir);
    const yamlFiles = files.filter(file => file.endsWith('.yaml'));
    
    for (const file of yamlFiles) {
      const content = await fs.readFile(path.join(personaDir, file), 'utf-8');
      const data = yaml.load(content) as any;
      const version: PersonaMeta = {
        name: data.name || 'Unknown',
        date: data.date || 'Unknown',
        traits: data.traits || []
      };

      // Only include versions from the past year
      if (new Date(version.date) >= new Date(yearStart)) {
        versions.push(version);
      }
    }
  } catch (error) {
    console.error('Error loading persona versions:', error);
  }

  // Sort collections by date
  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  versions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    articles,
    versions,
    yearStart,
    yearEnd
  };
}
