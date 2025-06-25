"use client";

import { useState } from "react";
import Link from "next/link";
import { personas } from "@/app/persona/personas";

interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata?: {
    persona?: string;
    broadcast_id?: string;
    timestamp?: string;
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        ...(selectedPersona && { persona: selectedPersona })
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🔍 Semantic Search</h2>
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for themes or topics..."
            className="flex-1 p-2 border rounded-lg"
          />
          <select
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="">All Personas</option>
            {personas.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="p-4 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-500 mb-1">
                {result.metadata?.persona && (
                  <span className="mr-2">
                    👤 {personas.find(p => p.id === result.metadata?.persona)?.name || result.metadata.persona}
                  </span>
                )}
                {result.metadata?.timestamp && (
                  <span>
                    🕒 {new Date(result.metadata.timestamp).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-gray-700">{result.text}</p>
              {result.metadata?.broadcast_id && (
                <Link 
                  href={`/dashboard/broadcasts/${result.metadata.broadcast_id}`}
                  className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                >
                  View Broadcast →
                </Link>
              )}
            </div>
          ))}
          {results.length === 0 && query && !isLoading && (
            <div className="text-center text-gray-500">No results found</div>
          )}
        </div>
      </div>
    </div>
  );
}
