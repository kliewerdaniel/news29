import { NextRequest, NextResponse } from "next/server";

type Persona = {
  name: string;
  traits: string[];
  slug: string;
};

type DebateRequest = {
  persona: Persona;
  cluster: {
    title: string;
    description: string;
  };
  round: number;
  repliesTo?: {
    persona: string;
    text: string;
  }[];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DebateRequest;

    if (!body.persona || !body.cluster || !body.round) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build persona description
    const personaDescription = body.persona.traits.join(", ");

    // Construct prompt based on round
    let prompt = "";
    if (body.round === 1) {
      prompt = `
        You are ${body.persona.name} with these traits: ${personaDescription}
        
        Topic: ${body.cluster.title}
        Description: ${body.cluster.description}
        
        Based on your personality and traits, write a thoughtful initial take or opinion on this topic.
        Focus on expressing views that align with your character traits.
        Keep your response concise but substantive, around 2-3 paragraphs.
      `;
    } else {
      const replies = body.repliesTo?.map(r => 
        `${r.persona}: "${r.text}"`
      ).join("\n\n");
      
      prompt = `
        You are ${body.persona.name} with these traits: ${personaDescription}
        
        You are responding to these previous opinions:
        
        ${replies}
        
        Based on your personality and the views expressed above, write a response or rebuttal.
        You may agree with some points while disagreeing with others.
        Stay true to your character traits while engaging with the specific points made.
        Keep your response concise but substantive, around 2-3 paragraphs.
      `;
    }

    try {
      // Call Ollama API
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: "llama2" }),
      });

      if (!response.ok) {
        throw new Error("LLM API call failed");
      }

      const output = await response.text();

      return NextResponse.json({ output });
    } catch (error) {
      console.error("LLM generation error:", error);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }
}
