import { Broadcast } from "../types/news";

const baseUrl = process.env.NEXT_PUBLIC_NEWS_API ?? "http://localhost:8000";

export async function refreshNews(feeds?: string[]): Promise<{ broadcast_id: string }> {
  const res = await fetch(`${baseUrl}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feeds ?? []),
  });
  if (!res.ok) throw new Error("Refresh failed");
  return await res.json();
}

export async function getBroadcast(id: string): Promise<Broadcast> {
  const res = await fetch(`${baseUrl}/broadcast/${id}`);
  if (!res.ok) throw new Error("Broadcast not found");
  return await res.json();
}
