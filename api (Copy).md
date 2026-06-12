# API Documentation - Content Creation Forms

This document covers all the forms and APIs for adding content to the Writty application.

## Overview

Writty includes several forms for creating different types of content:
- **Chords**: Guitar chord voicing creation

## Environment Setup

### File Writing Control

Set the following environment variable to enable file writing:

```bash
ALLOW_CHORD_WRITE=true
```

- **Default**: `false` (files are not written to disk)
- **Purpose**: Controls whether form submissions create actual files in the content collections
- **Usage**: When `false`, forms generate MDX output for preview/copying only

## Chord Search API

### Endpoint: `GET /api/chords/search`

Live search endpoint for finding chords by name, slug, or voicing label. Used by the interactive chord selector in song forms.

#### Request

**Method**: `GET`
**Query Parameters**:
- `q` (optional): Search query string. If empty, returns all chords.

**Examples**:
```bash
GET /api/chords/search?q=am
GET /api/chords/search?q=C
GET /api/chords/search?q=barre
GET /api/chords/search  # Returns all chords
```

#### Response

**Success (200)**:
```json
{
  "chords": [
    {
      "slug": "am-0",
      "displayName": "Am",
      "voicingLabel": "Open"
    },
    {
      "slug": "am-1", 
      "displayName": "Am",
      "voicingLabel": "E-shape barre"
    },
    {
      "slug": "am-2",
      "displayName": "Am", 
      "voicingLabel": "D-shape barre"
    }
  ]
}
```

**Empty Results**:
```json
{
  "chords": []
}
```

#### Search Behavior

- **Case-insensitive**: Search ignores case
- **Multi-field**: Searches across `slug`, `displayName`, and `voicingLabel`
- **Partial matching**: Matches substrings (e.g., "am" matches "Am")
- **Real-time**: Designed for debounced live search (200ms delay recommended)

#### Frontend Integration

```javascript
// Debounced search function
let debounceTimer = null;

async function searchChords(query) {
  if (debounceTimer) clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(async () => {
    const response = await fetch(`/api/chords/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();
    
    // Update dropdown with results
    updateChordDropdown(results.chords);
  }, 200);
}

// Usage in input field
document.getElementById('chord-input').addEventListener('input', (e) => {
  searchChords(e.target.value);
});
```

## Chord Creation API

### Endpoint: `POST /api/chords/create`

Creates a new chord entry in the chords collection.

#### Request

**Method**: `POST`
**Content-Type**: `application/x-www-form-urlencoded` or `multipart/form-data`

**Form Fields**:
- `slug` (required): URL-friendly identifier
- `displayName` (required): Display name for the chord
- `voicingLabel` (required): Description of the voicing (e.g., "Open", "A-shape barre")
- `baseFret` (optional): Base fret number
- `fingering` (optional): Fingering pattern
- `frets` (optional): Fret positions
- `notes` (optional): Note names
- `barre` (optional): Barre chord information
- `alternateNames` (optional): Alternative chord names
- `enharmonic` (optional): Enharmonic chord names

#### Response

**Success (200)**:
```json
{
  "ok": true,
  "slug": "c-0",
  "mdx": "---\nslug: c-0\n---\n# C\n\nOpen position C chord.",
  "wroteFile": false,
  "filePath": "src/content/chords/c-0.mdx"
}
```

**Error (400/500)**:
```json
{
  "ok": false,
  "error": "Missing required field: displayName"
}
```

## Song Creation API

### Endpoint: `POST /api/songs/create`

Creates a new song entry in the songs collection. Features an interactive chord selector powered by the search API.

#### Request

**Method**: `POST`
**Content-Type**: `application/x-www-form-urlencoded` or `multipart/form-data`

**Form Fields**:
- `title` (required): Song title
- `slug` (optional): Auto-generated from title if not provided
- `keyRoot` (required): Musical key root (C, C#, D, etc.)
- `keyMode` (required): Musical key mode (major, minor, dorian, etc.)
- `tempo` (optional): BPM tempo
- `timeSignatureTop` (required): Top number of time signature
- `timeSignatureBottom` (required): Bottom number of time signature
- `chordVoicings` (required): JSON array of chord slugs (populated by interactive selector)
- `structure` (optional): JSON array of section names
- `sections` (optional): JSON array of section objects
- `album` (optional): Album name
- `chordSheetUrl` (optional): URL to chord sheet
- `status` (optional): Song status (idea, demo, arranged, recorded, released)
- `themes` (optional): JSON array of theme strings

#### Response

**Success (200)**:
```json
{
  "ok": true,
  "slug": "my-song-0",
  "mdx": "---\ntitle: My Song\nkey:\n  root: C\n  mode: major\n---\n# My Song\n\nSong content here.",
  "wroteFile": false,
  "filePath": "src/content/songs/my-song-0.mdx"
}
```

**Error (400/500)**:
```json
{
  "ok": false,
  "error": "Missing required field: title"
}
```

#### Song Schema

The song schema supports complex musical structure:

```typescript
type Song = {
  title: string;
  slug: string;
  key: {
    root: string;        // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
    mode: string;        // major, minor, dorian, phrygian, lydian, mixolydian
  };
  tempo?: number;       // BPM
  timeSignature: {
    top: number;        // Usually 4, 3, 6, etc.
    bottom: number;     // Usually 4, 8, etc.
  };
  chordVoicings: string[];  // Array of chord slugs from search API
  structure?: string[];     // Section order
  sections?: Array<{      // Detailed section information
    name: string;
    chords: string[];
    bars: number;
    repeats?: number;
  }>;
  album?: string;
  chordSheetUrl?: string;
  status?: 'idea' | 'demo' | 'arranged' | 'recorded' | 'released';
  themes?: string[];
};
```

## Interactive Chord Selector Architecture

### Component Structure

The song creation form includes an advanced chord selector with the following features:

#### 1. **Live Search Integration**
- **Debounced Input**: 200ms delay to prevent excessive API calls
- **Real-time Results**: Fetches from `/api/chords/search` as user types
- **Loading States**: Shows "Searching..." during API calls
- **Error Handling**: Displays error messages if search fails

#### 2. **Tag-Based Selection**
- **Visual Tags**: Selected chords display as removable tags
- **Duplicate Prevention**: Prevents adding the same chord twice
- **Remove Functionality**: X button to remove selected chords
- **Accessibility**: Proper ARIA labels and keyboard support

#### 3. **Form Integration**
- **Hidden Input**: Stores chord slugs as JSON for form submission
- **Initial Values**: Supports pre-populating from existing song data
- **Auto-resolution**: Fetches chord details for initial values

### Implementation Details

```typescript
// TypeScript interfaces
interface ChordOption {
  slug: string;
  displayName: string;
  voicingLabel: string;
}

// Debounced search function
async function updateChordDropdown(): Promise<void> {
  const query = chordInput.value.trim();
  
  if (!query) {
    chordDropdown.innerHTML = "";
    chordDropdown.style.display = "none";
    return;
  }

  chordDropdown.innerHTML = '<div class="no-results">Searching...</div>';
  chordDropdown.style.display = "block";

  try {
    const res = await fetch(`/api/chords/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);

    const json = await res.json() as { chords: ChordOption[] };
    const results = json.chords;

    if (results.length === 0) {
      chordDropdown.innerHTML = '<div class="no-results">No chords found</div>';
      return;
    }

    chordDropdown.innerHTML = results
      .map(chord => `
        <div class="chord-option" data-slug="${chord.slug}">
          <div class="chord-name">${chord.displayName}</div>
          <div class="chord-details">${chord.voicingLabel}</div>
        </div>
      `).join("");
  } catch (err) {
    chordDropdown.innerHTML = '<div class="no-results">Error loading chords</div>';
    console.error("Chord search error:", err);
  }
}

// Event handling with debouncing
function handleChordInput(): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateChordDropdown, 200);
}

chordInput.addEventListener("input", handleChordInput);
```

### CSS Styling

The chord selector includes comprehensive styling:

```css
.chord-selector {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chord-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.selected-chord-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #3a300f;
  border: 1px solid #7a6a44;
  border-radius: 16px;
  font-size: 0.85rem;
}
```

## Integration Examples

### Frontend Form Integration

```javascript
// Submit song form with interactive chord selector
async function submitSongForm(formData) {
  const response = await fetch('/api/songs/create', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.ok) {
    console.log('Song created:', result.slug);
    console.log('MDX:', result.mdx);
    console.log('File written:', result.wroteFile);
  } else {
    console.error('Error:', result.error);
  }
}
```

### Astro Component Usage

```astro
---
// SongCreateForm.astro - Interactive song creation with chord search
---

<section class="create">
  <details>
    <summary class="create-header">
      <button class="create-toggle-btn" type="button" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <span class="create-summary-text">Add a new song</span>
    </summary>

    <form id="song-create-form">
      <!-- Basic song fields -->
      <input name="title" placeholder="Song title" required />
      <input name="keyRoot" placeholder="Key (C, G, Am, etc.)" required />
      
      <!-- Interactive chord selector -->
      <div class="chord-selector">
        <input 
          id="chord-input" 
          type="text" 
          placeholder="Type chord name (e.g., am, g, c)"
          autocomplete="off"
        />
        <div id="chord-dropdown" class="chord-dropdown" style="display:none">
          <!-- Populated dynamically by search API -->
        </div>
        <input name="chordVoicings" type="hidden" id="chord-voicings" />
        <div id="selected-chords" class="selected-chords">
          <!-- Selected chord tags rendered here -->
        </div>
      </div>
      
      <!-- Other fields... -->
      <button type="submit">Create Song</button>
    </form>
  </details>
</section>

<script>
  // Interactive chord selector implementation
  // (see full implementation in SongCreateForm.astro)
</script>

<style>
  /* Comprehensive styling for chord selector */
</style>
```

## Security Considerations

1. **File Writing**: Controlled by environment variable to prevent unauthorized file creation
2. **Input Validation**: All form inputs are validated against schema requirements
3. **Search API**: Read-only endpoint with safe query parameter handling
4. **Path Traversal**: File paths are constructed safely using `path.join()`
5. **Content Type**: Only accepts form data submissions (no raw JSON for security)
6. **Debouncing**: Prevents API abuse through rate-limited search requests

## Error Handling

### Common Error Responses

- **400 Bad Request**: Missing required fields or invalid data
- **415 Unsupported Media Type**: Invalid content type
- **500 Internal Server Error**: File system errors or parsing errors

### Error Response Format

```json
{
  "ok": false,
  "error": "Descriptive error message"
}
```

### Search API Errors

- **Network Errors**: Handled gracefully with fallback UI
- **Empty Results**: Displayed as "No chords found"
- **Server Errors**: Displayed as "Error loading chords"

## Development Notes

- **Live Search**: Real-time chord search with 200ms debouncing
- **Interactive UI**: Tag-based selection with visual feedback
- **MDX Generation**: Always generates MDX for preview, regardless of file writing setting
- **Slug Uniqueness**: Checks for existing files to prevent overwrites
- **Content Collections**: Follows Astro content collection schema definitions
- **Frontmatter**: Uses gray-matter for proper frontmatter parsing/stringifying
- **TypeScript**: Full TypeScript support with proper type definitions
- **Accessibility**: ARIA labels and keyboard navigation support

## Performance Optimizations

1. **Debounced Search**: Prevents excessive API calls during typing
2. **Event Delegation**: Efficient event handling for dynamic chord tags
3. **Lazy Loading**: Chord details fetched only when needed
4. **Caching**: Browser caching for search responses
5. **Minimal DOM Updates**: Efficient re-rendering of chord tags

## Setup Instructions

### 1. Environment Setup

Create or update your `.env` file:

```bash
# Enable file writing for forms
ALLOW_CHORD_WRITE=true

# Add other environment variables as needed
NODE_ENV=development
```

### 2. Development Server

Restart your development server after changing environment variables:

```bash
# If using npm
npm run dev

# If using pnpm (recommended)
pnpm dev
```

### 3. File Structure

New content will be created in:
- Chords: `src/content/chords/`
- Songs: `src/content/songs/`
- Blog: `src/content/blog/`

### 4. Content Collection Configuration

Ensure your content collections are configured in `src/content.config.ts`:

```typescript
export const collections = {
  chords: {
    schema: ({ ... }) => z.object({ ... }),
  },
  songs: {
    schema: ({ ... }) => z.object({ ... }),
  },
  blog: {
    schema: ({ ... }) => z.object({ ... }),
  },
};
```

## Security Considerations

- File writing is **disabled by default** to prevent accidental content creation
- Only enable `ALLOW_CHORD_WRITE` in development environments
- Consider adding authentication for production deployments
- Validate all input data before processing
- Sanitize file paths to prevent directory traversal

## Error Handling

Common error responses:

```json
{
  "ok": false,
  "error": "Slug already exists"
}

{
  "ok": false,
  "error": "Invalid chord data"
}

{
  "ok": false,
  "error": "File writing disabled"
}
```

## Integration with Components

### ChordAnalyser Integration

The ChordAnalyser component can prefill the chord creation form:

```javascript
// Event dispatched by ChordAnalyser
document.addEventListener("chord:create", (e) => {
  const { displayName, frets, notes, alternateNames } = e.detail;
  // Form fields are automatically populated
});
```

### Auto-expansion

Forms automatically expand when prefilled from other components:

```javascript
// Auto-expand details if collapsed
const details = form.closest("details");
if (details && !details.open) {
  details.open = true;
}
```

## Future Enhancements

Planned improvements:
- [ ] Authentication and user management
- [ ] Content validation and preview
- [ ] Bulk import/export functionality
- [ ] Content versioning and history
- [ ] Media upload integration
- [ ] SEO optimization for generated content
- [ ] Content scheduling and publishing workflow
