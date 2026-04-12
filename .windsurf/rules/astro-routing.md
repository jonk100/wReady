---
trigger: glob
globs: "**/pages/**/*.astro"
description: >
  Rules for Astro routing. Covers static vs SSR rendering modes, prerender,
  getStaticPaths, dynamic routes, output config, and the removal of hybrid
  mode. Use whenever creating pages, dynamic routes, or configuring rendering
  output behaviour.
---

# Astro Routing

## Rendering Modes

Astro 5+ has two output modes in `astro.config.mjs`. The old `hybrid` mode
no longer exists — it was merged into `static`.

| Mode | Behaviour |
|---|---|
| `output: 'static'` | All pages prerendered at build time by default. Individual pages can opt into SSR with `export const prerender = false`. This is what `hybrid` used to do. |
| `output: 'server'` | All pages rendered on demand (SSR) by default. Individual pages can opt into static with `export const prerender = true`. |

```js
// astro.config.mjs
export default defineConfig({
  output: 'static', // or 'server' — never 'hybrid'
});
```

## Per-Page Prerender Control

```astro
---
// Force this page to SSR regardless of the global output mode
export const prerender = false;
---

---
// Force this page to be statically generated regardless of global output mode
export const prerender = true;
---
```

## Static Dynamic Routes — `getStaticPaths`

Use `getStaticPaths()` to tell Astro which paths to generate at build time
for dynamic route files (e.g. `src/pages/posts/[slug].astro`).

```astro
---
// src/pages/posts/[slug].astro

import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

/**
 * Generates one static page per blog post at build time.
 * Uses post.id (not post.slug) — the Content Layer API identifier.
 */
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id }, // ✅ post.id not post.slug
    props: { post },
  }));
}

interface Props {
  post: CollectionEntry<'blog'>;
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<article>
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

## SSR Dynamic Routes

On SSR pages, read the slug from `Astro.params` at request time instead of
generating paths up front.

```astro
---
// src/pages/posts/[slug].astro
export const prerender = false;

import { getCollection } from 'astro:content';

const { slug } = Astro.params;
const posts = await getCollection('blog');
const post = posts.find((p) => p.id === slug);

if (!post) return Astro.redirect('/404');

const { Content } = await post.render();
---

<article>
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

> Note: On SSR pages `Astro.props` does not carry collection data — read
> everything from `Astro.params` and fetch at request time.

## Quick Reference

| Mistake | Correct Approach |
|---|---|
| `output: 'hybrid'` in astro.config.mjs | Use `output: 'static'` — hybrid no longer exists |
| `post.slug` in `getStaticPaths` params | Use `post.id` |
| Accessing `Astro.props.post` on an SSR page without `getStaticPaths` | Read from `Astro.params` and fetch the entry directly |
| Using `getStaticPaths` on an SSR (`prerender: false`) page | `getStaticPaths` is for static generation only — remove it on SSR pages |
