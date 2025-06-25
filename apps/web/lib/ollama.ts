import { Ollama } from 'ollama'

// Configure Ollama client
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434'
})

export default ollama

export async function generateTraitValue(
  trait: string,
  originalValue: number,
  debateText: string
): Promise<number> {
  try {
    const response = await ollama.generate({
      model: process.env.OLLAMA_MODEL || 'llama2',
      prompt: `You are analyzing the personality trait **${trait}** (range 0-1).
Based on this debate text, what is the adjusted value of ${trait}?

Debate text:
${debateText}

Original trait value: ${originalValue}

Return only a float between 0-1.`,
      options: {
        temperature: 0.7,
        num_predict: 50 // Limit response length since we just need a number
      }
    })

    // Extract number from response
    const match = response.response.match(/\d*\.?\d+/)
    if (!match) {
      throw new Error('Could not extract numeric value from LLM response')
    }

    const value = parseFloat(match[0])
    
    if (isNaN(value) || value < 0 || value > 1) {
      throw new Error('LLM returned invalid value')
    }

    return value
  } catch (error) {
    console.error('Error generating trait value:', error)
    throw error
  }
}
