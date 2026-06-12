import type { AnyScene, SceneFilter } from "./types.stats";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------


/** Apply a single filter to the full scene list. */
export function applyFilter(scenes: AnyScene[], filter?: SceneFilter): AnyScene[] {
  if (!filter) return scenes;
  return scenes.filter((s) => {
    switch (filter.by) {
      case "project":   return s.data.project.id === filter.id;
      case "episode":   return s.data.episode?.id === filter.id;
      case "sequence":  return s.data.sequence?.id === filter.id;
      case "location":  return s.data.location.some((l) => l.id === filter.id);
      case "character": return s.data.characters.some((c) => c.id === filter.id);
      case "plot":      return s.data.plots.some((p) => p.id === filter.id);
      case "theme":     return s.data.themes.some((t) => t.id === filter.id);
      case "status":    return s.data.status === filter.id;
      case "intOrExt":  return s.data.intOrExt === filter.id;
      case "timeOfDay": return s.data.timeOfDay === filter.id;
    }
  });
}

export function resolveFilter(
  projectSlug: string,
  opts: {
    episode?: string;
    location?: string;
    character?: string;
    plot?: string;
    theme?: string;
    sequence?: string;
    timeOfDay?: string;
  }
): SceneFilter | undefined {
  const prefix = (slug: string) => `${projectSlug}/${slug}`;

  if (opts.episode)   return { by: "episode",   id: prefix(opts.episode) };
  if (opts.location)  return { by: "location",  id: prefix(opts.location) };
  if (opts.character) return { by: "character", id: prefix(opts.character) };
  if (opts.plot)      return { by: "plot",      id: prefix(opts.plot) };
  if (opts.theme)     return { by: "theme",     id: prefix(opts.theme) };
  if (opts.sequence)  return { by: "sequence",  id: prefix(opts.sequence) };
  if (opts.timeOfDay) return { by: "timeOfDay", id: opts.timeOfDay };
 
  return undefined;
}

/**
 * Build the full character reference ID from project + optional group + slug.
 * e.g. projectSlug="her-majestys-displeasure", characterSlug="band/john-lennon"
 * → "her-majestys-displeasure/band/john-lennon"
 */
export function resolveCharacterId(
  projectSlug: string,
  characterSlug: string
): string {
  return `${projectSlug}/${characterSlug}`;
}
 
/**
 * Resolve a location slug to its full reference ID.
 */
export function resolveLocationId(
  projectSlug: string,
  locationSlug: string
): string {
  return `${projectSlug}/${locationSlug}`;
}

/**
 * Pretty-print a reference ID as a readable label.
 * "her-majestys-displeasure/band/john-lennon" → "John Lennon"
 * Takes only the last path segment and title-cases it.
 */
export function labelFromId(id: string): string {
  const slug = id.split("/").pop() ?? id;
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}