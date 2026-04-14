import type { LearnedMap, Mappings } from "./types";

let mappingsCache: Mappings | null = null;

export async function loadMappings(): Promise<Mappings> {
  if (mappingsCache) return mappingsCache;
  const res = await fetch("/api/mappings");
  if (!res.ok) throw new Error(`Failed to load mappings: ${res.status}`);
  mappingsCache = (await res.json()) as Mappings;
  return mappingsCache;
}

export async function loadLearned(): Promise<LearnedMap> {
  const res = await fetch("/api/learned");
  if (!res.ok) throw new Error(`Failed to load learned mappings: ${res.status}`);
  return (await res.json()) as LearnedMap;
}
