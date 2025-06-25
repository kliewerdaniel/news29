import { MotionDiv } from '@/components/motion-wrapper'
import { loadYearInReviewData } from './actions'
import { formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default async function YearInReviewPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const data = await loadYearInReviewData(params.slug)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Year in Review</h1>
          <Link
            href={`/personas/${params.slug}`}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Overview
          </Link>
        </div>

        <div className="grid gap-8">
          {/* Timeline overview */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Timeline</h2>
            <Card className="p-6">
              <div className="text-gray-500 mb-4">
                <p>From: {formatDate(data.yearStart)}</p>
                <p>To: {formatDate(data.yearEnd)}</p>
              </div>
              <div className="space-y-4">
                {data.articles.length + data.versions.length === 0 ? (
                  <p className="text-gray-600">No activity in the past year.</p>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Persona Updates</h3>
                      <div className="space-y-2">
                        {data.versions.map((version, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 bg-purple-50 rounded"
                          >
                            <span>{version.name}</span>
                            <span className="text-gray-600">
                              {formatDate(version.date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Articles Written</h3>
                      <div className="space-y-2">
                        {data.articles.map((article, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 bg-blue-50 rounded"
                          >
                            <span>{article.title}</span>
                            <span className="text-gray-600">
                              {formatDate(article.date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </section>

          {/* Stats overview */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-2">Articles</h3>
                <p className="text-3xl font-bold">
                  {data.articles.length}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-2">Persona Updates</h3>
                <p className="text-3xl font-bold">
                  {data.versions.length}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-2">Total Activities</h3>
                <p className="text-3xl font-bold">
                  {data.articles.length + data.versions.length}
                </p>
              </Card>
            </div>
          </section>
        </div>
      </MotionDiv>
    </div>
  )
}
