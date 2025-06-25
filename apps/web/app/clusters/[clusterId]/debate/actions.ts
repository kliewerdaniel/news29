'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'

async function generateResponse(
  cluster: { topic: string; summary: string },
  persona: { name: string; traits: any },
  round: number,
  repliesTo?: { persona: string; text: string }[]
): Promise<string> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/debate`, {
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

export async function generateDebateResponses(
  cluster: { topic: string; summary: string },
  personas: { name: string; traits: any }[],
  round: number,
  previousResponses?: { persona: string; text: string }[]
) {
  const responses = await Promise.all(
    personas.map(async (persona) => {
      const text = await generateResponse(cluster, persona, round, previousResponses);
      return {
        persona,
        text,
        round
      };
    })
  );

  return responses;
}

export async function revalidateDebatePage(clusterId: string) {
  revalidatePath(`/clusters/${clusterId}/debate`);
  revalidatePath(`/clusters/${clusterId}/debate/threaded`);
}

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

export async function saveBasicDebateLog(
  clusterSlug: string,
  personas: Persona[],
  responses: DebateResponse[]
) {
  const threadLog = {
    clusterSlug,
    createdAt: new Date().toISOString(),
    personas: personas.map((p: Persona) => ({
      slug: p.slug,
      name: p.name,
      traits: p.traits
    })),
    rounds: [
      {
        round: 1,
        responses: responses.map(r => ({
          personaSlug: r.persona.slug,
          text: r.text,
          replyTo: null
        }))
      }
    ]
  }

  // Ensure debates directory exists and save log
  const debatesDir = path.join(process.cwd(), 'data/debates')
  const dateStr = format(new Date(), 'yyyyMMdd')
  const filePath = path.join(debatesDir, `${clusterSlug}-${dateStr}-basic.json`)

  await fs.mkdir(debatesDir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(threadLog, null, 2), 'utf-8')

  return `/data/debates/${clusterSlug}-${dateStr}-basic.json`
}

export async function saveThreadedDebateLog(
  clusterSlug: string,
  personas: Persona[],
  firstRound: DebateResponse[],
  secondRound: DebateResponse[]
) {
  const threadLog = {
    clusterSlug,
    createdAt: new Date().toISOString(),
    personas: personas.map((p: Persona) => ({
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
  const filePath = path.join(debatesDir, `${clusterSlug}-${dateStr}-threaded.json`)

  await fs.mkdir(debatesDir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(threadLog, null, 2), 'utf-8')

  return `/data/debates/${clusterSlug}-${dateStr}-threaded.json`
}
