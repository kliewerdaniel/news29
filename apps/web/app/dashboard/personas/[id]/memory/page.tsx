"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ForceGraph2D from "react-force-graph-2d";
import { Card } from "@/components/ui/card";

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    label: string;
  }>;
}

export default function MemoryGraph() {
  const [graph, setGraph] = useState<GraphData>({ nodes: [], links: [] });
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const response = await fetch(`/api/personas/${id}/timeline`);
        const items = await response.json();
        
        // Create nodes from timeline items
        const nodes = items.map((item: any, i: number) => ({ 
          id: `${i}`,
          label: item.title || `Thought ${i + 1}`
        }));

        // Create links between consecutive nodes
        const links = [];
        for (let i = 1; i < items.length; i++) {
          links.push({
            source: `${i - 1}`,
            target: `${i}`,
            label: "→"
          });
        }

        setGraph({ nodes, links });
      } catch (error) {
        console.error("Error fetching timeline data:", error);
      }
    };

    if (id) {
      fetchTimelineData();
    }
  }, [id]);

  return (
    <div className="p-6">
      <Card className="mb-6 p-6">
        <h1 className="text-2xl font-bold mb-4">🧠 Memory Graph</h1>
        <p className="text-gray-600">
          Visualizing the evolution of thoughts and opinions over time
        </p>
      </Card>
      
      <Card className="p-4 bg-white">
        <div style={{ height: "70vh" }}>
          {graph.nodes.length > 0 && (
            <ForceGraph2D
              graphData={graph}
              nodeLabel="label"
              linkLabel="label"
              nodeAutoColorBy="id"
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              nodeRelSize={6}
              linkWidth={2}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
