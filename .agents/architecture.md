# Architectural Decisions

## 2026-06-12 - Agent Discovery & Integration Architecture

### Discovery Endpoints Structure

All agent discovery endpoints follow the `.well-known` URI convention (RFC 8615) and are implemented as Astro API routes returning JSON. This provides:
- Standard, predictable locations for automated discovery
- Type-safe endpoint definitions with TypeScript
- Server-side rendering with proper Content-Type headers
- Easy maintenance and updates without build-time dependencies

**Endpoint Organization:**
```
src/pages/.well-known/
├── api-catalog.json.ts          # RFC 9727 API Catalog
├── openid-configuration.json.ts # OpenID Connect Discovery
├── oauth-protected-resource.json.ts # RFC 9728 OAuth metadata
├── health.json.ts               # Health check endpoint
├── mcp/
│   └── server-card.json.ts      # MCP Server Card (SEP-1649)
└── agent-skills/
    └── index.json.ts            # Agent Skills Discovery Index
```

### Middleware for Agent Integration

Created a single middleware file (`src/middleware.ts`) that handles two key agent features:

1. **Link Headers (RFC 8288)**: Adds discovery links to homepage responses for automated agent discovery
2. **Markdown for Agents**: Content negotiation that converts HTML to Markdown when `Accept: text/markdown` is present

**Rationale:** Middleware provides a centralized, efficient way to modify responses without duplicating logic across pages. The HTML-to-Markdown conversion happens at request time, avoiding the need to maintain duplicate content formats.

### WebMCP Implementation

WebMCP tools are loaded via an external script (`/scripts/webmcp.js`) rather than inline in the component. This approach:
- Avoids Astro compilation issues with complex inline scripts
- Allows the script to be cached separately
- Makes the WebMCP implementation easier to update independently
- Keeps the BaseHead component clean and maintainable

The script checks for `navigator.modelContext` availability and registers tools only when the WebMCP API is present, ensuring graceful degradation in non-supporting browsers.

### Documentation Strategy

Created three levels of documentation:
1. **User-facing docs** (`/auth.md`, `/docs/dns-aid.md`) - Markdown files in `public/` for direct access
2. **Implementation guide** (`AGENT_READY.md`) - Comprehensive developer documentation at project root
3. **Discovery metadata** (`.well-known` endpoints) - Machine-readable JSON for automated discovery

This layered approach serves both human developers and AI agents effectively.

## 2026-06-08

The follow component directories are grouped by category:

- Typography components live in `src/design/typography/`
- Semantics live in `src/design/semantics/`
- Surfaces live in `src/design/surfaces/`
- Display components live in `src/design/display/`
- Media components live in `src/design/media/`
- Navigation components live in `src/design/nav/`
- Analysis components live in `src/design/analysis/`
- Records components live in `src/design/records/`
- Animation components live in `src/design/animation/`
- Controls live in `src/design/controls/`
- Feedback components live in `src/design/feedback`
- Layout components live in `src/design/layout`
- Overlays live in `src/design/overlays`

Shared logic and styles are applied in the following order:

- Shared types, interfaces, constants, functions, maps, icons, etc. live in `src/design/shared`
- Shared css files live in `src/design/*.css` and `src/styles/*.css`
- Category-specific logic and styles are in `src/design/{category}/*.ts` and `src/design/{category}/*.css`

Typescript files are broken down as follows:

- `{ComponentName}.consts.ts`: component-specific constants (e.g. `const BUTTON_VARIANTS = ['primary', 'secondary'] as const;`)
- `{ComponentName}.types.ts`: component-specific types (e.g. `type ButtonVariants = typeof BUTTON_VARIANTS[number];`)
- `{ComponentName}.maps.ts`: component-specific maps (e.g. `



