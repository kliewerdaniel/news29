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
import type { NewsCluster, Persona } from "@/app/clusters/[slug]/page"
import { Loader2 } from "lucide-react"

interface GenerateOpinionProps {
  personas: (Persona & { slug: string })[]
  cluster: NewsCluster
}

export function GenerateOpinion({ personas, cluster }: GenerateOpinionProps) {
  const [selectedPersona, setSelectedPersona] = useState<string>("")
  const [opinion, setOpinion] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const handleGenerate = async () => {
    const persona = personas.find((p) => p.slug === selectedPersona)
    if (!persona) return

    try {
      startTransition(async () => {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            persona,
            cluster,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate opinion")
        }

        const data = await response.json()
        setOpinion(data.output)
      })
    } catch (error) {
      console.error("Error generating opinion:", error)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Generate Persona Opinion</h2>
      <div className="flex gap-4 items-end mb-4">
        <div className="flex-1">
          <Select value={selectedPersona} onValueChange={setSelectedPersona}>
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
        <Button
          onClick={handleGenerate}
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
      </div>

      {opinion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">
              Generated Opinion by{" "}
              {personas.find((p) => p.slug === selectedPersona)?.name}
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{opinion}</p>
          </Card>
        </motion.div>
      )}
    </section>
  )
}
