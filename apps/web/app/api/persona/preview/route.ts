import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Mock preview for now - in reality this would call your LLM
    const preview = `As a ${body.name} with a ${body.tone} tone, I would analyze news through the lens of ${body.description}. My responses would be crafted in a ${body.promptStyle} style.`;

    return NextResponse.json({ preview });
  } catch (error) {
    console.error("Error in persona preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
