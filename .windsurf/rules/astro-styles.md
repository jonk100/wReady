---
trigger: glob
globs: "**/*.astro"
description: >
  Rules for styling in Astro. Covers scoped vs global styles, using
  define:vars to pass dynamic values into CSS, and the inline style
  custom property trick. Use whenever writing or reviewing <style> blocks
  or dynamic styling logic in .astro files.
---

# Astro Styles

## Scoped vs Global

```astro
<!-- ✅ Scoped by default — styles only apply to this component -->
<style>
  h1 { color: red; }
</style>

<!-- ✅ Global styles — apply to the entire page -->
<style is:global>
  body { margin: 0; }
</style>
```

## Dynamic Values in Styles

You cannot directly interpolate frontmatter variables into `<style>` blocks.
Use one of two approaches depending on scope.

### `define:vars` — for values used across multiple rules

Maps each frontmatter variable to a CSS custom property of the same name
automatically. Use when the dynamic value applies to several selectors.

```astro
---
const accentColor: string = '#ff0000';
const fontSize: string = '1.5rem';
---

<!-- ✅ define:vars maps each key to --css-custom-property automatically -->
<style define:vars={{ accentColor, fontSize }}>
  h1 {
    color: var(--accentColor);
    font-size: var(--fontSize);
  }
</style>
```

### Inline style — for a single element

Better when the dynamic value only applies to one element. Avoids the overhead
of a stylesheet for a single property.

```astro
---
const color: string = '#ff0000';
---

<div style={`--accent: ${color}`} class="themed-box">

<style>
  .themed-box {
    background-color: var(--accent);
  }
</style>
```

## Quick Reference

| Mistake | Correct Approach |
|---|---|
| Interpolating variables directly into `<style>` blocks | Use `<style define:vars={{ myVar }}>` and reference as `var(--myVar)` |
| Using `define:vars` for a single element | Prefer an inline `style` attribute with a CSS custom property |
