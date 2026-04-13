/**
 * remark-screenplay
 *
 * Transforms shorthand screenplay syntax (s-, a-, c-, d-, p-, t-, etc)
 * into MDX JSX flow elements with correct spacing and grouping.
 *
 * Adds speaker metadata to Dialogue and Parenthetical blocks.
 */

import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { Root, Paragraph, Text } from "mdast";

/* ------------------------------------------------------------------ */
/* types & constants */
/* ------------------------------------------------------------------ */

type BlockType =
  | "scene"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "act-break";

const PREFIX_MAP: Record<string, BlockType> = {
  "s-": "scene",
  "scene-": "scene",

  "a-": "action",
  "action-": "action",

  "c-": "character",
  "character-": "character",

  "d-": "dialogue",
  "dialogue-": "dialogue",

  "p-": "parenthetical",
  "parenthetical-": "parenthetical",

  "t-": "transition",
  "transition-": "transition",

  "ab-": "act-break",
  "act-break-": "act-break",
};

const BLOCK_RE =
  /^(s-|scene-|a-|action-|c-|character-|d-|dialogue-|p-|parenthetical-|t-|transition-|ab-|act-break-)\s*(.+)$/i;

/* ------------------------------------------------------------------ */
/* plugin */
/* ------------------------------------------------------------------ */

export const remarkScreenplay: Plugin<[], Root> = () => {
  return (tree, file) => {
    // Skip processing entirely for non-scene files
    if (!isSceneFilePath(String((file as any)?.path ?? ""))) {
      return;
    }

    const newChildren: any[] = [];

    const implicitEnabled = true;

    let inDialogue = false;
    let dialogueBuffer: any[] = [];
    let currentCharacter: string | null = null;

    const flushDialogue = () => {
      if (!dialogueBuffer.length) return;

      newChildren.push(...dialogueBuffer);
      newChildren.push(blankLine());

      dialogueBuffer = [];
      inDialogue = false;
      currentCharacter = null;
    };

    visit(tree, "paragraph", (node: Paragraph) => {
      const hasNonText = node.children.some(
        (child) => child.type !== "text"
      );
      if (hasNonText) {
        flushDialogue();
        newChildren.push(node);
        return;
      }

      const rawText = node.children
        .filter((child): child is Text => child.type === "text")
        .map((child) => child.value)
        .join("");

      if (!rawText.trim()) {
        flushDialogue();
        newChildren.push(node);
        return;
      }

      const paragraphSource =
        getParagraphSource(file, node) ?? rawText;
      let lines = paragraphSource.trimEnd().split(/\r?\n/);

      const shouldProcessLineByLine =
        inDialogue ||
        lines.some((line) => {
          const trimmed = line.trim();
          if (!trimmed) return false;
          if (BLOCK_RE.test(trimmed)) return true;
          if (!implicitEnabled) return false;
          if (isImplicitSceneLine(trimmed)) return true;
          if (isImplicitCharacterLine(trimmed)) return true;
          if (inDialogue && isImplicitParentheticalLine(trimmed))
            return true;
          return false;
        });

      if (!shouldProcessLineByLine) {
        const raw = rawText.trim();
        const match = raw.match(BLOCK_RE);

        if (!match) {
          if (inDialogue) {
            dialogueBuffer.push(
              jsx("Dialogue", applyInlineCapsMarkers(raw), {
                speaker: currentCharacter,
              })
            );
            return;
          }

          flushDialogue();

          if (implicitEnabled) {
            if (isImplicitSceneLine(raw)) {
              newChildren.push(
                jsx("Scene", normalizeSceneHeading(raw))
              );
              newChildren.push(blankLine());
              return;
            }

            newChildren.push(
              jsx("Action", applyInlineCapsMarkers(raw))
            );
            newChildren.push(blankLine());
            return;
          }

          newChildren.push(node);
          return;
        }

        const [, prefix, valueRaw] = match;
        const type = PREFIX_MAP[prefix.toLowerCase()];
        let value = valueRaw.trim();

        if (type === "scene") {
          value = normalizeSceneHeading(value);
        }

        if (type === "character") {
          flushDialogue();
          inDialogue = true;
          currentCharacter = value.toUpperCase();
          dialogueBuffer.push(
            jsx("Character", currentCharacter)
          );
          return;
        }

        if (type === "parenthetical") {
          dialogueBuffer.push(
            jsx(
              "Parenthetical",
              applyInlineCapsMarkers(stripOuterParens(value)),
              { speaker: currentCharacter }
            )
          );
          return;
        }

        if (type === "dialogue") {
          dialogueBuffer.push(
            jsx("Dialogue", value, {
              speaker: currentCharacter,
            })
          );
          return;
        }

        flushDialogue();
        newChildren.push(jsx(pascal(type), value));
        newChildren.push(blankLine());
        return;
      }

      if (lines.length === 1) {
        const segments = splitShorthandRuns(lines[0]);
        if (segments.length > 1) lines = segments;
      }

      for (const line of lines) {
        const raw = line.trim();
        if (!raw) {
          flushDialogue();
          newChildren.push(blankLine());
          continue;
        }

        const match = raw.match(BLOCK_RE);

        if (!match) {
          if (implicitEnabled) {
            if (isImplicitSceneLine(raw)) {
              flushDialogue();
              newChildren.push(
                jsx("Scene", normalizeSceneHeading(raw))
              );
              newChildren.push(blankLine());
              continue;
            }

            if (isImplicitCharacterLine(raw)) {
              flushDialogue();
              inDialogue = true;
              currentCharacter = raw.toUpperCase();
              dialogueBuffer.push(
                jsx("Character", currentCharacter)
              );
              continue;
            }

            if (inDialogue && isImplicitParentheticalLine(raw)) {
              dialogueBuffer.push(
                jsx(
                  "Parenthetical",
                  applyInlineCapsMarkers(stripOuterParens(raw)),
                  { speaker: currentCharacter }
                )
              );
              continue;
            }

            if (inDialogue) {
              dialogueBuffer.push(
                jsx(
                  "Dialogue",
                  applyInlineCapsMarkers(raw),
                  { speaker: currentCharacter }
                )
              );
              continue;
            }

            flushDialogue();
            newChildren.push(
              jsx("Action", applyInlineCapsMarkers(raw))
            );
            newChildren.push(blankLine());
            continue;
          }

          if (inDialogue) {
            dialogueBuffer.push(
              jsx(
                "Dialogue",
                applyInlineCapsMarkers(raw),
                { speaker: currentCharacter }
              )
            );
            continue;
          }

          flushDialogue();
          newChildren.push({
            type: "paragraph",
            children: [{ type: "text", value: raw }],
          });
          continue;
        }

        const [, prefix, valueRaw] = match;
        const type = PREFIX_MAP[prefix.toLowerCase()];
        let value = valueRaw.trim();

        if (type === "scene") {
          value = normalizeSceneHeading(value);
        }

        if (type === "character") {
          flushDialogue();
          inDialogue = true;
          currentCharacter = value.toUpperCase();
          dialogueBuffer.push(
            jsx("Character", currentCharacter)
          );
          continue;
        }

        if (type === "parenthetical") {
          dialogueBuffer.push(
            jsx(
              "Parenthetical",
              applyInlineCapsMarkers(stripOuterParens(value)),
              { speaker: currentCharacter }
            )
          );
          continue;
        }

        if (type === "dialogue") {
          dialogueBuffer.push(
            jsx(
              "Dialogue",
              applyInlineCapsMarkers(value),
              { speaker: currentCharacter }
            )
          );
          continue;
        }

        flushDialogue();
        newChildren.push(
          jsx(pascal(type), applyInlineCapsMarkers(value))
        );
        newChildren.push(blankLine());
      }
    });

    flushDialogue();
    tree.children = newChildren;
  };
};

/* ------------------------------------------------------------------ */
/* helpers */
/* ------------------------------------------------------------------ */

function jsx(
  name: string,
  value: string,
  attrs?: Record<string, string | null>
) {
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes: Object.entries(attrs ?? {})
      .filter(([, v]) => v)
      .map(([name, value]) => ({
        type: "mdxJsxAttribute",
        name,
        value,
      })),
    children: [{ type: "text", value }],
  };
}

function blankLine() {
  return {
    type: "paragraph",
    children: [{ type: "text", value: "" }],
  };
}

function pascal(input: string) {
  return input
    .split("-")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("");
}

function splitShorthandRuns(input: string) {
  const firstNonWs = input.search(/\S/);
  if (firstNonWs === -1) return [input];

  const prefixKeys = Object.keys(PREFIX_MAP).sort((a, b) => b.length - a.length);
  const escaped = prefixKeys.map(escapeRegExp);
  const prefixRe = new RegExp(`(?:^|\\s)(${escaped.join("|")})`, "gi");

  const starts: number[] = [];
  for (const match of input.matchAll(prefixRe)) {
    const idx = match.index ?? -1;
    if (idx < 0) continue;

    const offset = match[0].startsWith(" ") ? 1 : 0;
    starts.push(idx + offset);
  }

  if (!starts.length) return [input];
  if (starts[0] !== firstNonWs) return [input];
  if (starts.length === 1) return [input];

  const segments: string[] = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : input.length;
    const seg = input.slice(start, end).trim();
    if (seg) segments.push(seg);
  }

  return segments.length ? segments : [input];
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isSceneFilePath(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return normalized.includes("/src/content/scenes/");
}

function getParagraphSource(file: any, node: any) {
  const value = file?.value;
  if (typeof value !== "string") return null;

  const start = node?.position?.start?.offset;
  const end = node?.position?.end?.offset;
  if (typeof start !== "number" || typeof end !== "number") return null;
  if (start < 0 || end <= start || end > value.length) return null;

  return value.slice(start, end);
}

function isImplicitCharacterLine(input: string) {
  const raw = input.trim();
  if (!raw) return false;
  if (raw.startsWith("//")) return false;
  if (BLOCK_RE.test(raw)) return false;

  // Must contain at least one letter and no lowercase letters.
  if (!/[A-Z]/.test(raw)) return false;
  if (/[a-z]/.test(raw)) return false;

  // Reasonable allowed character-name characters.
  if (!/^[A-Z0-9 .,'()\-\/&]+$/.test(raw)) return false;

  return true;
}

function isImplicitParentheticalLine(input: string) {
  const raw = input.trim();
  if (!raw) return false;
  return /^\(.*\)$/.test(raw);
}

function stripOuterParens(input: string) {
  const raw = input.trim();
  if (raw.startsWith("(") && raw.endsWith(")") && raw.length >= 2) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

function isImplicitSceneLine(input: string) {
  const raw = input.trim();
  if (!raw) return false;
  if (BLOCK_RE.test(raw)) return false;
  return /^(int\.?\/ext\.?|int\/ext|int\.|int|ext\.|ext)\b/i.test(raw);
}

function normalizeSceneHeading(input: string) {
  return input
    .trim()
    .replace(/^int\/?ext\b/i, "INT./EXT.")
    .replace(/^int\/ext\b/i, "INT./EXT.")
    .replace(/^int\b/i, "INT.")
    .replace(/^ext\b/i, "EXT.");
}

function applyInlineCapsMarkers(input: string) {
  // Inline marker: `//Name Here` -> `NAME HERE`
  // We only treat `//` as a marker when it appears at the start of the string
  // or after whitespace. This avoids matching URLs like `http://...`.
  return input.replace(
    /(^|\s)\/\/([A-Za-z0-9][A-Za-z0-9 .,'()\-\/&]*)/g,
    (_m, lead, name) => `${lead}${String(name).toUpperCase()}`
  );
}

function warn(file: any, message: string, node: any) {
  file.message(message, node);
}
