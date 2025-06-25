import { NextRequest, NextResponse } from 'next/server'
import { generateTraitValue } from '@/lib/ollama'

export async function POST(req: NextRequest) {
  try {
    const { trait, originalValue, debateText } = await req.json()

    if (!trait || typeof originalValue !== 'number' || !debateText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const value = await generateTraitValue(trait, originalValue, debateText)
    return NextResponse.json({ value })
  } catch (error) {
    console.error('Error analyzing trait:', error)
    return NextResponse.json(
      { error: 'Failed to analyze trait' },
      { status: 500 }
    )
  }
}
