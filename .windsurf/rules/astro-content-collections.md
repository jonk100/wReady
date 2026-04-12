---
trigger: glob
globs: "**/content.config.ts, **/pages/**/*.astro"
description: >
  Rules for Astro content collections. Covers getCollection, getEntry,
  filtering, sorting (non-deterministic order), post.id vs post.slug,
  build-time vs live collections, and getLiveCollection. Use whenever
  querying, defining, or rendering content collections.
---

# Astro Content Collections

## Querying Collections

```astro
---
import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

// Get all entries in a collection
const allPosts: CollectionEntry<'blog'>[] = await getCollection('blog');

// Get a single entry by id
const post = await getEntry('blog', 'my-first-post');

// Render MDX/MD content to a component
const { Content } = await post.render();
---

<Content />
```

## Filtering Collections

Filter at query time — do not fetch everything and filter in the template.

```astro
---
import { getCollection } from 'astro:content';

const publishedPosts = await getCollection('blog', ({ data }) => {
  return data.draft !== true;
});
---
```

## Always Sort Explicitly

**Astro 5+ does not guarantee collection entry order.** `getCollection()`
returns entries in a non-deterministic, platform-dependent order. Always
apply an explicit sort after querying or filtering.

```astro
---
import { getCollection } from 'astro:content';

const posts = (
  await getCollection('blog', ({ data }) => data.draft !== true)
).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---
```

## `post.id` not `post.slug`

In Astro 5+ (Content Layer API), the correct identifier field is `post.id`.
`post.slug` still exists on legacy collections but is deprecated — do not use
it in new code or in collections that use a `loader`.

```ts
// ✅ Correct: Astro 5+ Content Layer
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

// ❌ Deprecated: legacy API only
params: { slug: post.slug }
```

## Build-Time Collections vs Live Collections

### Build-time (`getCollection`) — use for almost everything

Collections defined with `glob()` or `file()` in `src/content.config.ts`.
Data is loaded once at build time (or dev-server startup) and cached.
Use `getCollection()` and `getEntry()` to query them.

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

### Live collections (`getLiveCollection`) — Astro 6 / 5.10+

Live collections fetch data **at request time** from external sources: APIs,
CMSs, databases. They are defined in a **separate** `src/live.config.ts` file
using `defineLiveCollection()`.

Use live collections when data changes frequently and you can't rebuild on
every update. They have a performance cost (network call per request) and
do not support all Content Layer features.

```ts
// src/live.config.ts
import { defineLiveCollection } from 'astro:content';
import { myApiLoader } from './loaders/myApiLoader';

const products = defineLiveCollection({
  loader: myApiLoader({ endpoint: 'https://api.example.com' }),
});

export const collections = { products };
```

```astro
---
// Page using a live collection must be SSR
export const prerender = false;
import { getLiveCollection } from 'astro:content';

const { entries, error } = await getLiveCollection('products');
if (error) return Astro.redirect('/500');
---

<ul>
  {entries.map((entry) => <li>{entry.data.name}</li>)}
</ul>
```

**Do NOT** use `getLiveCollection()` on build-time (glob-based) collections —
they are separate APIs for separate collection types.

## Quick Reference

| Mistake | Correct Approach |
|---|---|
| Relying on `getCollection()` return order | Always sort explicitly after querying |
| Using `post.slug` in Content Layer collections | Use `post.id` |
| Using `getLiveCollection()` on a glob collection | Only use it with collections defined in `live.config.ts` |
| Fetching data in templates instead of frontmatter | Filter and sort in frontmatter, pass results to template |
