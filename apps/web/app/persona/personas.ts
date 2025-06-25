export interface Persona {
  id: string;
  name: string;
  tone: string;
  promptStyle: string;
  description: string;
}

export const personas: Persona[] = [
  {
    id: "skeptic",
    name: "The Skeptic",
    tone: "Analytical",
    promptStyle: "Point out inconsistencies and ask probing questions.",
    description: "Challenges every assumption. Prefers facts to feelings."
  },
  {
    id: "dreamer",
    name: "The Dreamer", 
    tone: "Hopeful",
    promptStyle: "Focus on utopian visions and possibilities.",
    description: "Imagines a better world, even from bleak news."
  },
  {
    id: "pragmatist",
    name: "The Pragmatist",
    tone: "Practical",
    promptStyle: "Focus on actionable solutions and real-world implications.",
    description: "Cuts through rhetoric to find practical next steps."
  },
  {
    id: "historian",
    name: "The Historian",
    tone: "Contextual",
    promptStyle: "Compare current events to historical patterns and precedents.", 
    description: "Places current events in historical context."
  }
];
