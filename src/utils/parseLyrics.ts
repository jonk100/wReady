/**
 * parseLyrics.ts
 *
 * Parses a raw song body string into grouped section occurrences.
 *
 * Marker syntax:
 *   [verse]        — whole section, all bars
 *   [verse:1-8]    — named bar range slice of this section
 *   [chorus]
 *   [bridge:1-4]
 *
 * Consecutive markers with the same section name are grouped into a single
 * SectionOccurrence with multiple LyricSlice children. This lets a 16-bar
 * verse be split across two stanzas with bars 1–8 above the first and 9–16
 * above the second, under one collapsible chord-sheet header.
 *
 * A new occurrence of the same name after a different section name (e.g.
 * verse → chorus → verse) starts a fresh SectionOccurrence.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single bar-range + lyrics chunk within a section occurrence.
 * If no `:start-end` was specified, barStart/barEnd will be null
 * (meaning "show all bars for this occurrence").
 */
export interface LyricSlice {
  /** 1-based start bar, or null if no range was specified */
  barStart: number | null;
  /** 1-based end bar (inclusive), or null if no range was specified */
  barEnd: number | null;
  /** Trimmed lyric text beneath this marker */
  lyrics: string;
}

/**
 * One occurrence of a named section in the document — may contain
 * multiple LyricSlice children if the section was split with bar ranges.
 */
export interface SectionOccurrence {
  /** Normalised section name e.g. "verse", "pre-chorus" */
  sectionName: string;
  /**
   * Zero-based position of this occurrence among ALL occurrences
   * in the document. Used for anchor ids and stable keys.
   */
  documentIndex: number;
  /** One or more lyric slices belonging to this occurrence */
  slices: LyricSlice[];
}

/**
 * A prose block that appears before the first [section] marker.
 * Rendered as a plain paragraph.
 */
export interface PreambleBlock {
  kind: 'preamble';
  lyrics: string;
  documentIndex: number;
}

/** Discriminated union of what the parser can return */
export type ParsedBlock = SectionOccurrence | PreambleBlock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a raw section name to lowercase-hyphenated form so it matches
 * the frontmatter `sections[].name` convention.
 *
 * @param raw - e.g. "Verse 1", "Pre Chorus"
 * @returns e.g. "verse-1", "pre-chorus"
 */
export function normaliseSectionName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Parses a marker line like "[verse:1-8]" into its component parts.
 *
 * @param line - A single line of text from the body
 * @returns Parsed marker or null if the line is not a marker
 */
function parseMarker(
  line: string
): { name: string; barStart: number | null; barEnd: number | null } | null {
  const match = line.match(/^\s*\[([^\]:]+)(?::(\d+)-(\d+))?\]\s*$/);
  if (!match) return null;

  const name = normaliseSectionName(match[1] ?? '');
  if (!name) return null;

  const barStart = match[2] != null ? parseInt(match[2], 10) : null;
  const barEnd = match[3] != null ? parseInt(match[3], 10) : null;

  return { name, barStart, barEnd };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parses a raw song body string into an ordered array of ParsedBlocks.
 *
 * Consecutive [section] / [section:range] markers with the same name are
 * collapsed into a single SectionOccurrence with multiple slices. A new
 * occurrence begins when either a different section name is encountered, or
 * the same name reappears after a different section in between.
 *
 * @param body - Raw entry.body string (plain text, not MDX)
 * @returns Ordered array of ParsedBlock (SectionOccurrence | PreambleBlock)
 */
export function parseLyrics(body: string): ParsedBlock[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n');

  const blocks: ParsedBlock[] = [];
  let pendingLines: string[] = [];
  let currentOccurrence: SectionOccurrence | null = null;
  let currentSlice: LyricSlice | null = null;
  let docIndex = 0;

  /**
   * Finalises the current slice by writing pendingLines into it,
   * then appending it to currentOccurrence.slices.
   */
  function flushSlice(): void {
    if (!currentSlice || !currentOccurrence) return;
    currentSlice.lyrics = pendingLines.join('\n').trim();
    currentOccurrence.slices.push(currentSlice);
    currentSlice = null;
    pendingLines = [];
  }

  /**
   * Finalises the current occurrence and pushes it to blocks.
   * Implicitly flushes the current slice first.
   */
  function flushOccurrence(): void {
    flushSlice();
    if (currentOccurrence) {
      blocks.push(currentOccurrence);
      currentOccurrence = null;
    }
  }

  /**
   * Emits any accumulated preamble lines as a PreambleBlock.
   */
  function flushPreamble(): void {
    const text = pendingLines.join('\n').trim();
    if (text) {
      blocks.push({ kind: 'preamble', lyrics: text, documentIndex: docIndex++ });
    }
    pendingLines = [];
  }

  for (const line of lines) {
    const marker = parseMarker(line);

    if (!marker) {
      pendingLines.push(line);
      continue;
    }

    const isContinuation =
      currentOccurrence !== null && currentOccurrence.sectionName === marker.name;

    if (isContinuation) {
      flushSlice();
    } else {
      if (currentOccurrence) {
        flushOccurrence();
      } else {
        flushPreamble();
      }

      currentOccurrence = {
        sectionName: marker.name,
        documentIndex: docIndex++,
        slices: [],
      };
    }

    currentSlice = {
      barStart: marker.barStart,
      barEnd: marker.barEnd,
      lyrics: '',
    };
    pendingLines = [];
  }

  // EOF — flush whatever is open
  if (currentOccurrence) {
    flushOccurrence();
  } else {
    flushPreamble();
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Chord slicing utility
// ---------------------------------------------------------------------------

/**
 * Extracts the chords for a bar range from a section's chord array.
 *
 * The chord array is bar-indexed: one element per bar. Elements may be
 * multi-chord strings like "E A" representing two changes within one bar.
 * No arithmetic is needed — just slice by bar index directly.
 *
 * @param chords   - Full chord array (one element = one bar)
 * @param barStart - 1-based start bar (inclusive)
 * @param barEnd   - 1-based end bar (inclusive)
 * @returns The subset of chord entries for this bar range
 *
 * @example
 * sliceChords(["E","E A","E","E A"], 3, 4) // → ["E","E A"]
 */
export function sliceChords(
  chords: string[],
  barStart: number,
  barEnd: number
): string[] {
  return chords.slice(barStart - 1, barEnd);
}
