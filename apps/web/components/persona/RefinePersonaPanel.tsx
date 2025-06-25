import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { dump } from 'js-yaml';
import { useToast } from '@/components/ui/use-toast';

interface Trait {
  name: string;
  value: number;
}

interface PersonaData {
  name: string;
  traits: Record<string, number>;
  interests: string[];
  [key: string]: any;
}

interface RefinePersonaPanelProps {
  personaData: PersonaData;
  slug: string;
  onSave?: () => void;
}

export function RefinePersonaPanel({ personaData, slug, onSave }: RefinePersonaPanelProps) {
  const { toast } = useToast();
  const [traits, setTraits] = useState<Trait[]>(
    Object.entries(personaData.traits).map(([name, value]) => ({
      name,
      value: value / 100, // Convert percentage to decimal
    }))
  );

  // Helper to get emoji for trait
  const getTraitEmoji = (trait: string): string => {
    const emojiMap: Record<string, string> = {
      curiosity: '🔍',
      innovation: '💡',
      adaptability: '🔄',
      empathy: '💕',
      confidence: '💪',
      humor: '😄',
      passion: '🔥',
      intellect: '🧠',
    };
    return emojiMap[trait.toLowerCase()] || '✨';
  };

  const handleSave = async () => {
    try {
      // Convert traits back to percentages for saving
      const updatedTraits = traits.reduce((acc, trait) => {
        acc[trait.name] = Math.round(trait.value * 100);
        return acc;
      }, {} as Record<string, number>);

      // Create new persona version with updated traits
      const newPersona = {
        ...personaData,
        traits: updatedTraits,
      };

      // Get today's date for versioning
      const today = new Date().toISOString().split('T')[0];
      
      // Convert to YAML
      const yamlContent = dump(newPersona);

      // Save using fetch to API
      const response = await fetch(`/api/personas/${slug}/${today}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: yamlContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to save persona');
      }

      toast({
        title: 'Success',
        description: 'New persona version saved successfully',
      });

      onSave?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save new persona version',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 p-6 border rounded-lg shadow-sm"
    >
      <h2 className="text-2xl font-bold mb-6">Refine Persona from Critique</h2>

      <div className="space-y-6">
        {traits.map((trait) => (
          <div key={trait.name} className="space-y-2">
            <div className="flex items-center gap-2">
              <span role="img" aria-label={`${trait.name} emoji`}>
                {getTraitEmoji(trait.name)}
              </span>
              <Label htmlFor={trait.name} className="font-medium capitalize">
                {trait.name}
              </Label>
              <span className="ml-auto text-sm text-gray-500">
                {Math.round(trait.value * 100)}%
              </span>
            </div>
            <Slider
              id={trait.name}
              min={0}
              max={1}
              step={0.05}
              value={[trait.value]}
              onValueChange={(values) => {
                const newValue = values[0];
                setTraits((prev) =>
                  prev.map((t) =>
                    t.name === trait.name ? { ...t, value: newValue } : t
                  )
                );
              }}
              className="w-full"
              aria-label={`Adjust ${trait.name}`}
            />
            
            {/* Show difference from original */}
            {trait.value !== personaData.traits[trait.name] / 100 && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                Original: {personaData.traits[trait.name]}%
                <span className={trait.value > personaData.traits[trait.name] / 100 ? 'text-green-500' : 'text-red-500'}>
                  ({trait.value > personaData.traits[trait.name] / 100 ? '+' : ''}
                  {Math.round((trait.value * 100) - personaData.traits[trait.name])}%)
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="mt-6 w-full">
        Save as New Version
      </Button>
    </motion.section>
  );
}
