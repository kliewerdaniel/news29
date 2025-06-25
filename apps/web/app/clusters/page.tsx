"use client";

import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTSNE } from "@/hooks/use-tsne";
import { personas } from "../persona/personas";

export default function ClustersPage() {
  const [texts, setTexts] = useState<string[]>([]);
  const [selectedPersona, setSelectedPersona] = useState(personas[0]);
  const [personaComment, setPersonaComment] = useState(""); // Keep for now, might be used later
  const { points, isLoading } = useTSNE(texts);

  const handleRefresh = async () => {
    // This would come from your news API/feed
    const newsTexts = [
      "Global temperatures hit record high...",
      "Tech company announces breakthrough...",
      "New study reveals impact of climate change...",
      // Add more sample texts
    ];
    setTexts(newsTexts);

    // Commentary generation is now handled on the backend.
    // The frontend will retrieve commentary as part of the broadcast data.
    setPersonaComment("Commentary will be loaded from backend."); 
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6 space-y-4">
        <h1 className="text-2xl font-bold">News Clusters</h1>
        
        <div className="flex gap-4 items-center">
          <select
            className="border p-2 rounded"
            value={selectedPersona.id}
            onChange={(e) => {
              const persona = personas.find(p => p.id === e.target.value);
              if (persona) setSelectedPersona(persona);
            }}
          >
            {personas.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <button 
            onClick={handleRefresh}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        {isLoading && <div>Loading clusters...</div>}
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis type="number" dataKey="x" />
              <YAxis type="number" dataKey="y" />
              <Tooltip 
                content={({ payload }) => {
                  if (payload && payload[0]) {
                    return (
                      <div className="bg-white p-2 border rounded shadow">
                        {payload[0].payload.label}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                data={points} 
                fill="#8884d8"
                opacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {personaComment && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">{selectedPersona.name}&apos;s Commentary</h2>
            <p className="whitespace-pre-wrap">{personaComment}</p>
          </div>
        )}
      </div>
    </div>
  );
}
