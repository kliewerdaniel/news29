'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';

interface CritiquePanelProps {
  slug: string;
  content: string;
  topic: string;
}

interface CritiqueResponse {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export function CritiquePanel({ slug, content, topic }: CritiquePanelProps) {
  const [critique, setCritique] = useState<CritiqueResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const getCritique = async () => {
    try {
      // Fetch persona YAML
      const personaRes = await fetch(`/data/personas/${slug}.yaml`);
      const persona = await personaRes.text();

      // Clean article content (remove frontmatter and markdown)
      const cleanContent = content.replace(/^---[\s\S]*?---\n/, '') // Remove frontmatter
        .replace(/[#*_`]/g, '') // Remove markdown formatting
        .trim();

      // Call critique API
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          content: cleanContent,
          topic
        })
      });

      if (!response.ok) throw new Error('Failed to get critique');
      
      const data = await response.json();
      setCritique(data);
    } catch (error) {
      console.error('Error getting critique:', error);
    }
  };

  const handleGetCritique = () => {
    startTransition(() => {
      getCritique();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mt-12"
    >
      <Card>
        <CardHeader>
          <CardTitle>Critique</CardTitle>
        </CardHeader>
        <CardContent>
          {!critique && !isPending && (
            <Button onClick={handleGetCritique}>
              Get AI Feedback
            </Button>
          )}

          {isPending && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </div>
          )}

          {critique && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Tabs defaultValue="strengths" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="strengths">Strengths</TabsTrigger>
                  <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
                  <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                </TabsList>
                <TabsContent value="strengths">
                  <ul className="list-disc pl-5 space-y-2">
                    {critique.strengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="weaknesses">
                  <ul className="list-disc pl-5 space-y-2">
                    {critique.weaknesses.map((weakness, i) => (
                      <li key={i}>{weakness}</li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="suggestions">
                  <ul className="list-disc pl-5 space-y-2">
                    {critique.suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
