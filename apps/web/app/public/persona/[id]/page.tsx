"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { trackPersonaView } from "@/lib/analytics";

interface PersonaTimeline {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updates: {
    date: string;
    content: string;
    source?: string;
  }[];
}

export default function PublicPersona() {
  const { id } = useParams();
  const [persona, setPersona] = useState<PersonaTimeline | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadPersona = async () => {
      try {
        const res = await fetch(`/api/public/persona/${id}`);
        if (!res.ok) {
          throw new Error("Persona not found");
        }
        const data = await res.json();
        setPersona(data);
        trackPersonaView(id as string);
      } catch (err) {
        setError("Unable to load persona");
        console.error(err);
      }
    };

    loadPersona();
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">{error}</h1>
          <p className="mt-2 text-gray-600">This persona may be private or no longer available.</p>
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading persona...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-2 text-2xl font-bold">{persona.name}</h1>
          <p className="mb-4 text-gray-700">{persona.description}</p>
          <div className="text-sm text-gray-500">
            Created {new Date(persona.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-6">
          {persona.updates.map((update, index) => (
            <div key={index} className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-3 text-sm text-gray-500">
                {new Date(update.date).toLocaleDateString()}
              </div>
              <p className="text-gray-700">{update.content}</p>
              {update.source && (
                <div className="mt-2 text-sm text-gray-500">
                  Source: {update.source}
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
