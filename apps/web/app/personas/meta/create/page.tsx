"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { mergeTraits } from "@/lib/personas/mergeTraits";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { TraitProgressBar } from "@/components/persona/TraitProgressBar";

type Persona = {
  slug: string;
  name: string;
  traits: Record<string, number>;
  style?: string;
  tone?: string;
};

type MergeStrategy = "average" | "maximize" | "minimize" | "weighted";

export default function CreateMetaPersona() {
  const [availablePersonas, setAvailablePersonas] = useState<Persona[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [strategy, setStrategy] = useState<MergeStrategy>("average");
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [tone, setTone] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load available personas
  useEffect(() => {
    const loadPersonas = async () => {
      try {
        const response = await fetch("/api/personas");
        const data = await response.json();
        setAvailablePersonas(data);
      } catch (error) {
        console.error("Failed to load personas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersonas();
  }, []);

  // Calculate merged traits
  const mergedTraits = useMemo(() => {
    if (selectedPersonas.length === 0) return {};
    return mergeTraits(selectedPersonas, strategy, weights);
  }, [selectedPersonas, strategy, weights]);

  // Handle persona selection
  const togglePersona = useCallback((persona: Persona) => {
    setSelectedPersonas(prev => {
      const isSelected = prev.some(p => p.slug === persona.slug);
      if (isSelected) {
        // Remove persona and its weight
        const newWeights = { ...weights };
        delete newWeights[persona.slug];
        setWeights(newWeights);
        return prev.filter(p => p.slug !== persona.slug);
      } else {
        // Add persona with default weight
        setWeights(prev => ({ ...prev, [persona.slug]: 1 }));
        return [...prev, persona];
      }
    });
  }, [weights]);

  // Handle weight changes
  const updateWeight = useCallback((slug: string, value: number) => {
    setWeights(prev => ({ ...prev, [slug]: value }));
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPersonas.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const metaPersona = {
      name,
      slug,
      description,
      style,
      tone,
      tags,
      traits: mergedTraits,
      origin: {
        sources: selectedPersonas.map(p => p.slug),
        method: strategy,
        weights: strategy === "weighted" ? weights : undefined,
        date: new Date().toISOString().split("T")[0]
      }
    };

    try {
      const response = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: metaPersona,
          path: `data/personas/meta-${slug}/${timestamp}.yaml`
        })
      });

      if (!response.ok) throw new Error("Failed to save persona");

      // Redirect to the new persona's page
      window.location.href = `/personas/${slug}`;
    } catch (error) {
      console.error("Failed to save meta-persona:", error);
    }
  };

  if (isLoading) {
    return <div>Loading personas...</div>;
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Create Meta-Persona</h1>
      
      <form onSubmit={handleSubmit}>
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Source Personas</h2>
          <div className="grid gap-4 mb-6">
            {availablePersonas.map(persona => (
              <div key={persona.slug} className="flex items-center space-x-4">
                <Checkbox
                  id={persona.slug}
                  checked={selectedPersonas.some(p => p.slug === persona.slug)}
                  onCheckedChange={() => togglePersona(persona)}
                />
                <Label htmlFor={persona.slug}>{persona.name}</Label>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <Label htmlFor="strategy">Merge Strategy</Label>
            <Select
              value={strategy}
              onValueChange={(value: MergeStrategy) => setStrategy(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select merge strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="maximize">Maximize</SelectItem>
                <SelectItem value="minimize">Minimize</SelectItem>
                <SelectItem value="weighted">Weighted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {strategy === "weighted" && selectedPersonas.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium">Persona Weights</h3>
              {selectedPersonas.map(persona => (
                <div key={persona.slug} className="space-y-2">
                  <Label>{persona.name}</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[weights[persona.slug] || 1]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={(values) => {
                        const [value] = values;
                        if (typeof value === 'number') {
                          updateWeight(persona.slug, value);
                        }
                      }}
                    />
                    <span className="w-12 text-right">
                      {(weights[persona.slug] || 1).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Meta-Persona Details</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="The Hybrid Mind"
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="hybrid-mind"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A fusion of multiple perspectives..."
              />
            </div>
            <div>
              <Label htmlFor="style">Style</Label>
              <Input
                id="style"
                value={style}
                onChange={e => setStyle(e.target.value)}
                placeholder="Analytical yet empathetic..."
              />
            </div>
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Input
                id="tone"
                value={tone}
                onChange={e => setTone(e.target.value)}
                placeholder="Professional and engaging..."
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags.join(", ")}
                onChange={e => setTags(e.target.value.split(",").map(t => t.trim()))}
                placeholder="meta, hybrid, fusion"
              />
            </div>
          </div>
        </Card>

        {selectedPersonas.length > 0 && Object.keys(mergedTraits).length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Trait Preview</h2>
            <div className="space-y-4">
              {Object.entries(mergedTraits).map(([trait, value]) => (
                <div key={trait}>
                  <div className="flex items-center gap-4">
                    <Label className="mb-2 capitalize flex-1">{trait}</Label>
                    <span className="text-sm text-gray-500 w-12 text-right">{(value * 100).toFixed(0)}%</span>
                  </div>
                  <TraitProgressBar value={value} max={1} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Button
          type="submit"
          disabled={selectedPersonas.length === 0 || !name || !slug}
          className="w-full"
        >
          Create Meta-Persona
        </Button>
      </form>
    </div>
  );
}
