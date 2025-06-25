"use client";

import Link from "next/link";
import { personas } from "@/app/persona/personas";

export default function PersonaListPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">👤 Personas</h2>
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {personas.map((p) => (
          <div key={p.id} className="p-4 bg-white rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-xl font-bold">{p.name}</h3>
            <p className="text-sm text-gray-600 italic">{p.tone}</p>
            <p className="mt-2 text-sm text-gray-700">{p.description}</p>
            <div className="mt-4">
              {Object.entries(p.traits).map(([trait, value]) => (
                <div key={trait} className="text-sm">
                  <span className="font-medium capitalize">{trait}:</span>{" "}
                  <div className="inline-block w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
