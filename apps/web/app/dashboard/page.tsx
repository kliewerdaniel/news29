"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">🧠 Persona Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/personas" className="bg-white rounded-xl shadow p-4 hover:scale-105 transition">
          <h2 className="text-xl font-semibold">View Personas</h2>
          <p className="text-sm text-gray-500">Browse personas & timelines</p>
        </Link>
        <Link href="/dashboard/broadcasts" className="bg-white rounded-xl shadow p-4 hover:scale-105 transition">
          <h2 className="text-xl font-semibold">Browse Broadcasts</h2>
          <p className="text-sm text-gray-500">See past news clusters</p>
        </Link>
        <Link href="/dashboard/search" className="bg-white rounded-xl shadow p-4 hover:scale-105 transition">
          <h2 className="text-xl font-semibold">Semantic Search</h2>
          <p className="text-sm text-gray-500">Find themes and commentary</p>
        </Link>
      </div>
    </div>
  );
}
