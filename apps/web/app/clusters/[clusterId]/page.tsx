import { MotionDiv } from '@/components/motion-wrapper'
import { loadClusterBySlug } from '../actions'
import Link from 'next/link'

export default async function ClusterPage({
  params
}: {
  params: { clusterId: string }
}) {
  const cluster = await loadClusterBySlug(params.clusterId)

  if (!cluster) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Cluster not found</h1>
        <Link 
          href="/"
          className="text-blue-500 hover:text-blue-700"
        >
          ← Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{cluster.topic}</h1>
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Clusters
          </Link>
        </div>

        <div className="space-y-8">
          {/* Summary */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Summary</h2>
            <p className="text-gray-700">{cluster.summary}</p>
          </section>

          {/* Articles */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Articles</h2>
            <div className="grid gap-4">
              {cluster.articles.map((article, i) => (
                <MotionDiv
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Source: {article.source}
                    </p>
                  </a>
                </MotionDiv>
              ))}
            </div>
          </section>

          {/* Actions */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href={`/clusters/${params.clusterId}/debate`}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold">Basic Debate</h3>
                <p className="text-gray-600">Start a basic debate between personas</p>
              </Link>
              <Link
                href={`/clusters/${params.clusterId}/debate/threaded`}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold">Threaded Debate</h3>
                <p className="text-gray-600">Start a threaded debate with replies</p>
              </Link>
            </div>
          </section>
        </div>
      </MotionDiv>
    </div>
  )
}
