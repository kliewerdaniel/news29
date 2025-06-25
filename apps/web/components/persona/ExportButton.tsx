'use client';

import { Button } from '@/components/ui/button';

interface PersonaVersion {
  slug: string;
  name: string;
  version: string;
  traits: Record<string, number>;
}

interface ExportButtonProps {
  personas: Record<string, PersonaVersion[]>;
  keyTraits: string[];
}

export function ExportButton({ personas, keyTraits }: ExportButtonProps) {
  const exportToCsv = () => {
    const headers = ['Persona', 'Version', ...keyTraits];
    const rows = Object.entries(personas).flatMap(([_, versions]) =>
      versions.map(version => [
        version.name,
        version.version,
        ...keyTraits.map(trait => version.traits[trait]?.toString() || '0')
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'persona_evolution.csv';
    link.click();
  };

  return (
    <Button
      onClick={exportToCsv}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      Export CSV
    </Button>
  );
}
