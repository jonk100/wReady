import { getCollection } from "astro:content";
import type { AnyScene, SceneFilter } from './types.stats'
import { applyFilter } from "./helpers";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CharacterStats {
  id: string;
  /** Scenes they appear in (within the filtered set) */
  scenes: number;
  /** Dialogue blocks (c- entries) within the filtered set */
  lines: number;
  /** Total scenes across ALL scenes, regardless of filter */
  scenesTotal: number;
  /** Total lines across ALL scenes, regardless of filter */
  linesTotal: number;
}

export interface CharacterStatsResult {
  ranked: CharacterStats[];           // most → least scenes
  rankedByLines: CharacterStats[];    // most → least lines
  most: CharacterStats;
  least: CharacterStats;
  mostLines: CharacterStats;
  fewestLines: CharacterStats;
}

/**
 * Parse dialogue blocks from MDX body content.
 * A "line" = one c- block (character cue).
 * Returns characterId → line count.
 */
function parseLines(
  body: string,
  characterIds: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  // slug (last path segment, lowercased) → full id
  const slugToId: Record<string, string> = {};
  for (const id of characterIds) {
    const slug = id.split("/").pop()!.toLowerCase();
    slugToId[slug] = id;
  }

  const cueRegex = /^c-(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = cueRegex.exec(body)) !== null) {
    const raw = match[1]
      .replace(/\(CONT'D\)/gi, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    let matchedId: string | undefined = slugToId[raw];
    if (!matchedId) {
      matchedId = Object.keys(slugToId).find((slug) => raw.includes(slug));
    }
    if (matchedId) {
      counts[matchedId] = (counts[matchedId] ?? 0) + 1;
    }
  }

  return counts;
}

/** Accumulate scene-appearance and line counts over a set of scenes. */
function accumulateCharacterCounts(
  scenes: AnyScene[],
  allCharacterIds: string[]
): { appearances: Record<string, number>; lines: Record<string, number> } {
  const appearances: Record<string, number> = {};
  const lines: Record<string, number> = {};

  for (const scene of scenes) {
    for (const c of scene.data.characters) {
      appearances[c.id] = (appearances[c.id] ?? 0) + 1;
    }
    if (scene.body) {
      const counts = parseLines(scene.body, allCharacterIds);
      for (const [id, n] of Object.entries(counts)) {
        lines[id] = (lines[id] ?? 0) + n;
      }
    }
  }

  return { appearances, lines };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Character stats, optionally filtered.
 *
 * @example
 * // Who had the most scenes/lines alongside John Lennon?
 * const stats = await getCharacterStats({
 *   by: "character",
 *   id: "her-majestys-displeasure/band/john-lennon",
 * });
 * // stats.ranked[0]            — most shared scenes with John (John excluded)
 * // stats.ranked[0].scenesTotal — their total scenes across everything
 *
 * @example
 * // Overall character stats for one episode
 * const stats = await getCharacterStats({
 *   by: "episode",
 *   id: "her-majestys-displeasure/episode-1",
 * });
 */
export async function getCharacterStats(
  filter?: SceneFilter
): Promise<CharacterStatsResult> {
  const allScenes = await getCollection("scenes");
  const filteredScenes = applyFilter(allScenes, filter);

  const allCharacterIds = [
    ...new Set(allScenes.flatMap((s) => s.data.characters.map((c) => c.id))),
  ];

  const { appearances: filteredApp, lines: filteredLines } =
    accumulateCharacterCounts(filteredScenes, allCharacterIds);

  const { appearances: totalApp, lines: totalLines } =
    accumulateCharacterCounts(allScenes, allCharacterIds);

  // When filtering "alongside character X", exclude X from results
  const excludeId = filter?.by === "character" ? filter.id : undefined;

  const ranked: CharacterStats[] = Object.entries(filteredApp)
    .filter(([id]) => id !== excludeId)
    .map(([id, scenes]) => ({
      id,
      scenes,
      lines: filteredLines[id] ?? 0,
      scenesTotal: totalApp[id] ?? 0,
      linesTotal: totalLines[id] ?? 0,
    }))
    .sort((a, b) => b.scenes - a.scenes);

  const rankedByLines = [...ranked].sort((a, b) => b.lines - a.lines);

  return {
    ranked,
    rankedByLines,
    most: ranked[0],
    least: ranked[ranked.length - 1],
    mostLines: rankedByLines[0],
    fewestLines: rankedByLines[rankedByLines.length - 1],
  };
}