"use client"

import { useState, useTransition } from "react"
import { motion } from "framer-motion"
import * as yaml from "js-yaml"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { NewsCluster, Persona } from "@/app/clusters/[slug]/page"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"

interface PromptComposerProps {
  personas: (Persona & { slug: string })[]
  cluster: NewsCluster
}

type PromptFormData = {
  persona: string
  tone: string
  style: string
  length: number
  focus: string
}

const toneOptions = [
  "Neutral",
  "Humorous",
  "Sarcastic",
  "Serious",
  "Empathetic",
  "Skeptical",
]

const styleOptions = [
  "Op-ed",
  "Tweet",
  "Debate",
  "Fiction Monologue",
  "Letter to Editor",
]

export function PromptComposer({ personas, cluster }: PromptComposerProps) {
  const [opinion, setOpinion] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  
  const { register, handleSubmit, watch, setValue } = useForm<PromptFormData>({
    defaultValues: {
      persona: "",
      tone: "Neutral",
      style: "Op-ed",
      length: 500,
      focus: "",
    },
  })

  const selectedPersona = watch("persona")

  const onSubmit = async (data: PromptFormData) => {
    const persona = personas.find((p) => p.slug === data.persona)
    if (!persona) return

    try {
      startTransition(async () => {
        // Fetch the persona's YAML traits
        const response = await fetch(`/api/personas/${data.persona}/latest`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch persona traits")
        }
        
        const traitData = await response.json()
        const traitString = Object.entries(traitData)
          .filter(([key]) => key !== "name")
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")

        // Construct the enhanced prompt
        const prompt = `
          You are a persona with these traits:
          ${traitString}
          
          Topic: ${cluster.topic}
          Summary: ${cluster.summary}
          Style: ${data.style}
          Tone: ${data.tone}
          Target length: ${data.length} words
          Special instructions: ${data.focus}
          
          Write a ${data.style}-style response in the voice of this persona.
        `

        const generateResponse = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            persona,
            cluster,
            prompt,
          }),
        })

        if (!generateResponse.ok) {
          throw new Error("Failed to generate opinion")
        }

        const generateData = await generateResponse.json()
        setOpinion(generateData.output)
      })
    } catch (error) {
      console.error("Error generating opinion:", error)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Generate Persona Opinion</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="persona">Persona</Label>
            <Select
              value={selectedPersona}
              onValueChange={(value) => setValue("persona", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a persona" />
              </SelectTrigger>
              <SelectContent>
                {personas.map((persona) => (
                  <SelectItem key={persona.slug} value={persona.slug}>
                    {persona.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select
              value={watch("tone")}
              onValueChange={(value) => setValue("tone", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((tone) => (
                  <SelectItem key={tone} value={tone}>
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select
              value={watch("style")}
              onValueChange={(value) => setValue("style", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus">Topic Focus</Label>
            <Input
              placeholder="e.g., Focus on economic consequences"
              {...register("focus")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Length (words): {watch("length")}</Label>
          <Slider
            value={[watch("length")]}
            onValueChange={(value) => setValue("length", value[0])}
            min={100}
            max={1000}
            step={50}
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={!selectedPersona || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Opinion"
          )}
        </Button>
      </form>

      {opinion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">
              Custom Generated Opinion by{" "}
              {personas.find((p) => p.slug === selectedPersona)?.name}
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{opinion}</p>
          </Card>
        </motion.div>
      )}
    </section>
  )
}
