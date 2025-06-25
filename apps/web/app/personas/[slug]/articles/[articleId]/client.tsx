"use client";

import { RefinePersonaPanel } from '@/components/persona/RefinePersonaPanel';
import { Persona } from '../../../../persona/personas'; // Import Persona interface

interface ClientArticleProps {
  personaData: Persona;
  slug: string;
}

export function ClientArticle({ personaData, slug }: ClientArticleProps) {
  return (
    <>
      {personaData ? (
        <RefinePersonaPanel 
          personaData={personaData} 
          slug={slug}
        />
      ) : (
        <div className="text-center text-gray-500">
          Unable to load persona data
        </div>
      )}
    </>
  );
}
