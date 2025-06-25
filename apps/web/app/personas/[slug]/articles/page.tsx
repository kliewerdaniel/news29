import { promises as fs } from 'fs'
import { notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { getPersona } from '@/lib/utils'

interface ArticleMeta {
  filename: string
  topic: string
  date: string
  style?: string
  tone?: string
}

function parseFrontmatterLine(content: string, field: string): string | undefined {
  const regex = new RegExp(`^${field}:\\s*(.+)$`, 'm')
  const match = content.match(regex)
  return match?.[1]
}

async function getArticleMeta(slug: string, filename: string): Promise<ArticleMeta> {
  const content = await fs.readFile(`data/articles/${slug}/${filename}`, 'utf-8')
  
  return {
    filename: filename.replace('.mdx', ''),
    topic: parseFrontmatterLine(content, 'topic') || 'Untitled',
    date: parseFrontmatterLine(content, 'date') || new Date().toISOString().split('T')[0],
    style: parseFrontmatterLine(content, 'style'),
    tone: parseFrontmatterLine(content, 'tone')
  }
}

export default async function PersonaArticles({
  params
}: {
  params: { slug: string }
}) {
  let articles: ArticleMeta[] = []

  try {
    // Get persona info
    const persona = await getPersona(params.slug)
    if (!persona) return notFound()

    // Get all MDX files for this persona
    const folder = `data/articles/${params.slug}`
    const files = await fs.readdir(folder)
    const mdxFiles = files.filter(f => f.endsWith('.mdx'))

    // Get metadata for each article
    articles = await Promise.all(
      mdxFiles.map(file => getArticleMeta(params.slug, file))
    )

  } catch (err) {
    // If folder doesn't exist yet, that's fine - we'll show empty state
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <Link href={`/personas/${params.slug}`}>
          <Button variant="outline" size="sm">
            ← Back
          </Button>
        </Link>
        <h1 className="text-3xl font-semibold">
          Articles by {params.slug}
        </h1>
      </div>

      {articles.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No articles written yet.
        </Card>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4"
        >
          {articles.map((article) => (
            <motion.div key={article.filename} variants={item}>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">
                  {article.topic}
                </h2>
                <div className="flex gap-2 text-sm text-muted-foreground mb-4">
                  <span>{article.date}</span>
                  {article.style && (
                    <>
                      <span>•</span>
                      <span>{article.style}</span>
                    </>
                  )}
                  {article.tone && (
                    <>
                      <span>•</span>
                      <span>{article.tone}</span>
                    </>
                  )}
                </div>
                <Link href={`/personas/${params.slug}/articles/${article.filename}`}>
                  <Button>Read</Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
