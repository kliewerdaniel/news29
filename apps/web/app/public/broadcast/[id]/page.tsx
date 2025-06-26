"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { trackBroadcastView } from "@/lib/analytics";
import { Broadcast } from "@/types/news";

export default function PublicBroadcast() {
  const { id } = useParams();
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadBroadcast = async () => {
      try {
        const res = await fetch(`/api/public/broadcast/${id}`);
        if (!res.ok) {
          throw new Error("Broadcast not found");
        }
        const data = await res.json();
        setBroadcast(data);
        trackBroadcastView(id as string);
      } catch (err) {
        setError("Unable to load broadcast");
        console.error(err);
      }
    };

    loadBroadcast();
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">{error}</h1>
          <p className="mt-2 text-gray-600">This broadcast may be private or no longer available.</p>
        </div>
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading broadcast...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-4 text-2xl font-bold">📡 {broadcast.title}</h1>
          <div className="text-sm text-gray-500">
            {new Date(broadcast.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-6">
          {broadcast.segments?.map((segment, index) => (
            <div key={index} className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-3 text-xl font-semibold">{segment.title}</h2>
              <p className="mb-4 text-gray-700">{segment.summary}</p>
              
              {segment.persona_comments && Object.entries(segment.persona_comments).length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="font-medium text-gray-900">Persona Perspectives:</h3>
                  {Object.entries(segment.persona_comments).map(([persona, comment]) => (
                    <blockquote key={persona} className="border-l-4 border-purple-200 bg-purple-50 p-3 italic text-gray-700">
                      <strong className="font-medium text-purple-900">{persona}:</strong> {comment}
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by Persona News AI
          </p>
        </div>
      </div>
    </div>
  );
}
