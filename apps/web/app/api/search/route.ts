import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const persona = searchParams.get("persona");
  const limit = searchParams.get("limit");

  if (!query) {
    return new Response(JSON.stringify({ error: "Query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build the backend URL with query parameters
  const backendUrl = new URL("/search", process.env.NEWS_API || "http://backend:8000");
  backendUrl.searchParams.set("query", query);
  if (persona) backendUrl.searchParams.set("persona", persona);
  if (limit) backendUrl.searchParams.set("limit", limit);

  try {
    const response = await fetch(backendUrl.toString());
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch search results" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
