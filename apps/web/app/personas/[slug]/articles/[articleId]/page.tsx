import { loadArticleContent } from '../actions'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { CritiquePanel } from '@/components/critique/CritiquePanel'
import { ClientArticle } from './client'
import { MotionDiv } from '@/components/motion-wrapper'
import { loadPersonas } from '@/app/clusters/[clusterId]/debate/data'

export default async function ArticlePage({
  params,
}: {
  params: { slug: string; articleId: string }
}) {
  // Load article content and persona data in parallel
  const [
    { content, frontmatter },
    personas
  ] = await Promise.all([
    loadArticleContent(params.slug, params.articleId),
    loadPersonas()
  ])

  // Get the persona data for this article
  const personaData = personas.find(p => p.slug === params.slug)

  // Format the date
  const formattedDate = new Date(frontmatter.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <MotionDiv
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
          slug={params.slug}
          personaData={personaData}
        />
      </div>
    </MotionDiv>
  )
}
