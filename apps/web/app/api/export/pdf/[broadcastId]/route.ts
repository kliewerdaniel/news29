import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { broadcastId: string } }
) {
  const broadcastId = params.broadcastId;

  try {
    // Forward request to FastAPI backend
    const response = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:8000"}/export/pdf/${broadcastId}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/pdf",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }

    // Get the PDF data
    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="broadcast-${broadcastId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
