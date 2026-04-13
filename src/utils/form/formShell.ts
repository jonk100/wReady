/**
 * formShell.ts
 *
 * Shared behaviour for all *CreateForm components that use `FormShell.astro`.
 *
 * Handles:
 *   - Details open/close toggle (chevron button + aria-expanded sync)
 *   - Reset button click → form.reset() + optional consumer callback
 *   - Status paragraph helper (text + optional colour)
 *
 * Usage inside a form's <script> block:
 *
 *   import { initFormShell } from '../../utils/formShell.ts';
 *
 *   const { setStatus } = initFormShell({
 *     formId:   'song-create-form',
 *     statusId: 'song-create-status',
 *     onReset() {
 *       // any extra teardown specific to this form, e.g. clearing hidden inputs
 *       chordVoicingsHidden.value = '[]';
 *     },
 *   });
 *
 *   // Then call setStatus anywhere in the form's submit handler:
 *   setStatus('Saving…');
 *   setStatus('Saved!', 'ok');
 *   setStatus('Something went wrong.', 'error');
 */

/** Colour intent for status messages. */
export type StatusKind = 'info' | 'ok' | 'error';

/** Options passed to `initFormShell`. */
export interface FormShellOptions {
  /** The `id` attribute of the `<form>` element. */
  formId: string;
  /** The `id` attribute of the `<p class="status">` element. */
  statusId: string;
  /**
   * Optional callback invoked after `form.reset()` when the user clicks the
   * reset button. Use this to clear hidden inputs or child-component state
   * that `form.reset()` alone won't touch.
   */
  onReset?: () => void;
}

/** Return value from `initFormShell`. */
export interface FormShellHandle {
  /**
   * Updates the status paragraph.
   *
   * @param msg  - Text to display. Pass an empty string to clear.
   * @param kind - Controls text colour:
   *               `'ok'`    → green  (#4ade80)
   *               `'error'` → red    (#f87171)
   *               `'info'`  → muted  (var(--text-muted))   [default]
   */
  setStatus: (msg: string, kind?: StatusKind) => void;
}

/**
 * Wires up the shared FormShell behaviours for a given form.
 *
 * Call this once at the top of each *CreateForm `<script>` block, before
 * the form-specific submit handler.
 *
 * @param options - Configuration for the form shell.
 * @returns       - `{ setStatus }` helper for use in the submit handler.
 */
export function initFormShell(options: FormShellOptions): FormShellHandle {
  const { formId, statusId, onReset } = options;

  // ── Element refs ────────────────────────────────────────────────────────────

  const form      = document.getElementById(formId)   as HTMLFormElement | null;
  const statusEl  = document.getElementById(statusId) as HTMLParagraphElement | null;

  /*
   * Walk up from the form to find the nearest <details> ancestor.
   * This avoids relying on a fixed selector like `document.querySelector('details')`
   * which would break if multiple shells are on the same page.
   */
  const details   = form?.closest('details')          as HTMLDetailsElement | null;
  const toggleBtn = details?.querySelector<HTMLButtonElement>('.create-toggle-btn') ?? null;
  const resetBtn  = details?.querySelector<HTMLButtonElement>('.create-reset-btn') ?? null;

  // ── Status helper ───────────────────────────────────────────────────────────

  /**
   * Sets the text and colour of the status paragraph.
   * Safe to call even if the element isn't found (no-ops gracefully).
   */
  function setStatus(msg: string, kind: StatusKind = 'info'): void {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color =
      kind === 'ok'    ? '#4ade80' :
      kind === 'error' ? '#f87171' :
                         'var(--text-muted)';
  }

  // ── Toggle button (chevron) ─────────────────────────────────────────────────

  /**
   * Syncs the toggle button's `aria-expanded` attribute with the
   * current open/closed state of the `<details>` element.
   */
  function syncToggle(): void {
    if (!toggleBtn || !details) return;
    toggleBtn.setAttribute('aria-expanded', String(details.open));
  }

  if (toggleBtn && details) {
    toggleBtn.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      details.open = !details.open;
      syncToggle();
    });

    // Also sync when the details element is toggled via the <summary> click
    details.addEventListener('toggle', syncToggle);

    // Set initial state
    syncToggle();
  }

  // ── Reset button ────────────────────────────────────────────────────────────

  if (resetBtn && form) {
    resetBtn.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      form.reset();
      setStatus('Form reset.');

      // Call the consumer's teardown callback if provided
      onReset?.();

      // Clear the status message after a short delay
      setTimeout(() => setStatus(''), 1500);
    });
  }

  return { setStatus };
}