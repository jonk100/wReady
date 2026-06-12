/**
 * screenplay-editor.ts
 * ─────────────────────────────────────────────
 * Utility functions for the scene editor:
 * caret measurement, screenplay rendering,
 * frontmatter parsing, and HTML escaping.
 */

/**
 * Escape special HTML characters in a string.
 *
 * @param {string} text - Raw text that may contain HTML special chars
 * @returns {string} Escaped string safe for innerHTML
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Count frontmatter lines (between the two `---` fences) in the raw markdown.
 * Returns the total number of lines occupied by the frontmatter block,
 * including the opening and closing fence lines.
 *
 * @param {string} raw - Raw MDX file content
 * @returns {number} Line count of the frontmatter block (inclusive of fences)
 */
export function countFrontmatterLines(raw: string): number {
  const lines = raw.split('\n');
  if (lines[0]?.trim() !== '---') return 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') return i + 1;
  }
  return 0;
}

/**
 * Parse raw MDX and render screenplay HTML for the live preview.
 * Strips frontmatter before rendering.
 *
 * @param {string} markdown - Raw MDX content
 * @returns {string} HTML string of rendered screenplay elements
 */
export function renderScreenplay(markdown: string): string {
  const lines = markdown.split('\n');
  let html = '';
  let inFrontmatter = false;
  let frontmatterDone = false;
  let inDialogue = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!frontmatterDone && trimmed === '---') {
      inFrontmatter = !inFrontmatter;
      if (!inFrontmatter) frontmatterDone = true;
      continue;
    }
    if (!frontmatterDone && inFrontmatter) continue;

    if (!trimmed) {
      inDialogue = false;
      continue;
    }

    if (trimmed.match(/^(s-|scene-)/i)) {
      html += `<div class="scene">${escapeHtml(trimmed.replace(/^(s-|scene-)/i, '').trim())}</div>`;
      inDialogue = false;
    } else if (trimmed.match(/^(a-|action-)/i)) {
      html += `<div class="action">${escapeHtml(trimmed.replace(/^(a-|action-)/i, '').trim())}</div>`;
      inDialogue = false;
    } else if (trimmed.match(/^(c-|character-)/i)) {
      html += `<div class="character">${escapeHtml(trimmed.replace(/^(c-|character-)/i, '').trim().toUpperCase())}</div>`;
      inDialogue = true;
    } else if (trimmed.match(/^(d-|dialogue-)/i)) {
      html += `<div class="dialogue">${escapeHtml(trimmed.replace(/^(d-|dialogue-)/i, '').trim())}</div>`;
    } else if (trimmed.match(/^(p-|parenthetical-)/i)) {
      const cleaned = trimmed.replace(/^(p-|parenthetical-)/i, '').trim().replace(/^\(|\)$/g, '');
      html += `<div class="parenthetical">(${escapeHtml(cleaned)})</div>`;
    } else if (trimmed.match(/^(t-|transition-)/i)) {
      html += `<div class="transition">${escapeHtml(trimmed.replace(/^(t-|transition-)/i, '').trim())}</div>`;
      inDialogue = false;
    } else if (trimmed.match(/^(INT\.|EXT\.|INT\/EXT)/i)) {
      html += `<div class="scene">${escapeHtml(trimmed)}</div>`;
      inDialogue = false;
    } else if (/^[A-Z][A-Z0-9 .,'()\-\/&]+$/.test(trimmed) && !/[a-z]/.test(trimmed)) {
      html += `<div class="character">${escapeHtml(trimmed)}</div>`;
      inDialogue = true;
    } else if (/^\(.*\)$/.test(trimmed) && inDialogue) {
      html += `<div class="parenthetical">(${escapeHtml(trimmed.slice(1, -1))})</div>`;
    } else if (inDialogue) {
      html += `<div class="dialogue">${escapeHtml(trimmed)}</div>`;
    } else {
      html += `<div class="action">${escapeHtml(trimmed)}</div>`;
    }
  }

  return html;
}

/**
 * Find the rendered preview element that corresponds to a given
 * line number in the textarea, skipping frontmatter lines.
 *
 * @param {number} cursorLine - 0-indexed line number of the textarea cursor
 * @param {string} raw - Raw textarea content
 * @param {HTMLElement} previewEl - The preview container element
 * @returns {Element | null} The matching preview element, or null
 */
export function getPreviewElementForLine(cursorLine: number, raw: string, previewEl: HTMLElement): Element | null {
  const lines = raw.split('\n');

  // Find where frontmatter ends
  let fmEnd = 0;
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') { fmEnd = i + 1; break; }
    }
  }

  // If cursor is inside frontmatter, highlight nothing
  if (cursorLine < fmEnd) return null;

  // Count non-empty content lines from fmEnd up to cursorLine
  let contentLineIndex = 0;
  for (let i = fmEnd; i < cursorLine; i++) {
    if (lines[i]?.trim()) contentLineIndex++;
  }

  // Get all rendered screenplay elements in the preview
  const elements = previewEl!.querySelectorAll(
    '.scene, .action, .character, .dialogue, .parenthetical, .transition'
  );

  return elements[contentLineIndex] ?? elements[elements.length - 1] ?? null;
}

/**
 * Measure the pixel position of a textarea's caret using a hidden mirror div.
 *
 * @param {HTMLTextAreaElement} textarea - The textarea element to measure
 * @returns {{ top: number, left: number, height: number }}
 */
export function getCaretCoords(
  textarea: HTMLTextAreaElement
): { top: number; left: number; height: number } {
  const computed = getComputedStyle(textarea);
  const lh = parseFloat(computed.lineHeight) || 22;

  const mirror = document.createElement('div');
  mirror.style.cssText = [
    'position:fixed',
    'visibility:hidden',
    'pointer-events:none',
    'white-space:pre-wrap',
    'word-wrap:break-word',
    `font-family:${computed.fontFamily}`,
    `font-size:${computed.fontSize}`,
    `font-weight:${computed.fontWeight}`,
    `line-height:${computed.lineHeight}`,
    `letter-spacing:${computed.letterSpacing}`,
    `padding:${computed.padding}`,
    `border:${computed.border}`,
    `box-sizing:${computed.boxSizing}`,
    `width:${textarea.offsetWidth}px`,
    'overflow:hidden',
    'top:0',
    'left:0',
  ].join(';');

  const before = document.createTextNode(textarea.value.slice(0, textarea.selectionStart));
  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  mirror.appendChild(before);
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const markerRect = marker.getBoundingClientRect();
  const textareaRect = textarea.getBoundingClientRect();
  document.body.removeChild(mirror);

  return {
    top:    markerRect.top  - textareaRect.top  + textarea.scrollTop,
    left:   markerRect.left - textareaRect.left,
    height: lh,
  };
}