"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { parse } from "yaml";
import { Card } from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Persona = {
  name: string;
  [trait: string]: number | string;
};

type Props = {
  slug: string;
  versions: string[];
  initialPersonaA: Persona;
  initialPersonaB: Persona;
  initialVersionA: string;
  initialVersionB: string;
};

export default function VersionComparer({ 
  slug, 
  versions,
  initialPersonaA,
  initialPersonaB,
  initialVersionA,
  initialVersionB
}: Props) {
  const [versionA, setVersionA] = useState<string>(initialVersionA);
  const [versionB, setVersionB] = useState<string>(initialVersionB);
  const [personaA, setPersonaA] = useState<Persona>(initialPersonaA);
  const [personaB, setPersonaB] = useState<Persona>(initialPersonaB);
  const [isLoading, setIsLoading] = useState(false);

  async function loadVersions() {
    try {
      setIsLoading(true);
      const [contentA, contentB] = await Promise.all([
        fetch(`/api/personas/${slug}/${versionA}`).then(res => res.text()),
        fetch(`/api/personas/${slug}/${versionB}`).then(res => res.text())
      ]);

      setPersonaA(parse(contentA));
      setPersonaB(parse(contentB));
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getAllTraits(): string[] {
    const traits = new Set<string>();
    if (personaA) {
      Object.keys(personaA).forEach(key => traits.add(key));
    }
    if (personaB) {
      Object.keys(personaB).forEach(key => traits.add(key));
    }
    return Array.from(traits).filter(trait => trait !== 'name').sort();
  }

  function hasChanged(trait: string): boolean {
    if (!personaA || !personaB) return false;
    return personaA[trait] !== personaB[trait];
  }

  function formatValue(value: string | number): string {
    return typeof value === 'number' ? value.toString() : value;
  }

  const traits = getAllTraits();

  // Get numeric traits for the chart
  const numericTraits = traits.filter(
    trait => typeof personaA[trait] === "number" && typeof personaB[trait] === "number"
  );

  // Prepare data for the radar chart
  const chartData = numericTraits.map((trait) => ({
    trait,
    VersionA: personaA[trait] as number,
    VersionB: personaB[trait] as number,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select value={versionA} onValueChange={setVersionA}>
            <SelectTrigger>
              <SelectValue placeholder="Select version A" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version} value={version}>
                  {version.replace('.yaml', '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-muted-foreground">vs</span>
        <div className="w-48">
          <Select value={versionB} onValueChange={setVersionB}>
            <SelectTrigger>
              <SelectValue placeholder="Select version B" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version} value={version}>
                  {version.replace('.yaml', '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={loadVersions} disabled={isLoading}>
          {isLoading ? "Loading..." : "Compare"}
        </Button>
      </div>

      {personaA && personaB && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trait</TableHead>
                <TableHead>Version A</TableHead>
                <TableHead>Version B</TableHead>
                <TableHead>Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {traits.map((trait) => (
                <motion.tr
                  key={trait}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "border-b transition-colors",
                    hasChanged(trait) && "bg-yellow-50"
                  )}
                >
                  <TableCell className="font-medium">{trait}</TableCell>
                  <TableCell>{formatValue(personaA[trait])}</TableCell>
                  <TableCell>{formatValue(personaB[trait])}</TableCell>
                  <TableCell>
                    {hasChanged(trait) && (
                      <span className="text-yellow-600">Changed</span>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Trait Comparison</h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="trait" />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} />
                  <Radar
                    name="Version A"
                    dataKey="VersionA"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Version B"
                    dataKey="VersionB"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.4}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
