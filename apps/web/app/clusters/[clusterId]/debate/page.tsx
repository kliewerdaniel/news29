import { MotionDiv } from '@/components/motion-wrapper'
import { loadClusterBySlug } from '../../actions'
import { loadPersonas } from './data'
import { saveBasicDebateLog } from './actions'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

interface DebateResponse {
  persona: {
    name: string;
    traits: string[] | Record<string, number>;
    slug: string;
  };
  text: string;
  round: number;
}

async function generateDebateResponse(
  persona: { name: string; traits: any },
  topic: string,
  summary: string
): Promise<string> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/debate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      persona,
      cluster: {
        title: topic,
        description: summary
      }
    })
  });

  if (!response.ok) {
    throw new Error("Failed to generate debate response");
  }

  const { output } = await response.json();
  return output;
}

function getEmotionEmoji(text: string): string[] {
  const emojis: string[] = [];
  
  if (/strong|firm|assert|argue|must|never|always/i.test(text)) {
    emojis.push("💪");
  }
  if (/disagree|wrong|incorrect|false|untrue/i.test(text)) {
    emojis.push("🚫");
  }
  if (/agree|concur|true|right|correct/i.test(text)) {
    emojis.push("✅");
  }
  if (/think|believe|consider|analyze|reflect/i.test(text)) {
    emojis.push("🧠");
  }
  if (/criticize|challenge|question|doubt/i.test(text)) {
    emojis.push("🔥");
  }
  
  return emojis;
}

export default async function DebatePage({
  params,
}: {
  params: { clusterId: string };
}) {
  // Load data in parallel
  const [cluster, personas] = await Promise.all([
    loadClusterBySlug(params.clusterId),
    loadPersonas()
  ]);

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
    );
  }

  // Generate debate responses
  const responses = await Promise.all(
    personas.map(async (persona) => ({
      persona,
      text: await generateDebateResponse(persona, cluster.topic, cluster.summary),
      round: 1
    }))
  );

  // Save debate log
  const savedPath = await saveBasicDebateLog(params.clusterId, personas, responses);
  console.log(`Debate saved to ${savedPath}`);

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
            href={`/clusters/${params.clusterId}`}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Cluster
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Summary</h2>
          <p className="text-gray-700">{cluster.summary}</p>
        </div>

        <div className="space-y-6">
          {responses.map((response, i) => (
            <MotionDiv
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{response.persona.name}</h3>
                  <div className="text-2xl">
                    {getEmotionEmoji(response.text).map((emoji, i) => (
                      <span key={i} className="ml-1" title="Emotion marker">
                        {emoji}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="whitespace-pre-wrap">{response.text}</div>
              </Card>
            </MotionDiv>
          ))}
        </div>
      </MotionDiv>
    </div>
  );
}
