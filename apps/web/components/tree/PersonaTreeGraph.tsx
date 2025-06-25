'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { parse } from 'yaml';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PersonaVersion {
  id: string;
  date: string;
  traits: Record<string, number>;
  parentId?: string;
  event?: 'article' | 'debate' | 'manual';
}

interface PersonaTreeGraphProps {
  slug: string;
  initialVersions: PersonaVersion[];
}

const nodeColors = {
  debate: '#10b981', // Green
  article: '#8b5cf6', // Purple
  manual: '#3b82f6', // Blue
};

const PersonaTreeGraph = ({ slug, initialVersions }: PersonaTreeGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);
  const [availableTraits, setAvailableTraits] = useState<string[]>([]);

  // Convert versions to nodes and edges
  useEffect(() => {
    const newNodes: Node[] = initialVersions.map((version) => ({
      id: version.id,
      position: { x: 0, y: 0 }, // Will be laid out automatically
      data: { 
        label: new Date(version.date).toLocaleDateString(),
        traits: version.traits,
        event: version.event
      },
      style: {
        background: version.event ? nodeColors[version.event] : nodeColors.manual,
        color: 'white',
        border: '1px solid #fff',
        borderRadius: '8px',
        padding: '10px',
      },
    }));

    const newEdges: Edge[] = initialVersions
      .filter((v) => v.parentId)
      .map((version) => ({
        id: `${version.parentId}-${version.id}`,
        source: version.parentId!,
        target: version.id,
        animated: true,
        style: { stroke: '#64748b' },
      }));

    // Get all unique trait names
    const traits = new Set<string>();
    initialVersions.forEach((version) => {
      Object.keys(version.traits).forEach((trait) => traits.add(trait));
    });
    setAvailableTraits(Array.from(traits));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [initialVersions, setNodes, setEdges]);

  // Update node colors based on selected trait
  useEffect(() => {
    if (!selectedTrait) return;

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: {
          ...node.style,
          background: getTraitColor(node.data.traits[selectedTrait] || 0),
        },
      }))
    );
  }, [selectedTrait, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const exportToJson = useCallback(() => {
    const dataStr = JSON.stringify(initialVersions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}-evolution.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [slug, initialVersions]);

  return (
    <div className="w-full h-[800px] bg-background border rounded-lg">
      <div className="p-4 border-b flex items-center gap-4">
        <Select value={selectedTrait || ''} onValueChange={setSelectedTrait}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select trait to view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No trait selected</SelectItem>
            {availableTraits.map((trait) => (
              <SelectItem key={trait} value={trait}>
                {trait.charAt(0).toUpperCase() + trait.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={exportToJson}>Export JSON</Button>
      </div>
      <div className="w-full h-[calc(100%-65px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};

// Helper to generate color based on trait value
const getTraitColor = (value: number) => {
  // Generate a color from red (0) to green (100)
  const red = Math.round(255 * (1 - value / 100));
  const green = Math.round(255 * (value / 100));
  return `rgb(${red}, ${green}, 0)`;
};

export default PersonaTreeGraph;
