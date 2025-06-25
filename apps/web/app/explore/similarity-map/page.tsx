'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { loadPersonas, computePositions, type PersonaNode } from '@/lib/personas/computeSimilarity';
import Link from 'next/link';

// Custom node component
function PersonaNode({ data }: NodeProps) {
  const traits = Object.entries(data.persona.traits)
    .sort(([, a], [, b]): number => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-gray-200 min-w-[150px]">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="font-semibold text-sm">{data.label}</div>
      <div className="text-xs mt-2">
        {traits.map(([trait, value]) => (
          <div key={trait} className="flex justify-between">
            <span>{trait}:</span>
            <span>{(value as number).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-blue-600 hover:underline">
        <Link href={`/personas/${data.persona.slug}/dashboard`}>View Details</Link>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}

const nodeTypes = {
  persona: PersonaNode,
};

export default function SimilarityMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onNodeClick = useCallback((_: any, node: { id: string }) => {
    window.location.href = `/personas/${node.id}/dashboard`;
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const personas = await loadPersonas();
        const positions = await computePositions(personas);
        
        // Convert to ReactFlow nodes
        const nodes = positions.map((node) => ({
          ...node,
          type: 'persona',
        }));
        
        setNodes(nodes);
      } catch (err) {
        console.error('Error loading similarity map:', err);
        setError('Failed to load persona data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setNodes]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg">Loading persona map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm p-4 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Persona Similarity Map</h1>
        <p className="text-sm text-gray-600">
          Personas are positioned based on trait similarity.
          Closer nodes indicate more similar trait profiles.
        </p>
      </div>
      
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  );
}
