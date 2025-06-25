import { NextResponse } from "next/server";

// In-memory storage for interval (in production, this should be persisted)
let currentIntervalHours = 24; // Default to 24 hours

export async function GET() {
  return NextResponse.json({ interval: currentIntervalHours });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const interval = Number(data.interval);

    if (isNaN(interval) || interval < 1) {
      return NextResponse.json(
        { error: "Invalid interval value" },
        { status: 400 }
      );
    }

    currentIntervalHours = interval;

    // In a real application, you would update your scheduler here
    // Example: await updateSchedulerJob(interval);

    return NextResponse.json({ interval: currentIntervalHours });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}
