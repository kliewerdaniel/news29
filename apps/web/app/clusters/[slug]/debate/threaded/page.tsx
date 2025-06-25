import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { format } from 'date-fns'
import { toast } from '@/components/ui/use-toast'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GuestJoinPanel, GuestPersona } from '@/components/debate/GuestJoinPanel'

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

interface Article {
  title: string
  url: string
  source: string
}

interface Cluster {
  topic: string
  summary: string
  articles: Article[]
}

async function loadClusterData(slug: string): Promise<Cluster> {
  const filePath = path.join(process.cwd(), 'data/clusters', `${slug}.json`)
  const data = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(data)
}

async function loadPersonas(): Promise<Persona[]> {
  const personasDir = path.join(process.cwd(), 'data/personas')
  const personas: Persona[] = []
  
  const entries = await fs.readdir(personasDir, { withFileTypes: true })
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const personaDir = path.join(personasDir, entry.name)
      const files = await fs.readdir(personaDir)
      
      // Get most recent yaml file
      const yamlFiles = files
        .filter(f => f.endsWith('.yaml'))
        .sort((a, b) => b.localeCompare(a))
        
      if (yamlFiles.length > 0) {
        const yamlPath = path.join(personaDir, yamlFiles[0])
        const content = await fs.readFile(yamlPath, 'utf-8')
        const persona = yaml.load(content) as Persona
        persona.slug = entry.name
        personas.push(persona)
      }
    }
  }

  return personas
}

async function generateResponse(
  cluster: Cluster,
  persona: Persona,
  round: number,
  repliesTo?: { persona: string; text: string }[]
): Promise<string> {
  const response = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      persona,
      cluster: {
        title: cluster.topic,
        description: cluster.summary
      },
      round,
      repliesTo
    })
  });

  if (!response.ok) {
    throw new Error("Failed to generate debate response");
  }

  const { output } = await response.json();
  return output;
}

async function generateFirstRound(cluster: Cluster, personas: Persona[]): Promise<DebateResponse[]> {
  const responses = await Promise.all(
    personas.map(async (persona) => {
      const text = await generateResponse(cluster, persona, 1);
      return {
        persona,
        text,
        round: 1
      };
    })
  );

  return responses;
}

async function generateSecondRound(
  cluster: Cluster, 
  personas: Persona[], 
  firstRound: DebateResponse[]
): Promise<DebateResponse[]> {
  const responses = await Promise.all(
    personas.map(async (persona) => {
      // Randomly select 1-2 previous responses to reply to
      const otherResponses = firstRound.filter(r => r.persona.slug !== persona.slug);
      const numReplies = Math.floor(Math.random() * 2) + 1;
      const selectedResponses = otherResponses
        .sort(() => Math.random() - 0.5)
        .slice(0, numReplies);

      const text = await generateResponse(
        cluster,
        persona,
        2,
        selectedResponses.map(r => ({
          persona: r.persona.name,
          text: r.text
        }))
      );

      return {
        persona,
        text,
        round: 2,
        replyTo: selectedResponses.map(r => r.persona.slug)
      };
    })
  );

  return responses;
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
    <motion.div
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
    </motion.div>
  )
}

function calculateReplyLines(
  responses: DebateResponse[],
  round: number
): { [key: string]: { start: { x: number; y: number }; end: { x: number; y: number } }[] } {
  const replyLines: { [key: string]: { start: { x: number; y: number }; end: { x: number; y: number } }[] } = {};
  
  if (round === 2) {
    responses.forEach((response, i) => {
      if (response.replyTo && response.replyTo.length > 0) {
        replyLines[response.persona.slug] = response.replyTo.map(targetSlug => ({
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
  params: { slug: string }
}) {
  const [showGuestPanel, setShowGuestPanel] = useState(false)
  const [guestResponses, setGuestResponses] = useState<DebateResponse[]>([])
  
  const cluster = await loadClusterData(params.slug)
  const personas = await loadPersonas()
  
  const firstRound = await generateFirstRound(cluster, personas)
  const secondRound = await generateSecondRound(cluster, personas, firstRound)
  
  const allResponses = [...firstRound, ...secondRound, ...guestResponses]

  // Save debate log
  const threadLog = {
    clusterSlug: params.slug,
    createdAt: new Date().toISOString(),
    personas: personas.map(p => ({
      slug: p.slug,
      name: p.name,
      traits: p.traits
    })),
    rounds: [
      {
        round: 1,
        responses: firstRound.map(r => ({
          personaSlug: r.persona.slug,
          text: r.text,
          replyTo: null
        }))
      },
      {
        round: 2,
        responses: secondRound.map(r => ({
          personaSlug: r.persona.slug,
          text: r.text,
          replyTo: r.replyTo || null
        }))
      }
    ]
  }

  // Ensure debates directory exists and save log
  const debatesDir = path.join(process.cwd(), 'data/debates')
  const dateStr = format(new Date(), 'yyyyMMdd')
  const filePath = path.join(debatesDir, `${params.slug}-${dateStr}.json`)

  await fs.mkdir(debatesDir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(threadLog, null, 2), 'utf-8')

  // Log to console and show success toast
  const savedPath = `/data/debates/${params.slug}-${dateStr}.json`
  console.log(`Debate saved to ${savedPath}`)

  const handleGuestSubmit = async (guestPersona: GuestPersona) => {
    const guestResponse: DebateResponse = {
      persona: {
        name: guestPersona.name,
        slug: guestPersona.slug,
        traits: guestPersona.traits,
        isGuest: true
      },
      text: guestPersona.text,
      round: guestPersona.round,
      replyTo: guestPersona.replyTo
    }

    setGuestResponses(prev => [...prev, guestResponse])
    setShowGuestPanel(false)

    // Update and save thread log
    const updatedLog = { ...threadLog }
    const roundIndex = guestPersona.round - 1

    if (!updatedLog.rounds[roundIndex]) {
      updatedLog.rounds[roundIndex] = {
        round: guestPersona.round,
        responses: []
      }
    }

    updatedLog.rounds[roundIndex].responses.push({
      personaSlug: guestPersona.slug,
      text: guestPersona.text,
      replyTo: guestPersona.replyTo || null
    })

    // Save updated log
    await fs.writeFile(filePath, JSON.stringify(updatedLog, null, 2), 'utf-8')
    toast({
      title: "Guest Response Added",
      description: "Your response has been added to the debate",
      duration: 3000
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">{cluster.topic} - Threaded Debate</h1>

      {/* Guest Join Button */}
      <div className="mb-8">
        <Button 
          onClick={() => setShowGuestPanel(!showGuestPanel)}
          variant={showGuestPanel ? "secondary" : "default"}
        >
          {showGuestPanel ? "Cancel" : "Join as Guest"}
        </Button>
      </div>

      {/* Guest Join Panel */}
      {showGuestPanel && (
        <GuestJoinPanel
          onSubmit={handleGuestSubmit}
          existingPersonas={personas.map(p => ({ name: p.name, slug: p.slug }))}
          currentRound={Math.max(...allResponses.map(r => r.round))}
        />
      )}
      
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
    </div>
  )
}
