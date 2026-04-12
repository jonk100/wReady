---
trigger: glob
globs: "**/components/**/*.astro"
description: >
  Rules for authoring Astro components. Covers defining Props interfaces,
  destructuring Astro.props, spreading HTML attributes, slots, named slots,
  and conditional slot rendering with Astro.slots.has(). Use whenever
  creating or editing a component file.
---

# Astro Components

## Defining and Using Props

Always define a `Props` interface in the frontmatter and destructure from
`Astro.props`. Provide default values for optional props at destructure time.

```astro
---
interface Props {
  title: string;
  count?: number;
  variant?: 'primary' | 'secondary';
}

const { title, count = 0, variant = 'primary' } = Astro.props;
---

<div class={`card card--${variant}`}>
  <h2>{title}</h2>
  <p>{count}</p>
</div>
```

## Spreading HTML Attributes

Extend `HTMLAttributes` to allow arbitrary HTML attributes to pass through to
the underlying element. This is the correct pattern for wrapper components
that need to forward things like `id`, `aria-*`, `class`, etc.

```astro
---
import type { HTMLAttributes } from 'astro/types';

interface Props extends HTMLAttributes<'button'> {
  label: string;
}

const { label, ...rest } = Astro.props;
---

<button {...rest}>{label}</button>
```

## Slots

Astro uses `<slot />` for content injection, not `{children}`.

```astro
<!-- Card.astro -->
<div class="card">
  <slot name="header" />
  <div class="card__body">
    <slot /> <!-- default slot -->
  </div>
</div>

<!-- Usage -->
<Card>
  <h2 slot="header">My Title</h2>
  <p>This goes in the default slot.</p>
</Card>
```

## Conditional Slots with `Astro.slots.has()`

Use `Astro.slots.has()` to conditionally render a wrapper element **only**
when the caller actually passes content for that slot. Without this guard,
the wrapper element renders even when empty, which can break layouts and
add unwanted spacing.

```astro
<div class="card">
  {Astro.slots.has('header') && (
    <header class="card__header">
      <slot name="header" />
    </header>
  )}

  <div class="card__body">
    <slot />
  </div>

  {Astro.slots.has('footer') && (
    <footer class="card__footer">
      <slot name="footer" />
    </footer>
  )}
</div>
```

## Quick Reference

| Mistake | Correct Approach |
|---|---|
| `{children}` for slot content | Use `<slot />` |
| Rendering a wrapper for an optional slot unconditionally | Guard with `Astro.slots.has('slotName')` |
| Accessing props without a typed interface | Always define `interface Props` and destructure `Astro.props` |
