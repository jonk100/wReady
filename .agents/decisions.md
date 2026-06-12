## Agent Discovery — External WebMCP Script Over Inline

Moved WebMCP tool registration from an inline `<script is:inline>` tag in BaseHead.astro to an external `/scripts/webmcp.js` file.

**Reasoning:** Astro 6 has stricter compilation rules around inline scripts with complex JavaScript. The 180-line WebMCP implementation with async functions and nested objects was causing compilation issues. Externalizing the script:
- Avoids Astro's inline script limitations
- Allows browser caching of the WebMCP implementation
- Makes updates easier without touching component files
- Maintains the same functionality with better separation of concerns

The script is loaded via a simple `<script src="/scripts/webmcp.js"></script>` tag and executes when the page loads, checking for `navigator.modelContext` availability before registering tools.

## Agent Discovery — Middleware for Cross-Cutting Concerns

Implemented Link headers and Markdown content negotiation in a single middleware file (`src/middleware.ts`) rather than in individual page components or layouts.

**Reasoning:** These features need to apply across multiple pages and modify HTTP responses. Middleware provides:
- Single source of truth for agent-related response modifications
- Efficient request/response interception without duplicating logic
- Easy to enable/disable agent features in one place
- Proper HTTP header management (Link headers, Content-Type, Vary)

The middleware clones responses to add headers, ensuring immutability and avoiding side effects. For Markdown conversion, it only processes HTML responses when the client explicitly requests `text/markdown`.

## Agent Discovery — Astro API Routes for .well-known Endpoints

Implemented all `.well-known` discovery endpoints as Astro API routes (`.json.ts` files) returning JSON responses, rather than static JSON files in `public/`.

**Reasoning:** API routes provide:
- Type safety with TypeScript
- Dynamic content generation (timestamps, computed values)
- Proper Content-Type headers automatically
- Ability to add logic/validation if needed in the future
- Better integration with Astro's build system

Static JSON files would require manual Content-Type configuration and couldn't include dynamic values like current timestamps or computed hashes.

## Agent Discovery — Fragment Component Over Shorthand Syntax

Fixed compilation error in Breadcrumb.astro by replacing Fragment shorthand `<>` with explicit `<Fragment>` component.

**Reasoning:** Astro 6 doesn't support attributes on Fragment shorthand syntax (`<> ... </>`). The error "Unable to assign attributes when using <> Fragment shorthand syntax" occurred because the JSX map function was trying to apply attributes to the Fragment. Using the explicit `<Fragment>` component resolves this while maintaining the same rendering behavior (no wrapper element in the DOM).

```TS
// ======== EXAMPLE DECISION ENTRY ===============================
// ===============================================================
````
## ComponentPreview — DOM Patching Over Re-rendering

For the interactive prop explorer, we chose direct DOM patching (class swapping, style variable updates, element visibility toggling) over iframe re-rendering or client-side framework rendering. This keeps the component zero-dependency, compatible with any Astro-rendered component, and avoids the combinatorial explosion of pre-rendering all prop states. The consumer renders the component in its "maximal state" (all optional features enabled), and the JS subtracts or modifies from there.

## ComponentPreview — Syntax Highlighting

Uses a lightweight ~40-line regex tokenizer for code block colorization instead of runtime Shiki. Astro's built-in Shiki is build-time only and can't highlight dynamically changing code. The tokenizer handles HTML/JSX tags, attributes, strings, and punctuation — sufficient for the short code snippets the component generates.
