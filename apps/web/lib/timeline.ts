'use server'

import { promises as fs } from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export interface TimelineEvent {
  date: string
  event: string
  type: string
  personaSlug?: string
  clusterSlug?: string
}

interface PersonaData {
  name: string;
  date: string;
  traits: string[] | Record<string, number>;
}

interface ClusterData {
  topic: string;
  summary: string;
}

export async function loadTimelineData(): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = []

  // Load persona updates
  const personasDir = path.join(process.cwd(), 'data/personas')
  const personaSlugs = await fs.readdir(personasDir)

  for (const slug of personaSlugs) {
    try {
      const personaDir = path.join(personasDir, slug)
      const stat = await fs.stat(personaDir)
      
      if (!stat.isDirectory()) continue

      const files = await fs.readdir(personaDir)
      const yamlFiles = files.filter(file => file.endsWith('.yaml'))
      
      if (yamlFiles.length === 0) continue

      // Get latest version
      yamlFiles.sort().reverse()
      const latestVersion = yamlFiles[0]
      
      const content = await fs.readFile(
        path.join(personaDir, latestVersion),
        'utf-8'
      )
      
      const data = yaml.load(content) as PersonaData
      
      if (data.date) {
        events.push({
          date: data.date,
          event: `${data.name} persona updated`,
          type: 'persona_update',
          personaSlug: slug
        })
      }
    } catch (error) {
      console.error(`Error loading persona ${slug}:`, error)
    }
  }

  // Load cluster events
  const clustersDir = path.join(process.cwd(), 'data/clusters')
  const clusterFiles = await fs.readdir(clustersDir)
  const jsonFiles = clusterFiles.filter(file => file.endsWith('.json'))

  for (const file of jsonFiles) {
    try {
      const content = await fs.readFile(path.join(clustersDir, file), 'utf-8')
      const data = JSON.parse(content) as ClusterData
      const slug = file.replace('.json', '')

      events.push({
        date: new Date().toISOString(), // Use current date or add a created_at field to clusters
        event: `New news cluster: ${data.topic}`,
        type: 'cluster_created',
        clusterSlug: slug
      })
    } catch (error) {
      console.error(`Error loading cluster ${file}:`, error)
    }
  }

  // Sort by date, newest first
  return events.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

// Alias for backward compatibility
export const loadTimeline = loadTimelineData
