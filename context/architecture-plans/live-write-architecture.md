# Live-Write Architecture Guide: The "Writty" Framework

This document outlines the working architectural standard for live-write content collections in Writty, based on the proven pattern used by chords, songs, and writings collections.

---

## The Live-Write Pattern

Instead of a complex 5-layer architecture, we use a simplified **3-layer pattern** optimized for Astro's SSR model and live content creation:

### 1. Astro Actions Layer (The Gatekeeper)
**Location:** `src/actions/index.ts`
**Responsibility:** HTTP handling and validation.
This replaces API routes with Astro's built-in Actions system.
* **Key Rule:** No business logic or file-saving code here.
* **Pattern:** `defineAction()` with Zod schema validation and service orchestration.

### 2. Service Layer (The Orchestrator)  
**Location:** `src/services/[collection]/`
**Responsibility:** Coordination and Workflow.
The "brain" of the operation. It validates references, shapes data, and calls infrastructure.
* **Key Rule:** If an action affects more than one file or requires validation, it lives here.
* **Pattern:** Static methods like `[Collection]Service.create[Collection]()`.

### 3. Infrastructure Layer (The Hands)
**Location:** `src/utils/infra/`
**Responsibility:** Technical Execution (I/O).
This layer handles the "dirty work" of file system operations.
* **Key Rule:** These tools are "dumb." They don't know *what* they are saving, only *where* and *how*.
* **Examples:** `fileOperator.ts`, `contentReader.ts`.

---

## The Critical Live-Write Pattern

### The Core Problem
Astro's content store (`getCollection()`) is populated **at build time or dev-server startup**. Even with `prerender: false`, calling `getCollection()` on an SSR page returns the **stale in-memory snapshot**.

### The Solution
**Index pages must read files directly from disk at request time** using `fs` and `gray-matter`.

---

## Complete Collection Implementation Pattern

### 1. Content Collection (`src/content.config.ts`)
```ts
const myCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/[collection]' }),
  schema: z.object({
    // ... schema fields
  }),
});
```

**Key Rule:** Always use `glob()` - never custom loaders for live-write collections.

### 2. Index Page (`src/pages/[collection]/index.astro`)
```astro
---
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { CollectionEntry } from "astro:content";

export const prerender = false;

type EntryType = CollectionEntry<"collection">;

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
        return { 
          id, 
          data: data as EntryType['data'], 
          collection: "collection" as const 
        };
      })
  )
).sort((a, b) => (a.data.title ?? a.id).localeCompare(b.data.title ?? b.id));
---

<!-- Template uses entries array -->
```

**Key Rule:** Never use `getCollection()` on pages with create forms.

### 3. Action (`src/actions/index.ts`)
```ts
createCollection: defineAction({
  accept: 'json',
  input: z.object({
    slug: z.string().min(1, 'Slug is required'),
    // ... other fields matching schema
  }),
  handler: async (input) => {
    try {
      const result = await CollectionService.createCollection(input);
      return { success: true, id: result.id, message: 'Collection created successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
}),
```

### 4. Service (`src/services/[collection]/[Collection]Service.ts`)
```ts
import { writeContentFile } from '../../utils/infra/fileOperator';
import { ContentReader } from '../../utils/infra/contentReader';

export const CollectionService = {
  async createCollection(params: {
    slug: string;
    // ... other fields
  }) {
    const { slug, ...data } = params;

    // 1. Guard: reject duplicate slugs
    const exists = await ContentReader.exists('collection', slug);
    if (exists) {
      throw new Error(`Slug "${slug}" already exists in collection.`);
    }

    // 2. Strip undefined values so YAML serialisation doesn't write null keys
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    // 3. Write to disk - the SSR page will pick this up on next request
    const result = await writeContentFile({
      collection: 'collection',
      slug,
      data: cleanData,
    });

    return { id: result.slug, success: true };
  },
};
```

**Key Rule:** Never call `fs.utimes()` - not needed when index page reads from disk.

### 5. Form Component (`src/components/[collection]/[Collection]CreateForm.astro`)
```astro
<section class="create">
  <details>
    <summary>Add a new [collection]</summary>
    <form id="[collection]-create-form">
      <!-- Form fields -->
      <p id="[collection]-create-status" class="status" aria-live="polite"></p>
    </form>
  </details>
</section>

<script>
  const form = document.getElementById('[collection]-create-form') as HTMLFormElement;
  const statusEl = document.getElementById('[collection]-create-status') as HTMLParagraphElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Saving...';

    try {
      const fd = new FormData(form);
      const rawData = Object.fromEntries(fd.entries());

      const { actions } = await import('astro:actions');

      const payload = {
        slug: rawData.slug as string,
        // ... map other fields
      };

      const { data, error } = await actions.createCollection(payload);

      if (error) {
        statusEl.style.color = '#f87171';
        statusEl.textContent = `Error: ${error.message}`;
      } else if (data.success) {
        statusEl.style.color = '#4ade80';
        statusEl.textContent = `Saved ${data.id}`;

        // Reload triggers fresh fs.readdir() in the index page
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

## Collection Implementation Checklist

When implementing a new collection, verify each of these:

| # | Component | Check | Pass Condition |
|---|---|---|---|
| 1 | `content.config.ts` | Uses `glob()` loader | Yes |
| 2 | Index Page | Reads with `fs.readdir` + `gray-matter` | Yes |
| 3 | Index Page | Has `export const prerender = false` | Yes |
| 4 | Action | `create[Collection]` defined in `actions/index.ts` | Yes |
| 5 | Service | Uses `writeContentFile()` and `ContentReader.exists()` | Yes |
| 6 | Service | Does NOT call `fs.utimes()` | Yes |
| 7 | Form | Calls `actions.create[Collection]()` | Yes |
| 8 | Form | Reloads on success with `window.location.reload()` | Yes |

---

## Why This Pattern Works

| Approach | When data is read | Picks up new files? |
|---|---|---|
| `getCollection()` | Build time / dev startup | **No** - stale between SSR requests |
| Custom loaders | Same as above | **No** - same problem |
| `fs.readdir()` in frontmatter | **Every SSR request** | **Yes** - live updates |

The `window.location.reload()` in the form triggers a fresh page request, which runs the `fs.readdir()` code again, picking up any newly created files immediately.

---

## Migration Strategy

For existing collections using the old pattern:

1. **Update Index Page:** Replace `getCollection()` with `fs.readdir()` pattern
2. **Keep Content Config:** Ensure it uses `glob()` loader (most already do)
3. **Add/Update Action:** Create `create[Collection]` action if missing
4. **Update Service:** Remove any `fs.utimes()` calls
5. **Test Form:** Verify reload works after successful creation

---

## Benefits Over 5-Layer Architecture

1. **Simplicity:** 3 layers instead of 5, easier to maintain
2. **Performance:** Direct file system reading is faster than complex layering
3. **Reliability:** Proven working pattern across multiple collections
4. **Astro-Native:** Uses Astro Actions instead of custom API routes
5. **Live Updates:** Immediate reflection of new content without cache issues

---

## When to Use Domain Logic

If you have complex business logic (music theory, script analysis), create utility functions in `src/utils/domain/` and import them into your services. The services remain the orchestrators, but can call domain helpers for complex calculations.

Example:
```ts
// In SongService.ts
import { validateKeySignature, calculateRelatedKeys } from '../../utils/domain/musicTheory';

export const SongService = {
  async createSong(params) {
    // Domain logic
    validateKeySignature(params.keyRoot, params.keyMode);
    const relatedKeys = calculateRelatedKeys(params.keyRoot, params.keyMode);
    
    // Continue with normal service flow...
  }
};
```

This keeps the live-write pattern intact while allowing for complex domain logic when needed.
