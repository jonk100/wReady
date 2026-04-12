---
trigger: always_on
description: >
  Core Astro template syntax rules. Applies to every .astro file.
  Covers class vs className, booleans, event handlers, inline styles,
  conditional rendering, and mapping over arrays.
---

# Astro Template Syntax

Astro uses `.astro` files with a template syntax distinct from JSX/React.
Never apply JSX conventions to Astro templates.

## Class Attribute

```astro
<!-- ✅ CORRECT: Astro uses class -->
<div class="container">

<!-- ❌ WRONG: JSX-style className does not work in Astro templates -->
<div className="container">
```

## Boolean Attributes

```astro
<!-- ✅ CORRECT: Standard HTML booleans -->
<input disabled />
<input type="checkbox" checked />

<!-- ❌ WRONG: JSX boolean syntax -->
<input disabled={true} />
```

## Event Handlers

Astro templates are server-rendered HTML. Inline event handlers like `onClick`
are JSX — they do not exist in Astro. All client-side interactivity belongs
in `<script>` tags.

```astro
<!-- ❌ WRONG: JSX-style event handlers do not work -->
<button onClick={handleClick}>Click</button>

<!-- ✅ CORRECT: Use a script tag for DOM interaction -->
<button id="my-btn">Click</button>
<script>
  document.getElementById('my-btn')?.addEventListener('click', (): void => {
    // handle click
  });
</script>
```

## Inline Styles

```astro
<!-- ✅ CORRECT: Standard HTML string -->
<div style="color: red; font-size: 1rem;">

<!-- ❌ WRONG: JSX object syntax does not work in Astro templates -->
<div style={{ color: 'red' }}>
```

## Conditional Rendering

```astro
---
const isLoggedIn = true;
---

<!-- ✅ CORRECT: Use ternary or && in {} expressions -->
{ isLoggedIn && <p>Welcome back!</p> }
{ isLoggedIn ? <p>Welcome</p> : <p>Please log in</p> }

<!-- ❌ WRONG: JSX fragments are not needed in Astro -->
<>
  <p>One</p>
  <p>Two</p>
</>

<!-- ✅ CORRECT: Sibling elements can be returned directly -->
<p>One</p>
<p>Two</p>
```

## Mapping Over Arrays

```astro
---
const items = ['Apple', 'Banana', 'Cherry'];
---

<!-- ✅ CORRECT: Astro uses .map() with {} expressions -->
<ul>
  {items.map((item) => (
    <li>{item}</li>
  ))}
</ul>

<!-- ❌ WRONG: No key prop required — Astro is not React -->
<ul>
  {items.map((item) => (
    <li key={item}>{item}</li>
  ))}
</ul>
```

## Quick Reference

| Mistake | Correct Approach |
|---|---|
| `className` in `.astro` templates | Use `class` |
| `onClick`, `onChange` in templates | Wire up via `<script>` with `addEventListener` |
| `style={{ color: 'red' }}` | Use `style="color: red"` or `define:vars` |
| `key` prop on mapped elements | Not needed — Astro is not React |
| `{children}` for slot content | Use `<slot />` |
