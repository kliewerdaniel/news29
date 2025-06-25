"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersonaResponseCard } from "@/components/lab/PersonaResponseCard";

interface PersonaResponse {
  slug: string;
  name: string;
  traits: Record<string, number>;
  response: string;
}

export default function LabPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState("llama3");
  const [responses, setResponses] = useState<PersonaResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Create prompts for each selected persona
      const experiments = selectedPersonas.map(async (personaSlug) => {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            persona: personaSlug,
            prompt: `You are ${personaSlug}, a persona with these traits:
                    {traits}

                    Respond to the following prompt as you normally would:
                    """${prompt}"""`,
            temperature,
            model,
          }),
        });

        const data = await response.json();
        return data;
      });

      // Run all experiments in parallel
      const results = await Promise.allSettled(experiments);
      const successfulResponses = results
        .filter((result): result is PromiseFulfilledResult<PersonaResponse> => 
          result.status === "fulfilled"
        )
        .map(result => result.value);

      setResponses(successfulResponses);
    } catch (error) {
      console.error("Error generating responses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex gap-6">
        {/* Left Panel */}
        <div className="w-1/3 space-y-6">
          <Card className="p-4">
            <div className="space-y-4">
              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt here..."
                  className="h-40"
                />
              </div>

              {/* Persona Selection */}
              <div className="space-y-2">
                <Label>Select Personas</Label>
                <div className="grid gap-2">
                  {["tech-enthusiast", "curious-owl"].map((persona) => (
                    <div key={persona} className="flex items-center space-x-2">
                      <Checkbox
                        id={persona}
                        checked={selectedPersonas.includes(persona)}
                        onCheckedChange={(checked) => {
                          setSelectedPersonas(
                            checked
                              ? [...selectedPersonas, persona]
                              : selectedPersonas.filter((p) => p !== persona)
                          );
                        }}
                      />
                      <Label htmlFor={persona}>{persona}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Temperature Control */}
              <div className="space-y-2">
                <Label>Temperature: {temperature}</Label>
                <Slider
                  value={[temperature]}
                  onValueChange={([value]) => setTemperature(value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama3">Llama 3</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                    <SelectItem value="gemma">Gemma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !prompt || selectedPersonas.length === 0}
                className="w-full"
              >
                {isLoading ? "Generating..." : "Run Experiment"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="w-2/3">
          <div className="grid grid-cols-2 gap-4">
            {responses.map((response, index) => (
              <PersonaResponseCard
                key={response.slug}
                response={response}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
