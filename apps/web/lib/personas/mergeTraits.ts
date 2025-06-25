type MergeStrategy = "average" | "maximize" | "minimize" | "weighted";

type PersonaTraits = {
  slug: string;
  name: string;
  traits: Record<string, number>;
  style?: string;
  tone?: string;
};

type WeightedConfig = {
  [slug: string]: number;
};

export function mergeTraits(
  personas: PersonaTraits[],
  strategy: MergeStrategy,
  weights?: WeightedConfig
): Record<string, number> {
  if (personas.length === 0) return {};

  // Get all unique trait keys
  const traitKeys = Array.from(
    new Set(personas.flatMap((p) => Object.keys(p.traits)))
  );

  // Initialize merged traits object
  const mergedTraits: Record<string, number> = {};

  // Process each trait key
  traitKeys.forEach((key) => {
    const validTraits = personas
      .filter((p) => typeof p.traits[key] === "number")
      .map((p) => ({
        value: p.traits[key],
        weight: weights?.[p.slug] ?? 1,
      }));

    if (validTraits.length === 0) return;

    switch (strategy) {
      case "average":
        mergedTraits[key] =
          validTraits.reduce((sum, { value }) => sum + value, 0) /
          validTraits.length;
        break;

      case "maximize":
        mergedTraits[key] = Math.max(
          ...validTraits.map(({ value }) => value)
        );
        break;

      case "minimize":
        mergedTraits[key] = Math.min(
          ...validTraits.map(({ value }) => value)
        );
        break;

      case "weighted":
        if (!weights) {
          // Fallback to average if no weights provided
          mergedTraits[key] =
            validTraits.reduce((sum, { value }) => sum + value, 0) /
            validTraits.length;
          break;
        }
        const totalWeight = validTraits.reduce(
          (sum, { weight }) => sum + weight,
          0
        );
        mergedTraits[key] =
          validTraits.reduce(
            (sum, { value, weight }) => sum + value * weight,
            0
          ) / totalWeight;
        break;
    }

    // Round to 2 decimal places
    mergedTraits[key] = Math.round(mergedTraits[key] * 100) / 100;
  });

  return mergedTraits;
}
