---
trigger: glob
globs: "**/*.astro"
description: >
  Rules for Astro frontmatter and <script> tags. Covers the server/client
  boundary, TypeScript conventions in scripts, define:vars, data-* attributes,
  and script hoisting behaviour. Use whenever writing or reviewing frontmatter
  logic or client-side script blocks.
---

# Astro Frontmatter and Script Tags

## The Server / Client Boundary

Astro has two distinct execution contexts that must never be confused:

- **Frontmatter** (between `---` fences) — runs **server-side only**, at build
  time or SSR request time. No browser APIs available here.
- **`<script>` tags** — run **in the browser**. TypeScript is supported and
  compiled by Vite.

## Frontmatter

### Correct Usage

```astro
---
// ✅ Import components and data here
import MyComponent from '../components/MyComponent.astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

// ✅ Fetch data and perform async operations
const posts = await getCollection('blog');

// ✅ Define variables available in the template
const title = 'My Page';
const count = posts.length;
---
```

### What NOT to Do in Frontmatter

```astro
---
// ❌ WRONG: Do not use document, window, or any browser APIs here
// This code runs on the server — these will throw ReferenceError
const el = document.getElementById('foo');

// ❌ WRONG: Do not define event handler functions here
// They cannot be referenced in template event attributes
function handleClick() { ... }
---
```

### Accessing Frontmatter Variables in Templates

```astro
---
const greeting = 'Hello, world!';
const items = ['one', 'two', 'three'];
---

<!-- ✅ Single curly braces to interpolate -->
<h1>{greeting}</h1>
<p>There are {items.length} items.</p>
```

## Script Tags

**Always write TypeScript in `<script>` tags — never plain JavaScript.**
Always cast DOM query results to their specific HTML element types, annotate
variables with explicit types, and annotate function return types.

```astro
<button id="counter-btn">Count: <span id="count">0</span></button>

<script>
  // ✅ Cast to specific element types
  const btn = document.getElementById('counter-btn') as HTMLButtonElement;
  const countEl = document.getElementById('count') as HTMLSpanElement;

  let count: number = 0;

  btn.addEventListener('click', (): void => {
    count++;
    countEl.textContent = String(count);
  });
</script>
```

## Script Hoisting and Scoping

By default, Astro `<script>` tags are **hoisted and bundled** — a script in a
component runs **once per page**, not once per component instance. Use
`querySelectorAll` to handle all instances on the page.

```astro
<script>
  // ✅ Runs once — selects all instances
  document.querySelectorAll<HTMLButtonElement>('.my-btn').forEach((btn): void => {
    btn.addEventListener('click', (): void => { /* ... */ });
  });
</script>

<!-- Use is:inline to opt out of hoisting/bundling entirely -->
<script is:inline>
  // Not processed by Vite — no TypeScript, no imports, executes as-is
</script>
```

## Passing Frontmatter Data to Scripts

You cannot directly reference frontmatter variables inside `<script>` tags.
Choose one of these two approaches:

### Option A: `define:vars` — for simple scalar values

Injects frontmatter values directly as named variables inside the script.

> ⚠️ `define:vars` forces `is:inline` behaviour. The script is not processed
> by Vite, which means **no TypeScript type annotations** and **no `import`
> statements** are available inside it.

```astro
---
const apiEndpoint: string = '/api/users';
const maxItems: number = 10;
---

<!-- ✅ Variables are available by their original names inside the script -->
<script define:vars={{ apiEndpoint, maxItems }}>
  console.log(apiEndpoint); // '/api/users'
  console.log(maxItems);    // 10
</script>
```

### Option B: `data-*` attributes — when TypeScript support is needed

Use when you need full TypeScript support inside the script, or when the value
also needs to be accessible from markup.

```astro
---
const userId: string = 'abc123';
---

<div id="profile" data-user-id={userId}></div>

<script>
  // ✅ Full TypeScript support available here
  const el = document.getElementById('profile') as HTMLElement;
  const userId: string = el.dataset.userId ?? '';
</script>
```

## Quick Reference

| Mistake | Correct Approach |
|---|---|
| Browser APIs (`document`, `window`) in frontmatter | Only in `<script>` tags |
| Defining event handler functions in frontmatter | Define them in `<script>` tags |
| Plain JavaScript in `<script>` tags | Always use TypeScript with explicit types and element casts |
| Referencing frontmatter variables directly in `<script>` | Use `define:vars` for scalars; `data-*` when TypeScript annotations are needed |
| Expecting `<script>` to run per component instance | Scripts are hoisted; use `querySelectorAll` or `is:inline` |
| Importing `.astro` components in `<script>` tags | Import them in frontmatter only |
