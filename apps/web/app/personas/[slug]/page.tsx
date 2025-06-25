import { MotionDiv } from '@/components/motion-wrapper';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { loadLatestPersonaVersion } from './dashboard/actions';

interface TabConfig {
  key: string;
  label: string;
  href: string;
  description: string;
}

const tabs: TabConfig[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    description: 'Overview and metrics'
  },
  {
    key: 'articles',
    label: 'Articles',
    href: '/articles',
    description: 'Published articles'
  },
  {
    key: 'year-in-review',
    label: 'Year in Review',
    href: '/year-in-review',
    description: 'Annual analysis'
  },
];

export default async function PersonaPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const persona = await loadLatestPersonaVersion(params.slug)
  
  if (!persona) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Persona not found</h1>
        <Link 
          href="/"
          className="text-blue-500 hover:text-blue-700"
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{persona.name}</h1>
              <p className="text-gray-500">Last updated: {persona.date}</p>
            </div>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Home
            </Link>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Traits</h2>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(persona.traits) ? (
                // Display traits as tags for array format
                persona.traits.map((trait, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {trait}
                  </span>
                ))
              ) : (
                // Display traits as bars for numeric format
                Object.entries(persona.traits).map(([trait, value]) => (
                  <div key={trait} className="w-full">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{trait}</span>
                      <span className="text-sm text-gray-600">{value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 rounded-full h-2"
                        style={{ width: `${(value as number) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className={cn(
                    'data-[state=active]:bg-blue-100',
                    'data-[state=active]:text-blue-900'
                  )}
                  asChild
                >
                  <Link href={`/personas/${params.slug}${tab.href}`}>
                    {tab.label}
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map(tab => (
              <TabsContent
                key={tab.key}
                value={tab.key}
                className="mt-4"
              >
                <Card className="p-6">
                  <p className="text-gray-600">
                    {tab.description}
                  </p>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </MotionDiv>
    </div>
  );
}
