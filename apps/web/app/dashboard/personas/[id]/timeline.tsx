"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip } from "recharts";
import { embedAndCluster } from "@/lib/tsne";

export default function PersonaTimeline() {
  const { id } = useParams();
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/personas/${id}/timeline`)
      .then((r) => r.json())
      .then(async (items) => {
        const coords = await embedAndCluster(items.map((i: any) => i.embedding));
        setPoints(
          items.map((i: any, idx: number) => ({
            ...i,
            x: coords[idx][0],
            y: coords[idx][1],
          }))
        );
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="p-6">Loading timeline...</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Commentary Timeline</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <ScatterChart width={600} height={400}>
          <XAxis 
            dataKey="x" 
            name="t-SNE x"
            type="number"
          />
          <YAxis 
            dataKey="y"
            name="t-SNE y" 
            type="number"
          />
          <Tooltip
            content={({ payload }) =>
              payload && payload[0] ? (
                <div className="bg-white p-2 rounded shadow">
                  <div className="font-semibold">{payload[0].payload.title}</div>
                  <div className="text-sm">{payload[0].payload.summary}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(payload[0].payload.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : null
            }
          />
          <Scatter 
            data={points} 
            fill="#6366f1" 
            shape="circle"
          />
        </ScatterChart>
      </div>
    </div>
  );
}
