"use client";

"use client";

import { useState } from "react";
import { refreshNews, getBroadcast } from "../../lib/api";
import { Broadcast } from "../../types/news";

export default function RefreshNewsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Broadcast | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { broadcast_id } = await refreshNews();
      const data = await getBroadcast(broadcast_id);
      setResult(data);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Generate News Broadcast</h2>
      <button onClick={handleRefresh} className="bg-black text-white px-4 py-2 rounded">
        {loading ? "Loading..." : "Refresh"}
      </button>
      {error && <div className="text-red-500">{error}</div>}
      {result && (
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
