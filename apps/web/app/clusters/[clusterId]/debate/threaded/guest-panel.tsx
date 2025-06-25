"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GuestJoinPanel, GuestPersona } from '@/components/debate/GuestJoinPanel'
import { toast } from '@/components/ui/use-toast'

export function GuestPanel({ 
  personas, 
  currentRound 
}: { 
  personas: { name: string; slug: string }[],
  currentRound: number 
}) {
  const [showGuestPanel, setShowGuestPanel] = useState(false)

  const handleGuestSubmit = async (guestPersona: GuestPersona) => {
    // Save guest response
    const response = await fetch('/api/debate/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestPersona)
    })

    if (!response.ok) {
      toast({
        title: "Error",
        description: "Failed to submit guest response",
        duration: 3000
      })
      return
    }

    setShowGuestPanel(false)
    toast({
      title: "Success",
      description: "Your response has been added to the debate",
      duration: 3000
    })
  }

  return (
    <>
      {/* Guest Join Button */}
      <div className="mb-8">
        <Button 
          onClick={() => setShowGuestPanel(!showGuestPanel)}
          variant={showGuestPanel ? "secondary" : "default"}
        >
          {showGuestPanel ? "Cancel" : "Join as Guest"}
        </Button>
      </div>

      {/* Guest Join Panel */}
      {showGuestPanel && (
        <GuestJoinPanel
          onSubmit={handleGuestSubmit}
          existingPersonas={personas}
          currentRound={currentRound}
        />
      )}
    </>
  )
}
