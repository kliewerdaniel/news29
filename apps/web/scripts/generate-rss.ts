const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');
const { create } = require('xmlbuilder2');

const ARTICLES_DIR = 'data/articles';
const OUTPUT_FILE = 'public/rss.xml';
const BASE_URL = 'http://localhost:3000';

interface Article {
  title: string;
  description: string;
  url: string;
  date: string;
  persona: string;
}

async function getPublishedArticles(): Promise<Article[]> {
  const articles: Article[] = [];
  
  // Get all persona directories
  const personaDirs = await fs.readdir(ARTICLES_DIR);
  
  for (const personaSlug of personaDirs) {
    const personaPath = path.join(ARTICLES_DIR, personaSlug);
    const stat = await fs.stat(personaPath);
    
    if (!stat.isDirectory()) continue;
    
    // Get all MDX files for this persona
    const files = await fs.readdir(personaPath);
    const mdxFiles = files.filter((file: string) => file.endsWith('.mdx'));
    
    for (const filename of mdxFiles) {
      const filePath = path.join(personaPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter, content: articleContent } = matter(content);
      
      // Skip if not published
      if (!frontmatter.published) continue;
      
      // Get first paragraph or generate default description
      const firstParagraph = articleContent
        .split('\n')
        .find((line: string) => line.trim().length > 0) || '';
      const description = firstParagraph.trim() || `Opinion by ${personaSlug}`;
      
      articles.push({
        title: frontmatter.topic || path.basename(filename, '.mdx'),
        description,
        url: `${BASE_URL}/personas/${personaSlug}/articles/${path.basename(filename, '.mdx')}`,
        date: frontmatter.date || new Date().toISOString(),
        persona: personaSlug
      });
    }
  }
  
  // Sort by date descending
  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function generateRSSFeed(articles: Article[]): Promise<string> {
  const feed = create({ version: '1.0' })
    .ele('rss', { version: '2.0' })
      .ele('channel')
        .ele('title').txt('Dynamic News Engine – Persona Opinions').up()
        .ele('link').txt(`${BASE_URL}/rss.xml`).up()
        .ele('description').txt('AI persona-authored op-eds and reactions to the news').up();
        
  articles.forEach(article => {
    feed.ele('item')
      .ele('title').txt(article.title).up()
      .ele('link').txt(article.url).up()
      .ele('pubDate').txt(new Date(article.date).toUTCString()).up()
      .ele('description').dat(article.description).up()
      .ele('guid').txt(article.url).up();
  });
  
  return feed.end({ prettyPrint: true });
}

async function main() {
  try {
    // Ensure public directory exists
    try {
      await fs.mkdir('public', { recursive: true });
    } catch (err) {
      // Directory might already exist
    }
    
    const articles = await getPublishedArticles();
    const rssXml = await generateRSSFeed(articles);
    await fs.writeFile(OUTPUT_FILE, rssXml);
    
    console.log(`RSS feed generated successfully at ${OUTPUT_FILE}`);
    console.log(`Found ${articles.length} published articles`);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    process.exit(1);
  }
}

main();
