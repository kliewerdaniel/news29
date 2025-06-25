import { Ollama } from "ollama";
import type { Persona } from "../app/persona/personas";

const ollama = new Ollama({ host: "http://localhost:11434" });

export async function commentOnNews(persona: Persona, content: string) {
  const prompt = `You are ${persona.name}. ${persona.promptStyle}\n\nNews Content:\n${content}`;
  const res = await ollama.chat({
    model: "llama2", // or mistral, depending on what's available
    messages: [{ role: "user", content: prompt }]
  });
  return res.message.content;
}

export async function embedText(text: string) {
  const res = await ollama.embeddings({
    model: "llama2",
    prompt: text
  });
  return res.embedding;
}
