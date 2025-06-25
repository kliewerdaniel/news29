import { saveThreadedDebateLog, generateDebateResponses } from '../actions'
import { MotionDiv } from '@/components/motion-wrapper'
import { Card } from '@/components/ui/card'
import { GuestPanel } from './guest-panel'
import { loadClusterData, loadPersonas } from '../data'
import Link from 'next/link'

interface Persona {
  name: string
  traits: string[] | Record<string, number>
  slug: string
  isGuest?: boolean
}

interface DebateResponse {
  persona: Persona
  text: string
  round: number
  replyTo?: string[]
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

function ResponseCard({ response, replyLines }: { 
  response: DebateResponse;
  replyLines?: { start: { x: number; y: number }; end: { x: number; y: number } }[];
}) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        {replyLines?.map((line, i) => (
          <svg
            key={i}
            className="absolute pointer-events-none"
            style={{
              top: -Math.abs(line.end.y - line.start.y),
              left: 0,
              width: "100%",
              height: Math.abs(line.end.y - line.start.y),
              zIndex: -1
            }}
          >
            <path
              d={`M ${line.start.x} ${line.start.y} C ${line.start.x} ${(line.start.y + line.end.y) / 2}, ${line.end.x} ${(line.start.y + line.end.y) / 2}, ${line.end.x} ${line.end.y}`}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>
        ))}
        <Card className={`p-6 mb-4 ${response.persona.isGuest ? 'border-blue-400 border-2' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-bold">{response.persona.name}</h3>
            {response.persona.isGuest && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                🧑‍💻 Guest
              </span>
            )}
          {response.round === 1 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Opening Statement
            </span>
          )}
          {response.round === 2 && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              Rebuttal
            </span>
          )}
          </div>
          <div className="text-2xl">
            {getEmotionEmoji(response.text).map((emoji, i) => (
              <span key={i} className="ml-1" title="Emotion marker">
                {emoji}
              </span>
            ))}
          </div>
        </div>
        
        {response.replyTo && response.replyTo.length > 0 && (
          <div className="mb-2 text-sm text-gray-500">
            Replying to: {response.replyTo.join(', ')}
          </div>
        )}
        
        <div className="whitespace-pre-wrap">{response.text}</div>
      </Card>
      </div>
    </MotionDiv>
  )
}

function calculateReplyLines(
  responses: DebateResponse[],
  round: number
): { [key: string]: { start: { x: number; y: number }; end: { x: number; y: number } }[] } {
  const replyLines: { [key: string]: { start: { x: number; y: number }; end: { x: number; y: number } }[] } = {};
  
  if (round === 2) {
    responses.forEach(response => {
      if (response.replyTo && response.replyTo.length > 0) {
        replyLines[response.persona.slug] = response.replyTo.map(() => ({
          start: { x: 50, y: 0 }, // Will be positioned relative to response card
          end: { x: 50, y: 100 } // Height will be calculated based on actual positions
        }));
      }
    });
  }
  
  return replyLines;
}

export default async function ThreadedDebatePage({ 
  params 
}: { 
  params: { clusterId: string }
}) {
  // Load data in parallel
  const [cluster, personas] = await Promise.all([
    loadClusterData(params.clusterId),
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

  // Generate first round responses
  const firstRound = await generateDebateResponses(
    { topic: cluster.topic, summary: cluster.summary },
    personas.map(p => ({ name: p.name, traits: p.traits })),
    1
  ) as DebateResponse[]

  // Generate second round responses with references to first round
  const secondRound = await Promise.all(
    personas.map(async (persona) => {
      // Randomly select 1-2 previous responses to reply to
      const otherResponses = firstRound.filter(r => r.persona.name !== persona.name);
      const numReplies = Math.floor(Math.random() * 2) + 1;
      const selectedResponses = otherResponses
        .sort(() => Math.random() - 0.5)
        .slice(0, numReplies);

      const responses = await generateDebateResponses(
        { topic: cluster.topic, summary: cluster.summary },
        [{ name: persona.name, traits: persona.traits }],
        2,
        selectedResponses.map(r => ({
          persona: r.persona.name,
          text: r.text
        }))
      ) as DebateResponse[]

      const response = responses[0]
      return {
        ...response,
        replyTo: selectedResponses.map(r => r.persona.slug)
      }
    })
  )
  
  const allResponses = [...firstRound, ...secondRound]

  // Save debate log
  const savedPath = await saveThreadedDebateLog(params.clusterId, personas, firstRound, secondRound)
  console.log(`Debate saved to ${savedPath}`)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{cluster.topic} - Threaded Debate</h1>
          <Link
            href={`/clusters/${params.clusterId}`}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Cluster
          </Link>
        </div>

        <GuestPanel 
          personas={personas.map(p => ({ name: p.name, slug: p.slug }))}
          currentRound={Math.max(...allResponses.map(r => r.round))}
        />
        
        <div className="space-y-8">
          {[1, 2].map(round => (
            <div key={round}>
              <h2 className="text-2xl font-semibold mb-4">
                Round {round}
              </h2>
              <div className="space-y-4">
                {allResponses
                  .filter(r => r.round === round)
                  .map((response, i) => (
                    <ResponseCard 
                      key={i} 
                      response={response}
                      replyLines={calculateReplyLines(allResponses, round)[response.persona.slug]}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </MotionDiv>
    </div>
  )
}
