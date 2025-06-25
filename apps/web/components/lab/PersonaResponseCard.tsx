import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PersonaResponse {
  slug: string;
  name: string;
  traits: Record<string, number>;
  response: string;
}

interface PersonaResponseCardProps {
  response: PersonaResponse;
  index: number;
}

export function PersonaResponseCard({ response, index }: PersonaResponseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="p-4 h-full">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{response.name}</h3>
            {/* Avatar placeholder */}
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
          </div>

          {/* Traits */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(response.traits).map(([trait, value]) => (
              <div
                key={trait}
                className="text-sm px-2 py-1 bg-gray-100 rounded"
              >
                {trait}: {value}
              </div>
            ))}
          </div>

          {/* Response */}
          <div className="prose">
            {response.response}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Save as Article
            </Button>
            <Button variant="outline" size="sm">
              Critique Response
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
