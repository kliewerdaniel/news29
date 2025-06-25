import { useState } from 'react'
import yaml from 'js-yaml'
import { format } from 'date-fns'

type Trait = {
  name: string
  value: number
}

type PersonaYAML = {
  name: string
  slug: string
  tags: string[]
  traits: Record<string, number>
  [key: string]: any // Allow other fields
}

export const useEvolveTraits = () => {
  const [isEvolving, setIsEvolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeTraitAlignment = async (
    trait: string,
    originalValue: number,
    debateText: string
  ): Promise<number> => {
    try {
      const response = await fetch('/api/llm/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trait, originalValue, debateText })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze trait')
      }

      const { value: newValue } = await response.json()

      // Validate the response is within bounds
      if (isNaN(newValue) || newValue < 0 || newValue > 1) {
        throw new Error('Invalid trait value returned')
      }

      return newValue
    } catch (err) {
      console.error(`Error analyzing trait ${trait}:`, err)
      return originalValue // Fallback to original value on error
    }
  }

  const evolvePersona = async (
    persona: PersonaYAML,
    debateText: string
  ): Promise<PersonaYAML | null> => {
    setIsEvolving(true)
    setError(null)

    try {
      // Create evolved traits object
      const evolvedTraits: Record<string, number> = {}
      
      // Analyze each trait
      for (const [trait, value] of Object.entries(persona.traits)) {
        const newValue = await analyzeTraitAlignment(trait, value, debateText)
        evolvedTraits[trait] = Number(newValue.toFixed(2)) // Round to 2 decimal places
      }

      // Create new YAML with evolved traits
      const timestamp = format(new Date(), 'yyyyMMdd-HHmmss')
      const evolvedPersona: PersonaYAML = {
        ...persona,
        traits: evolvedTraits,
        version: `${timestamp}-evolved`
      }

      // Save evolved persona
      const yamlStr = yaml.dump(evolvedPersona)
      const response = await fetch(`/api/personas/${persona.slug}/${timestamp}-evolved`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/yaml' },
        body: yamlStr
      })

      if (!response.ok) {
        throw new Error('Failed to save evolved persona')
      }

      return evolvedPersona
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evolve traits')
      return null
    } finally {
      setIsEvolving(false)
    }
  }

  return {
    evolvePersona,
    isEvolving,
    error
  }
}
