import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";
import { z } from "zod";

export const runtime = "nodejs";

const personaSchema = z.object({
  name: z.string().min(1).max(50),
  curiosity: z.number().min(0).max(1),
  empathy: z.number().min(0).max(1),
  skepticism: z.number().min(0).max(1),
  humor: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

export async function POST(req: Request) {
  try {
    const values = await req.json();
    const parsedValues = personaSchema.parse(values);

    const { name, ...traits } = parsedValues;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const yamlString = yaml.dump(traits);

    const dataDir = path.join(process.cwd(), "data", "personas");
    await fs.mkdir(dataDir, { recursive: true });

    const filePath = path.join(dataDir, `${slug}.yaml`);
    await fs.writeFile(filePath, yamlString);

    return NextResponse.json(
      { ok: true, path: `/data/personas/${slug}.yaml` },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error saving persona:", error);
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to save persona" },
      { status: 500 }
    );
  }
}
