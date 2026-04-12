---
trigger: glob
globs: "**/*.astro"
description: >
  Rules for images and static assets in Astro. Covers the distinction between
  src/assets (optimised) and public (served as-is), correct use of the
  <Image /> component, and URL path conventions. Use whenever adding,
  importing, or referencing images or static files.
---

# Astro Images and Assets

Astro has two locations for assets that serve distinct purposes.
Do not conflate them.

## `src/assets/` — Optimised Images

Images you want Astro to optimise (resize, convert to WebP, generate `srcset`).
Import them in frontmatter and use the `<Image />` component.

## `public/` — Static Files Served As-Is

Files that must be served with a stable URL and no processing: favicons,
`robots.txt`, Open Graph images referenced in `<meta>` tags, etc.
Reference them with an absolute path from the domain root.
**Never include the word `public` in the path.**

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.png';
---

<!-- ✅ Optimised image imported from src/assets -->
<Image src={heroImage} alt="Hero image" width={800} height={400} />

<!-- ✅ Public file — absolute path from root, no 'public' in the path -->
<img src="/favicon.svg" alt="Favicon" />

<!-- ❌ WRONG: Never include 'public' as a path segment -->
<img src="/public/favicon.svg" alt="" />

<!-- ❌ WRONG: Never import files from public/ -->
import icon from '../public/icon.png'; // broken
```

## Quick Reference

| Mistake | Correct Approach |
|---|---|
| `/public/filename.ext` in an `src` attribute | Use `/filename.ext` — paths resolve from the domain root |
| Using `<Image />` with files from `public/` | Only import from `src/assets/` for optimised images |
| Importing a file from `public/` in frontmatter | Never — only `src/assets/` files are importable |
