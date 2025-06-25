import { NextRequest, NextResponse } from "next/server";
import * as yaml from "js-yaml";
import * as fs from "fs";

// Auto-versions persona YAML on opinion generation
export const runtime = "nodejs";

// Define types for the request body
type Article = {
  title: string;
  url: string;
  source: string;
};

type Cluster = {
  topic: string;
  summary: string;
  articles: Article[];
};

type GenerateRequest = {
  persona: Record<string, any>;
  cluster: Cluster;
};

// Only allow POST requests
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as GenerateRequest;

    // Validate request body
    if (!body.persona || !body.cluster) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create versioned persona file
    let versionSavedTo = "";
    try {
      const timestamp = new Date().toISOString().split("T")[0]; // e.g., "2025-06-24"
      const slug = body.persona.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const folder = `data/personas/${slug}`;
      const filePath = `${folder}/${timestamp}.yaml`;

      // Ensure folder exists
      await fs.promises.mkdir(folder, { recursive: true });

      // Serialize and save persona
      const yamlText = yaml.dump(body.persona);
      await fs.promises.writeFile(filePath, yamlText, "utf-8");
      
      versionSavedTo = filePath;
    } catch (err) {
      console.error("Failed to save version:", err);
      // Continue with generation even if versioning fails
    }

    // Build persona description by merging traits
    const personaDescription = Object.entries(body.persona)
      .filter(([key]) => key !== "name")
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ");

    // Construct prompt
    const prompt = `
      You are a persona with the following traits: ${personaDescription}.
      Topic: ${body.cluster.topic}
      Summary: ${body.cluster.summary}

      Write a short opinion or reaction to this topic in the voice of the persona.
    `;

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

      const stream = await response.text();

      // Escape triple backticks in model output to prevent markdown issues
      const escapedOutput = stream.replace(/```/g, '\\`\\`\\`');

      // Construct file path for MDX article
      const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const personaSlug = body.persona.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const clusterSlug = body.cluster.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const folder = `data/articles/${personaSlug}`;
      const filename = `${clusterSlug}-${date}.mdx`;
      const filepath = `${folder}/${filename}`;

      // Ensure articles folder exists
      await fs.promises.mkdir(folder, { recursive: true });

      // Construct MDX content with frontmatter
      const mdxContent = `---
persona: ${body.persona.name}
topic: ${body.cluster.topic}
date: ${date}
---

${escapedOutput}
`;

      // Write MDX file
      await fs.promises.writeFile(filepath, mdxContent, "utf-8");

      return NextResponse.json({ 
        output: escapedOutput,
        savedTo: filepath,
        versionSavedTo
      });
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
