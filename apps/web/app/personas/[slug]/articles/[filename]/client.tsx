"use client";

import { RefinePersonaPanel } from '@/components/persona/RefinePersonaPanel';

interface ClientArticleProps {
  personaData: any;
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
