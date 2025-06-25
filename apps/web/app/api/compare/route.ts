import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get broadcast_id from URL params
    const { searchParams } = new URL(request.url);
    const broadcastId = searchParams.get("broadcast_id") || "latest";

    // Fetch comparison data from backend
    const res = await fetch(`http://localhost:8000/compare?broadcast_id=${broadcastId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch comparison data");
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in compare API:", error);
    return NextResponse.json(
      { error: "Failed to get comparison data" },
      { status: 500 }
    );
  }
}
