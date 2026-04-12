---
trigger: glob
globs: "src/actions/index.ts"
description: >
  Rules for writing Astro Actions in src/actions/index.ts. Covers the
  form-to-action type contract, Zod schema patterns for each field type,
  enum safety, the handler pattern, and the critical rule about matching
  schema types to what the form script actually sends — not raw FormData.
  Based on the working createSong and createChord actions in this project.
---

# Astro Actions

Actions live in `src/actions/index.ts` and are exported from `server`.
They are called from `<script>` blocks using `await import('astro:actions')`.

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:content';
import { MyService } from '../services/my/MyService';

export const server = {
  createThing: defineAction({
    accept: 'json',   // always 'json' — we never use FormData directly
    input: z.object({ ... }),
    handler: async (input) => { ... },
  }),
};
```

---

## The Most Important Rule: Match the Schema to the Payload, Not to FormData

A 400 error almost always means the Zod schema and the payload the form script
sends do not agree on a field's type.

**`rawData` from `FormData` is always strings. But the form script transforms
fields before building the payload.** The action schema must match the
*post-transform* type — what's in the `payload` object — not the raw string.

```ts
// In the form <script>:
const rawData = Object.fromEntries(new FormData(form).entries());
// rawData.themes is a string: '["love","loss"]'

const payload = {
  // JSON.parse called HERE — so the action receives an array, not a string
  themes: JSON.parse(rawData.themes as string || '[]'),
  // parseInt called HERE — so the action receives a number, not a string
  timeSignatureTop: parseInt(rawData.timeSignatureTop as string, 10),
};
```

```ts
// In the action schema, match what payload contains — not rawData:
input: z.object({
  themes: z.array(z.string()).optional(),   // ✅ array — matches payload
  timeSignatureTop: z.number().int(),       // ✅ number — matches payload

  // ❌ WRONG — rawData was transformed before sending:
  themes: z.string().transform(JSON.parse), // receives array, not string → 400
  timeSignatureTop: z.string(),             // receives number, not string → 400
})
```

**Before writing a schema field, ask: has the form script already transformed
this value? If yes, write the schema for the transformed type.**

---

## Field Type Decision Table

Use this table when deciding how to type each field in the action schema.

| What the form script puts in `payload` | Correct schema type |
|---|---|
| `rawData.title as string` | `z.string()` |
| `parseInt(rawData.n as string, 10)` | `z.number().int()` |
| `parseFloat(rawData.n as string)` | `z.number()` |
| `JSON.parse(rawData.arr as string)` | `z.array(z.string())` or appropriate array |
| `rawData.val ? rawData.val as string : undefined` | `z.string().optional()` |
| `rawData.val as string` (sent as raw FormData string, not parsed) | `z.string().transform(...)` |

---

## Enum Safety

**Enum values in the schema must exactly match every option in the form's
`<select>`.** A mismatch silently causes a 400 — Zod rejects the value
without a useful error message.

```ts
// ❌ WRONG — the form <select> has 6 modes, schema only has 2:
keyMode: z.enum(['major', 'minor']),

// ✅ CORRECT — enum covers all options in the select:
keyMode: z.enum(['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian']),
```

**Whenever you add a new `<option>` to a form select, update the action
enum to match.**

---

## Real Example A: `createSong` (complex, nested data)

This action handles a form with parsed arrays, nested objects, optional fields,
and an enum with multiple values. `themes` and all arrays arrive pre-parsed.

```ts
createSong: defineAction({
  accept: 'json',
  input: z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required'),
    keyRoot: z.string().min(1, 'Key root is required'),

    // Enum must match all <option> values in the form select
    keyMode: z.enum(['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian']),

    // Form sends parseInt() result — schema receives a number
    tempo: z.number().int().positive().optional(),
    timeSignatureTop: z.number().int().positive(),
    timeSignatureBottom: z.number().int().positive(),

    // Form sends JSON.parse() result — schema receives arrays
    chordVoicings: z.array(z.string()),
    structure: z.array(z.string()),

    // Form sends JSON.parse() result — schema receives array of objects
    sections: z.array(z.object({
      name: z.string(),
      chords: z.array(z.string()),
      bars: z.number().int().positive(),
      repeats: z.number().int().positive().default(1),
    })),

    album: z.string().optional(),
    chordSheetUrl: z.string().optional(),
    status: z.string().optional(),

    // Form sends JSON.parse() result — schema receives string array, not string
    themes: z.array(z.string()).optional(),

    body: z.string().optional(),
  }),
  handler: async (input) => {
    try {
      const result = await SongService.createSong(input);
      return { success: true, id: result.id, message: 'Song created successfully' };
    } catch (error) {
      console.error('Action createSong error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
}),
```

---

## Real Example B: `createChord` (string transforms for raw FormData strings)

This action's form script sends fields as **raw strings** without pre-parsing.
So the schema itself handles the transforms. Note how this is the opposite
pattern to `createSong` — here the transform belongs in the schema.

```ts
createChord: defineAction({
  accept: 'json',
  input: z.object({
    slug: z.string().min(1, 'Slug is required'),
    displayName: z.string().min(1, 'Display name is required'),
    voicingLabel: z.string().min(1, 'Voicing label is required'),

    // Arrives as a string — schema transforms it to a number
    baseFret: z.string().transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? 1 : num;
    }),

    // These arrive as real arrays (built programmatically, not from FormData)
    fingering: z.array(z.number()).min(6, 'Fingering must have at least 6 positions'),
    frets: z.array(z.number()).min(6, 'Frets must have at least 6 positions'),

    // These arrive as JSON strings — schema transforms them
    notes: z.string().optional().transform((val) => {
      if (!val || val === 'null') return undefined;
      try { return JSON.parse(val); } catch { return undefined; }
    }),
    alternateNames: z.string().optional().transform((val) => {
      if (!val || val === 'null') return undefined;
      try { return JSON.parse(val); } catch { return undefined; }
    }),
    barre: z.string().optional().transform((val) => {
      if (!val || val === 'null') return undefined;
      try { return JSON.parse(val); } catch { return undefined; }
    }),
  }),
  handler: async (input) => {
    try {
      const result = await ChordService.createChord(input);
      return { success: true, id: result.id, message: 'Chord created successfully' };
    } catch (error) {
      console.error('Action createChord error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
}),
```

---

## Handler Pattern

Every handler follows the same shape. Never throw from a handler — catch
errors and return `{ success: false, message }` so the form script can
display them without crashing.

```ts
handler: async (input) => {
  try {
    const result = await [Collection]Service.create[Collection](input);
    return { success: true, id: result.id, message: '[Collection] created successfully' };
  } catch (error) {
    console.error('Action create[Collection] error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
},
```

---

## Calling an Action from a Form Script

Always import `actions` dynamically inside the submit handler. Never import
at the top of the `<script>` block — Astro requires the dynamic import for
actions to resolve correctly at runtime.

```ts
form.addEventListener('submit', async (e: SubmitEvent): Promise<void> => {
  e.preventDefault();

  const formData = new FormData(form);
  const rawData  = Object.fromEntries(formData.entries());

  // Transform fields HERE before building payload.
  // Whatever type you produce here is what the action schema must expect.
  const payload = {
    title:              rawData.title as string,
    timeSignatureTop:   parseInt(rawData.timeSignatureTop as string, 10),
    themes:             JSON.parse(rawData.themes as string || '[]'),
    album:              rawData.album ? rawData.album as string : undefined,
  };

  // ✅ Dynamic import — required for Astro actions
  const { actions } = await import('astro:actions');
  const { data, error } = await actions.create[Collection](payload);

  if (error) {
    statusEl.textContent = `Error: ${error.message}`;
    return;
  }

  if (data.success) {
    statusEl.textContent = `Saved ${data.id}`;
    setTimeout(() => window.location.reload(), 800);
  }
});
```

---

## Debugging a 400

A 400 on `/_actions/[actionName]` is always a Zod validation failure.
Check these in order:

1. **Log the payload in the form script** — `console.log(payload)` before
   calling the action. Confirm every field's actual runtime type.
2. **Compare each field** against the schema. For every field ask:
   is the schema type `z.string()` but the payload has a number or array?
3. **Check all enums** — does every `z.enum([...])` cover every `<option>`
   value in the corresponding select?
4. **Check optional fields** — if a field can be `undefined`, mark it
   `.optional()` in the schema. An absent field that the schema expects
   will also cause a 400.

---

## What NOT to Do

- **Do not** use `accept: 'form'` — always use `accept: 'json'` and build
  a typed payload object in the script
- **Do not** put `z.string().transform(JSON.parse)` for a field that the
  form script already calls `JSON.parse()` on before sending
- **Do not** import `actions` at the top of a `<script>` tag — always
  use dynamic import inside the event handler
- **Do not** throw errors from the handler — catch and return
  `{ success: false, message }` instead
- **Do not** add a new `<select>` option without updating the corresponding
  `z.enum()` in the action schema
