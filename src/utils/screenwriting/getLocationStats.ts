import { getCollection } from "astro:content";
import type { AnyScene, SceneFilter } from './types.stats'
import { applyFilter } from "./helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocationStats {
  id: string;
  /** Scenes referencing this location (within the filtered set) */
  scenes: number;
  /** Total scenes across ALL scenes, regardless of filter */
  scenesTotal: number;
}

export interface LocationStatsResult {
  ranked: LocationStats[];
  most: LocationStats;
  least: LocationStats;
}

/**
 * Location stats, optionally filtered.
 *
 * @example
 * // Which locations appear most in Episode 1?
 * const stats = await getLocationStats({
 *   by: "episode",
 *   id: "her-majestys-displeasure/episode-1",
 * });
 *
 * @example
 * // Which locations does John Lennon appear in most?
 * const stats = await getLocationStats({
 *   by: "character",
 *   id: "her-majestys-displeasure/band/john-lennon",
 * });
 */
export async function getLocationStats(
  filter?: SceneFilter
): Promise<LocationStatsResult> {
  const allScenes = await getCollection("scenes");
  const filteredScenes = applyFilter(allScenes, filter);

  const countLocations = (scenes: AnyScene[]) => {
    const counts: Record<string, number> = {};
    for (const scene of scenes) {
      for (const loc of scene.data.location) {
        counts[loc.id] = (counts[loc.id] ?? 0) + 1;
      }
    }
    return counts;
  };

  const filteredCounts = countLocations(filteredScenes);
  const totalCounts = countLocations(allScenes);

  const ranked: LocationStats[] = Object.entries(filteredCounts)
    .map(([id, scenes]) => ({
      id,
      scenes,
      scenesTotal: totalCounts[id] ?? 0,
    }))
    .sort((a, b) => b.scenes - a.scenes);

  return {
    ranked,
    most: ranked[0],
    least: ranked[ranked.length - 1],
  };
}