'use client'

import { FC, useState, useEffect } from 'react'
import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import TraitEvolutionChart from '@/components/persona/TraitEvolutionChart'
import ExportDigest from '@/components/persona/ExportDigest'
import ExportPDF from '@/components/persona/ExportPDF'

// Types
interface PersonaYearSummary {
  personaName: string
  year: number
  articlesWritten: number  
  debatesJoined: number
  majorTopics: string[]
  mostFrequentTraitShift: {
    trait: string
    direction: 'up' | 'down'
    delta: number
  }
  evolutionPath: Array<{
    date: string
    traits: Record<string, number>
  }>
  topQuote: string
}

interface PageProps {
  params: {
    slug: string
  }
}

async function loadPersonaData(slug: string, year: number) {
  // Get all YAML files for this persona
  const personaDir = path.join(process.cwd(), 'data/personas', slug)
  const yamlFiles = await fs.readdir(personaDir)
  
  const yearData = []
  
  for (const file of yamlFiles) {
    if (file.endsWith('.yaml')) {
      const filePath = path.join(personaDir, file)
      const content = await fs.readFile(filePath, 'utf8')
      const data = yaml.load(content) as any
      
      // Only include if from selected year
      if (new Date(data.createdAt).getFullYear() === year) {
        yearData.push(data)
      }
    }
  }

  return yearData
}

async function loadArticles(slug: string, year: number) {
  const articlesDir = path.join(process.cwd(), 'data/articles', slug)
  
  try {
    const files = await fs.readdir(articlesDir)
    const articles = []

    for (const file of files) {
      const filePath = path.join(articlesDir, file)
      const stats = await fs.stat(filePath)
      
      if (stats.birthtime.getFullYear() === year) {
        const content = await fs.readFile(filePath, 'utf8')
        articles.push({
          filename: file,
          content
        })
      }
    }

    return articles
  } catch (e) {
    // Directory may not exist
    return []
  }
}

async function loadDebates(slug: string, year: number) {
  const debatesDir = path.join(process.cwd(), 'data/debates')
  const files = await fs.readdir(debatesDir)
  const debates = []

  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(debatesDir, file)
      const content = await fs.readFile(filePath, 'utf8')
      const debate = JSON.parse(content)
      
      if (
        debate.createdAt && 
        new Date(debate.createdAt).getFullYear() === year &&
        debate.participants?.includes(slug)
      ) {
        debates.push(debate)
      }
    }
  }

  return debates
}

async function generateSummary(
  slug: string,
  year: number
): Promise<PersonaYearSummary> {
  const personaData = await loadPersonaData(slug, year)
  const articles = await loadArticles(slug, year) 
  const debates = await loadDebates(slug, year)

  // Calculate evolution path
  const evolutionPath = personaData
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(data => ({
      date: data.createdAt,
      traits: data.traits || {}
    }))

  // Find most changed trait
  const traitDeltas: Record<string, number> = {}
  if (evolutionPath.length >= 2) {
    const firstTraits = evolutionPath[0].traits
    const lastTraits = evolutionPath[evolutionPath.length - 1].traits
    
    for (const trait in lastTraits) {
      if (trait in firstTraits) {
        traitDeltas[trait] = lastTraits[trait] - firstTraits[trait]
      }
    }
  }

  const mostChangedTrait = Object.entries(traitDeltas)
    .reduce((max, [trait, delta]) => 
      Math.abs(delta) > Math.abs(max[1]) ? [trait, delta] : max, 
      ['', 0]
    )

  // Extract topics from articles and debates
  const topics = [
    ...articles.map(a => a.filename.replace('.mdx','').split('-')),
    ...debates.flatMap(d => d.topics || [])
  ].flat()

  // Count topic frequency
  const topicFreq: Record<string, number> = {}
  topics.forEach(t => topicFreq[t] = (topicFreq[t] || 0) + 1)
  
  const majorTopics = Object.entries(topicFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic)

  // Get top quote (simplified - could be enhanced)
  const topQuote = articles[0]?.content.split('\n')[0] || ''

  return {
    personaName: slug,
    year,
    articlesWritten: articles.length,
    debatesJoined: debates.length,
    majorTopics,
    mostFrequentTraitShift: {
      trait: mostChangedTrait[0],
      direction: mostChangedTrait[1] > 0 ? 'up' : 'down',
      delta: Math.abs(mostChangedTrait[1])
    },
    evolutionPath,
    topQuote
  }
}

const YearSelector = ({ value, onChange }: { value: number, onChange: (year: number) => void }) => {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <Select value={value.toString()} onValueChange={val => onChange(parseInt(val))}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select year" />
      </SelectTrigger>
      <SelectContent>
        {years.map(year => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const Page: FC<PageProps> = ({ params }) => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [summary, setSummary] = useState<PersonaYearSummary | null>(null)

  useEffect(() => {
    const loadSummary = async () => {
      const data = await generateSummary(params.slug, year)
      setSummary(data)
    }
    loadSummary()
  }, [params.slug, year])

  if (!summary) {
    return <div>Loading...</div>
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {summary.personaName}'s {summary.year} in Review
      </h1>

      <div id="year-review-content" className="grid gap-6">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Select Year:</span>
            <YearSelector value={year} onChange={setYear} />
          </div>
          <div className="flex items-center gap-2">
            <ExportDigest 
              data={summary} 
              filename={`${summary.personaName}-${summary.year}-digest.json`}
            />
            <ExportPDF
              contentId="year-review-content"
              filename={`${summary.personaName}-${summary.year}-review.pdf`}
            />
          </div>
        </div>
        
        {/* Activity Summary */}
        <div className="bg-card rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Activity Summary</h2>
          <p>
            Wrote {summary.articlesWritten} articles and joined {summary.debatesJoined} debates
          </p>
          <p className="mt-2">
            Major topics: {summary.majorTopics.join(', ')}
          </p>
        </div>

        {/* Trait Evolution Charts */}
        <div className="bg-card rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Trait Evolution</h2>
          {summary.mostFrequentTraitShift.trait && (
            <p className="mb-6">
              {summary.mostFrequentTraitShift.trait} went {' '}
              {summary.mostFrequentTraitShift.direction} by{' '}
              {summary.mostFrequentTraitShift.delta.toFixed(2)} points
            </p>
          )}
          <TraitEvolutionChart data={summary.evolutionPath} />
        </div>

        {/* Top Quote */}
        {summary.topQuote && (
          <div className="bg-card rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Memorable Quote</h2>
            <blockquote className="border-l-4 border-primary pl-4 italic">
              {summary.topQuote}
            </blockquote>
          </div>
        )}
      </div>
    </main>
  )
}

export default Page
