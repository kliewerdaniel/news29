"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_NEWS_API;

interface Broadcast {
  id: string;
  timestamp: string;
  title: string;
}

export default function BroadcastListPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/broadcasts")
      .then((r) => r.json())
      .then((data) => {
        setBroadcasts(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching broadcasts:", error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className="p-6">Loading broadcasts...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🕰 Past Broadcasts</h2>
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      {broadcasts.length === 0 ? (
        <div className="text-gray-500">No broadcasts found</div>
      ) : (
        <ul className="space-y-2">
          {broadcasts.map((b) => (
            <li key={b.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <div className="font-semibold">{new Date(b.timestamp).toLocaleString()}</div>
              <div className="text-gray-700">{b.title || "Untitled"}</div>
              <div className="mt-2 flex gap-4">
                <Link 
                  href={`/dashboard/broadcasts/${b.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Replay
                </Link>
                <a
                  href={`${API_URL}/broadcast/${b.id}/export?format=json`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Export JSON
                </a>
                <a
                  href={`${API_URL}/broadcast/${b.id}/export?format=md`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Export MD
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
