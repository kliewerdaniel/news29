import { NextResponse } from "next/server";
import matter from "gray-matter";

type CritiqueRequest = {
  persona: Record<string, any>;
  content: string;
  topic?: string;
};

function stripMdx(content: string): string {
  // Remove frontmatter and get clean content
  const { content: cleanContent } = matter(content);
  
  // Strip common Markdown syntax
  return cleanContent
    .replace(/#{1,6}\s+/g, "") // headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/`{1,3}[^`]+`{1,3}/g, "") // code blocks
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/_([^_]+)_/g, "$1") // italics
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // images
    .replace(/^[-*+]\s+/gm, "") // list items
    .replace(/^>\s+/gm, "") // blockquotes
    .trim();
}

function constructPrompt(persona: Record<string, any>, content: string, topic?: string): string {
  return `You are an editorial AI. Your task is to critique the following article based on:
- Writing clarity
- Alignment with the author persona's traits
- Tone consistency (e.g. empathetic, sarcastic)
- Potential bias or logical gaps

Persona Traits:
${JSON.stringify(persona, null, 2)}

${topic ? `Topic: ${topic}\n\n` : ""}
Article:
"""
${content}
"""

Provide a structured response with headers:
## Strengths
## Weaknesses
## Suggestions for Improvement`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CritiqueRequest;
    
    if (!body.content || !body.persona) {
      return NextResponse.json(
        { error: "Missing required fields: content and persona" },
        { status: 400 }
      );
    }

    const cleanContent = stripMdx(body.content);
    const prompt = constructPrompt(body.persona, cleanContent, body.topic);

    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt,
        model: "llama2"
      })
    });

    if (!res.ok) {
      throw new Error(`LLM request failed with status ${res.status}`);
    }

    const output = await res.text();

    return NextResponse.json({ critique: output });
  } catch (error) {
    console.error("Critique API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate critique" },
      { status: 500 }
    );
  }
}
