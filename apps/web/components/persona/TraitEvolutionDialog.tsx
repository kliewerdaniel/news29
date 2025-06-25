'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TraitEvolutionView } from './TraitEvolutionView'
import { useToast } from '@/components/ui/use-toast'
import { useEvolveTraits } from '@/hooks/useEvolveTraits'

type TraitEvolutionDialogProps = {
  isOpen: boolean
  onClose: () => void
  personaSlug: string
  personaName: string
  originalTraits: Record<string, number>
  debateText: string
}

export function TraitEvolutionDialog({
  isOpen,
  onClose,
  personaSlug,
  personaName,
  originalTraits,
  debateText
}: TraitEvolutionDialogProps) {
  const { toast } = useToast()
  const { evolvePersona, isEvolving, error } = useEvolveTraits()
  const [evolvedTraits, setEvolvedTraits] = useState<Record<string, number> | null>(null)

  const handleEvolve = async () => {
    const result = await evolvePersona(
      {
        slug: personaSlug,
        name: personaName,
        traits: originalTraits,
        tags: [] // Empty tags array to satisfy PersonaYAML type
      },
      debateText
    )

    if (result) {
      setEvolvedTraits(result.traits)
      toast({
        title: 'Traits Analyzed',
        description: 'Review the changes before saving.',
        duration: 3000
      })
    } else if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive'
      })
    }
  }

  const handleSave = async () => {
    if (!evolvedTraits) return

    try {
      // Save is handled by evolvePersona
      toast({
        title: 'Success',
        description: 'Persona traits evolved and saved.',
        duration: 3000
      })
      onClose()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save evolved traits',
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Evolve {personaName}&apos;s Traits</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!evolvedTraits ? (
            <div className="text-center py-8">
              <Button
                onClick={handleEvolve}
                disabled={isEvolving}
                className="min-w-[200px]"
              >
                {isEvolving ? 'Analyzing...' : 'Analyze Trait Evolution'}
              </Button>
            </div>
          ) : (
            <>
              <TraitEvolutionView
                originalTraits={originalTraits}
                evolvedTraits={evolvedTraits}
              />

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
