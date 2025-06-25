import Link from 'next/link'
import { MotionDiv } from '@/components/motion-wrapper'
import { loadArticleMetas } from './actions'
import { format } from 'date-fns'

export default async function ArticlesPage({
  params
}: {
  params: { slug: string }
}) {
  const articles = await loadArticleMetas(params.slug)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Articles</h1>
          <Link
            href={`/personas/${params.slug}`}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Persona
          </Link>
        </div>

        <div className="grid gap-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/personas/${params.slug}/articles/${article.slug}`}
              className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{article.title}</h2>
                <span className="text-sm text-gray-500">
                  {format(new Date(article.date), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="text-gray-600">{article.summary}</p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <span className="mr-2">Read more →</span>
              </div>
            </Link>
          ))}
        </div>
      </MotionDiv>
    </div>
  )
}
