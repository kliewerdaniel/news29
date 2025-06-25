"use client";
import { useEffect, useState } from "react";
import { personas } from "@/app/persona/personas";

interface Segment {
  title: string;
  summary: string;
  persona_comments: Record<string, string>;
  timestamp: string;
}

export default function ComparePage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [broadcastId, setBroadcastId] = useState("latest");

  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        const res = await fetch(`/api/compare?broadcast_id=${broadcastId}`);
        const data = await res.json();
        setSegments(data);
      } catch (error) {
        console.error("Error fetching comparisons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisons();
  }, [broadcastId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading comparisons...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Compare Persona Takes</h1>
      
      {segments.map((seg, i) => (
        <div key={i} className="mb-8 p-6 bg-white shadow rounded-lg">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{seg.title}</h2>
            <p className="text-gray-600 text-sm">{new Date(seg.timestamp).toLocaleString()}</p>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
              <p>{seg.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(seg.persona_comments).map(([personaId, comment]) => {
                const persona = personas.find(p => p.id === personaId);
                return (
                  <div key={personaId} className="p-4 bg-gray-50 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {persona?.name || personaId}
                      </span>
                      {persona?.tone && (
                        <span className="text-xs text-gray-500">
                          {persona.tone}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{comment}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {segments.length === 0 && (
        <div className="text-center text-gray-500">
          No segments found for comparison
        </div>
      )}
    </div>
  );
}
