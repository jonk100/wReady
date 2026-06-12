import { getCollection } from "astro:content";

export type SceneFilter =
  | { by: "project";   id: string }
  | { by: "episode";   id: string }
  | { by: "sequence";  id: string }
  | { by: "location";  id: string }
  | { by: "character"; id: string }  // "alongside" — scenes containing this character
  | { by: "plot";      id: string }
  | { by: "theme";     id: string }
  | { by: "status";    id: "outline" | "first-draft" | "revised" | "locked" }
  | { by: "intOrExt";  id: "INT" | "EXT" | "INT/EXT" }
  | { by: "timeOfDay"; id: string };


export type AnyScene = Awaited<ReturnType<typeof getCollection<"scenes">>>[number];
