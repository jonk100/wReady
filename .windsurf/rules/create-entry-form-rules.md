---
trigger: always_on
description: >
  Rules for building "create entry" forms for Astro content collections
  that write MDX files to disk and immediately reflect on reload.
  Also applies when auditing existing collection index pages that
  should have live-write behaviour but don't.
---

# Astro Live-Write Collection Forms

## When this rule applies

Use these rules whenever:

- Asked to build a form for adding a new entry to an Astro content collection
- Asked to add that form to a collection index page (`/src/pages/[collection]/index.astro`)
- Asked to debug an index page where newly-created entries don't appear after a form submit + reload
- Asked to verify whether an existing collection + index page is set up correctly for live-write

---

## The core problem to avoid

Astro's content store (`getCollection()`) is populated **at build time or dev-server
startup**. Even with `prerender: false`, calling `getCollection()` on a SSR page
returns the **stale in-memory snapshot** — it does NOT re-read the filesystem
between requests.

This means: if a form writes a new `.mdx` file to disk and then does
`window.location.reload()`, the reloaded page will **not** show the new entry
unless the index page reads the files directly from disk at request time.

**Never** use `liveFileLoader` or any custom loader to solve this problem.
The solution is simpler: read the files with `fs` and `gray-matter` in the
page frontmatter.

---

## Architecture: three files per collection form feature

```
src/
  actions/
    index.ts                        ← defineAction() for the collection
  services/
    [collection]/
      [Collection]Service.ts        ← writeContentFile() + existence check
  components/
    [collection]/
      [Collection]CreateForm.astro  ← <details> form + <script> submit handler
  pages/
    [collection]/
      index.astro                   ← SSR page, reads disk directly with fs
```

---

## 1. The index page — always read from disk with `fs`

Every collection index page that has a create form **must** read its data this way.
Do not use `getCollection()` on these pages. If you see `getCollection()` on a page
that has a create form and `prerender: false`, that is a bug — replace it.

```astro
---
// src/pages/[collection]/index.astro

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
// ... layout and component imports

export const prerender = false;

/**
 * Reads all [collection] .mdx files directly from disk at request time.
 * Bypasses Astro's content store, which is stale between SSR requests.
 * Shaped like CollectionEntry so downstream components need no changes.
 *
 * @returns {Promise<Array<{ id: string, data: Record<string, any> }>>}
 */
const collectionDir = path.resolve(process.cwd(), 'src/content/[collection]');
const files = await fs.readdir(collectionDir);

const entries = (
  await Promise.all(
    files
      .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(collectionDir, file), 'utf-8');
        const { data } = matter(raw);
        const id = file.replace(/\.(md|mdx)$/, '');
        return { id, data };
      })
  )
).sort((a, b) =>
  // Adjust sort key to match the collection's primary display field
  (a.data.title ?? a.id).localeCompare(b.data.title ?? b.id)
);
---
```

`gray-matter` is already in the project — no new dependencies needed.

The `{ id, data }` shape matches `CollectionEntry`, so `Card` components and
filter components that already accept `CollectionEntry` will work unchanged.

---

## 2. The content.config.ts collection — use `glob()`, nothing custom

The collection in `content.config.ts` must use the standard `glob()` loader.
Do **not** use `liveFileLoader` or any custom loader for collections that have
create forms. The `glob()` loader is fine — the index page bypasses it entirely
at runtime.

```ts
// src/content/config.ts
const myCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/[collection]' }),
  schema: z.object({
    // ... schema fields
  }),
});
```

---

## 3. The Action — `src/actions/index.ts`

Add a `defineAction()` entry for the collection. The input schema should mirror
the collection's Zod schema, with these conventions:

- Arrays sent over JSON stay as arrays (no `.transform(JSON.parse)` needed for
  fields submitted as `z.array(...)` from the form script)
- Optional complex fields (barre, notes, alternateNames) use `.optional()`
- Numeric fields that may arrive as strings use `z.coerce.number()` or
  `.transform(val => parseInt(val, 10))`

```ts
create[Collection]: defineAction({
  accept: 'json',
  input: z.object({
    slug: z.string().min(1, 'Slug is required'),
    // ... remaining fields matching content.config.ts schema
  }),
  handler: async (input) => {
    try {
      const result = await [Collection]Service.create[Collection](input);
      return { success: true, id: result.id, message: '[Collection] created successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
}),
```

---

## 4. The Service — `src/services/[collection]/[Collection]Service.ts`

```ts
import { writeContentFile } from '../../utils/infra/fileOperator';
import { ContentReader } from '../../utils/infra/contentReader';

export const [Collection]Service = {
  /**
   * Validates that the slug is unused, then writes a new MDX file to disk.
   *
   * @param params - Validated input from the action handler
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if the slug already exists
   */
  async create[Collection](params: {
    slug: string;
    // ... all other fields
  }) {
    const { slug, ...data } = params;

    // 1. Guard: reject duplicate slugs
    const exists = await ContentReader.exists('[collection]', slug);
    if (exists) {
      throw new Error(`Slug "${slug}" already exists in [collection].`);
    }

    // 2. Strip undefined values so YAML serialisation doesn't write null keys
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    // 3. Write to disk — the SSR page will pick this up on next request
    const result = await writeContentFile({
      collection: '[collection]',
      slug,
      data: cleanData,
    });

    return { id: result.slug, success: true };
  },
};
```

**Do not** call `fs.utimes()` to touch the file after writing.
That was an attempt to trigger the dev watcher — it is not needed
when the index page reads from disk directly.

---

## 5. The Form Component — `[Collection]CreateForm.astro`

Structure:

- Wrapped in a `<section>` → `<details>` → `<summary>` so it collapses natively
  with no JavaScript. Do not use a `<dialog>` or custom toggle unless requested.
- The `<form>` has a unique ID e.g. `[collection]-create-form`
- A `<p>` with `aria-live="polite"` shows success/error status
- The `<script>` block handles submit, calls `actions.create[Collection]()`,
  and reloads on success

```astro
<script>
  const form = document.getElementById('[collection]-create-form') as HTMLFormElement;
  const statusEl = document.getElementById('[collection]-create-status') as HTMLParagraphElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Saving…';

    try {
      const fd = new FormData(form);
      const rawData = Object.fromEntries(fd.entries());

      const { actions } = await import('astro:actions');

      const payload = {
        slug: rawData.slug as string,
        // ... map remaining fields, parse JSON arrays where needed
      };

      const { data, error } = await actions.create[Collection](payload);

      if (error) {
        statusEl.style.color = '#f87171';
        statusEl.textContent = `Error: ${error.message}`;
      } else if (data.success) {
        statusEl.style.color = '#4ade80';
        statusEl.textContent = `Saved ${data.id}`;

        // Reload triggers a fresh fs.readdir() in the index page frontmatter,
        // so the new entry appears immediately.
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      statusEl.style.color = '#f87171';
      statusEl.textContent = 'Unexpected error. Check the console.';
      console.error(err);
    }
  });
</script>
```

---

## 6. Audit checklist — verifying an existing setup

When asked to check whether a collection index page is correctly set up for
live-write, verify each of these in order:

| # | Check | Pass condition |
|---|---|---|
| 1 | `export const prerender = false` in index page | Present |
| 2 | Index page reads entries | Uses `fs.readdir` + `gray-matter`, NOT `getCollection()` |
| 3 | `content.config.ts` loader | Uses `glob()`, NOT a custom loader |
| 4 | Service | Calls `writeContentFile()`, does NOT call `fs.utimes()` |
| 5 | Form script | Calls `actions.create[X]()`, then `window.location.reload()` on success |
| 6 | Action exists | `create[Collection]` defined in `src/actions/index.ts` |

If check #2 fails and the page uses `getCollection()`, that is the root cause.
Replace the data-fetching block with the `fs` pattern from section 1 above.
Leave all component usage (`<Card>`, filters, grid) unchanged.

---

## What NOT to do

- **Do not** use `getCollection()` on index pages that have create forms
- **Do not** build custom loaders (`liveFileLoader` etc.) to solve this problem
- **Do not** call `fs.utimes()` after writing — it is unnecessary here
- **Do not** wrap forms in `<dialog>` unless explicitly asked
- **Do not** add a delay longer than 1000ms before reload — 800ms is enough
- **Do not** import `getLiveCollection` — it does not exist in Astro's API
- **Do not** use `<form>` action attributes to POST to API routes —
  use Astro Actions (`astro:actions`) with a `submit` event listener instead
