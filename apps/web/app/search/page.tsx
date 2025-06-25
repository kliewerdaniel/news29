"use client";
import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; summary: string; metadata: { title: string; persona: string; comment: string }; distance: number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="border p-2 rounded flex-1"
          placeholder="Search for topics, phrases, etc..."
        />
        <button 
          onClick={search} 
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      
      <div className="space-y-4">
        {results.map((result, i) => (
          <div key={i} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{result.metadata.title}</h3>
            <p className="mt-2 text-gray-600">{result.summary}</p>
            <div className="mt-3 text-sm">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {result.metadata.persona}
              </span>
              <div className="mt-2 text-gray-500 italic">
                &quot;{result.metadata.comment}&quot;
              </div>
            </div>
          </div>
        ))}
        
        {results.length === 0 && query && !loading && (
          <p className="text-gray-500 text-center py-8">
            No results found for &quot;{query}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
