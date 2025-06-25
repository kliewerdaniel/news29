import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

interface GuestJoinPanelProps {
  onSubmit: (guestPersona: GuestPersona) => void;
  existingPersonas: { name: string; slug: string }[];
  currentRound: number;
}

export interface GuestPersona {
  name: string;
  slug: string;
  traits: Record<string, number>;
  isGuest: true;
  text: string;
  round: number;
  replyTo?: string[];
}

const TRAIT_LABELS = {
  empathy: "Empathy",
  sarcasm: "Sarcasm",
  intellect: "Intellect",
  skepticism: "Skepticism"
} as const;

export function GuestJoinPanel({ onSubmit, existingPersonas, currentRound }: GuestJoinPanelProps) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [selectedReplies, setSelectedReplies] = useState<string[]>([])
  const [traits, setTraits] = useState<Record<string, number>>({
    empathy: 0.5,
    sarcasm: 0.5,
    intellect: 0.5,
    skepticism: 0.5
  })

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your guest persona",
        variant: "destructive"
      })
      return
    }

    if (!text.trim()) {
      toast({
        title: "Response Required",
        description: "Please enter your response",
        variant: "destructive"
      })
      return
    }

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const guestPersona: GuestPersona = {
      name,
      slug: `guest-${slug}`,
      traits,
      isGuest: true,
      text,
      round: currentRound + 1,
      replyTo: selectedReplies.length > 0 ? selectedReplies : undefined
    }

    onSubmit(guestPersona)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 mb-8">
        <h3 className="text-xl font-bold mb-6">Join as Guest</h3>
        
        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full mt-1"
            />
          </div>

          {/* Trait Sliders */}
          <div className="space-y-4">
            <h4 className="font-semibold mb-2">Personality Traits</h4>
            {Object.entries(TRAIT_LABELS).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor={key}>{label}</Label>
                  <span className="text-sm text-gray-500">
                    {Math.round(traits[key] * 100)}%
                  </span>
                </div>
                <Slider
                  id={key}
                  min={0}
                  max={1}
                  step={0.1}
                  value={[traits[key]]}
                  onValueChange={([value]) => setTraits(prev => ({ ...prev, [key]: value }))}
                />
              </div>
            ))}
          </div>

          {/* Reply Selection */}
          {currentRound > 0 && (
            <div>
              <Label>Reply To (Optional)</Label>
              <Select
                value={selectedReplies[0]} // For now, just support single selection
                onValueChange={(value) => setSelectedReplies([value])}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select who to reply to..." />
                </SelectTrigger>
                <SelectContent>
                  {existingPersonas.map(persona => (
                    <SelectItem key={persona.slug} value={persona.slug}>
                      {persona.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Response Text */}
          <div>
            <Label htmlFor="response">Your Response</Label>
            <textarea
              id="response"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your response here (markdown supported)..."
              className="w-full mt-1 min-h-[150px] p-2 border rounded-md"
              rows={6}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Submit Response
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
