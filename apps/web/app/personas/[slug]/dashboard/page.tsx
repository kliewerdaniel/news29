import { MotionDiv } from '@/components/motion-wrapper';
import { loadPersonaVersions } from './actions';
import VersionComparer from '@/components/persona/VersionComparer';
import Link from 'next/link';
import yaml from 'js-yaml';

interface PersonaForComparison {
  name: string;
  [key: string]: string | number;
}

export default async function DashboardPage({
  params,
}: {
  params: { slug: string };
}) {
  const versions = await loadPersonaVersions(params.slug);

  if (versions.length > 1) {
    // Get the latest two versions for initial comparison
    const [latest, previous] = versions;
    
    // Prepare version names
    const versionNames = versions.map(v => v.version);

    // Convert traits to the expected format
    function convertToPersona(version: typeof versions[0]): PersonaForComparison {
      const traits = typeof version.traits === 'object' && !Array.isArray(version.traits)
        ? version.traits
        : (version.traits as string[]).reduce((acc, trait) => ({
            ...acc,
            [trait]: 1
          }), {});

      return {
        name: params.slug,
        ...traits
      };
    }

    // Prepare initial personas
    const initialPersonaA = convertToPersona(latest);
    const initialPersonaB = convertToPersona(previous);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <Link
              href={`/personas/${params.slug}`}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Overview
            </Link>
          </div>

          <div className="space-y-8">
            {/* Version History */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Version History</h2>
              <div className="space-y-4">
                <VersionComparer 
                  slug={params.slug}
                  versions={versionNames}
                  initialPersonaA={initialPersonaA}
                  initialPersonaB={initialPersonaB}
                  initialVersionA={latest.version}
                  initialVersionB={previous.version}
                />
              </div>
            </section>

            {/* Quick Links */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href={`/personas/${params.slug}/articles`}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold">Articles</h3>
                  <p className="text-gray-600">View all articles written by this persona</p>
                </Link>
                <Link
                  href={`/personas/${params.slug}/year-in-review`}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold">Year in Review</h3>
                  <p className="text-gray-600">See this persona's evolution over the past year</p>
                </Link>
              </div>
            </section>
          </div>
        </MotionDiv>
      </div>
    );
  }

  // Return a simpler view when there's no version history
  return (
    <div className="max-w-4xl mx-auto p-6">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link
            href={`/personas/${params.slug}`}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Overview
          </Link>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Version History</h2>
            <div className="space-y-4">
              <p className="text-gray-600">No version history available.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href={`/personas/${params.slug}/articles`}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold">Articles</h3>
                <p className="text-gray-600">View all articles written by this persona</p>
              </Link>
              <Link
                href={`/personas/${params.slug}/year-in-review`}
                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold">Year in Review</h3>
                <p className="text-gray-600">See this persona's evolution over the past year</p>
              </Link>
            </div>
          </section>
        </div>
      </MotionDiv>
    </div>
  );
}
