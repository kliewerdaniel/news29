"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function BroadcastReplay() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch(`/api/broadcasts/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  if (!data) return <p className="p-6">Loading…</p>;
  const seg = data.segments[step];

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">{data.title ?? "Broadcast"}</h1>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold">{seg.title}</h2>
        <p>{seg.summary}</p>
        <blockquote className="italic text-purple-700 border-l-4 pl-4">
          {seg.comment}
        </blockquote>

        {seg.audio_url && (
          <audio controls src={seg.audio_url} className="w-full" />
        )}
      </motion.div>

      <div className="flex justify-between">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-40"
        >
          Previous segment
        </button>
        <button
          disabled={step === data.segments.length - 1}
          onClick={() => setStep((s) => s + 1)}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-40"
        >
          Next segment
        </button>
      </div>
    </div>
  );
}
