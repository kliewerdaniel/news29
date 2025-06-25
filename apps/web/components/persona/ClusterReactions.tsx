"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { NewsCluster, Persona } from "@/app/clusters/[slug]/page";

interface Props {
  personas: Persona[];
  cluster: NewsCluster;
}

function generateReaction(persona: Persona, cluster: NewsCluster): string {
  const skepticism = typeof persona.skepticism === 'number' ? persona.skepticism : 0;
  const empathy = typeof persona.empathy === 'number' ? persona.empathy : 0;
  const confidence = typeof persona.confidence === 'number' ? persona.confidence : 0;
  const { topic } = cluster;

  if (skepticism > 0.7) {
    return `"I'm skeptical about this ${topic} coverage. The summary seems to overlook some key nuances."`;
  }
  if (empathy > 0.7) {
    return `"This ${topic} story really highlights the human impact. My heart goes out to those affected."`;
  }
  if (confidence > 0.7) {
    return `"This ${topic} report confirms what I've been saying all along. The evidence is clear!"`;
  }
  return `"Interesting perspective on ${topic}. I'd like to learn more about this."`;
}

const ClusterReactions = ({ personas, cluster }: Props) => {
  return (
    <section className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Persona Reactions</h3>
      <div className="grid gap-4">
        {personas.map((persona, i) => (
          <motion.div
            key={String(persona.slug)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-4">
              <h4 className="font-medium">{persona.name}</h4>
              <p className="mt-2 text-muted-foreground">
                {generateReaction(persona, cluster)}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ClusterReactions;
