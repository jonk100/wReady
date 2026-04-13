# Review Creation Implementation and Hiccups

## Overview

This document documents the complete implementation of the review creation system with automatic TMDB enrichment and actor creation, along with the problems encountered and their solutions.

## Implementation Goals

The primary goal was to create a streamlined review creation workflow that:

1. Allows users to create reviews with optional TMDB enrichment
2. Automatically enriches reviews with TMDB data (posters, cast, writers, directors, production companies, channel, ratings)
3. Automatically fetches IMDb data (ID and rating) via OMDb integration
4. Automatically creates and enriches actor files when cast members are selected from TMDB
5. Matches the functionality of the existing `scripts/enrich-tmdb.ts` and `scripts/enrich-actors.ts` scripts
6. Provides a simple form-based interface with auto-fill capabilities
7. Displays comprehensive review data on individual review pages
8. Implements a 7-category scoring system with weighted average calculation for final score

## 7-Category Scoring System

The review system evaluates film and television through a "Script-First" lens, prioritizing narrative integrity and the synergy between different creative departments.

### The Formula
The Final Score is a weighted average calculated as follows:
**Final Score = (W × 0.20) + (C × 0.20) + (P × 0.15) + (Pa × 0.15) + (Pr × 0.10) + (Ci × 0.10) + (S × 0.10)**

### Categories and Weights

| Category | Weight | Score Multiplier |
| :--- | :--- | :--- |
| **Writing** | 20% | 0.20 |
| **Cohesion** | 20% | 0.20 |
| **Performances** | 15% | 0.15 |
| **Pacing** | 15% | 0.15 |
| **Production** | 10% | 0.10 |
| **Cinematography**| 10% | 0.10 |
| **Sound** | 10% | 0.10 |

**Total: 100%**

### Category Descriptions

#### 1. Writing (Weight: 20%)
The "DNA" of the project. This category assesses the quality of the blueprint before any cameras started rolling.
- **Dialogue:** Is the speech natural to the world? Is it rhythmic, sharp, or intentionally stylized?
- **Narrative Logic:** Does the story make sense within its own rules? Are there glaring plot holes?
- **Character Arcs:** Do the protagonists and antagonists have clear motivations and growth?
- **Theme:** Does the story actually have something to say, or is it just a series of events?

#### 2. Cohesion (Weight: 20%)
The "Synergy" factor. This is the most critical technical score, measuring how well all other departments serve the Writing.
- **Tonal Consistency:** Does the "vibe" remain steady, or are there jarring shifts that don't feel intentional?
- **Departmental Alignment:** Do the music, lighting, and acting feel like they are in the same movie?
- **Intent vs. Execution:** Does the final product feel like the vision established in the script was successfully realized?

#### 3. Performances (Weight: 15%)
The "Human Delivery System." This measures how the actors interpret and elevate the written word.
- **Subtext:** Are the actors conveying emotion through what *isn't* said (eyes, body language)?
- **Ensemble Chemistry:** How do the actors play off one another? Is there "friction" or "flow"?
- **Casting Appropriateness:** Does the actor feel right for the role, or does their presence pull you out of the story?

#### 4. Pacing (Weight: 15%)
The "Rhythm and Economy." This is primarily judged through editing and structural choices.
- **Momentum:** Does the story move at a rate that keeps the audience engaged?
- **Fat-Cutting:** Are there "dead" scenes that could have been removed without losing anything?
- **Structural Balance:** Does the transition between the beginning, middle, and end feel earned and proportional?

#### 5. Production (Weight: 10%)
The "Physical World." This category looks at the "texture" and tangible details of the setting.
- **World-Building:** How lived-in does the environment feel?
- **Set Design & Costumes:** Do the physical surroundings and clothing add depth to the characters and the era?
- **Historical/Cultural Texture:** If it's a period piece or a specific subculture, is the detail accurate and immersive?

#### 6. Cinematography (Weight: 10%)
The "Visual Grammar." This measures the choice of shots and lighting.
- **Composition & Framing:** Is there a deliberate sense of geometry or balance (e.g., symmetry, rule of thirds)?
- **Lighting & Color:** How is light used to direct the eye or signal a change in mood?
- **Camera Movement:** Is the movement motivated by the story, or is it distracting/gratuitous?

#### 7. Sound (Weight: 10%)
The "Auditory Atmosphere." This combines the musical score with technical sound design.
- **The Score:** Does the music emphasize the emotion of the scene without overpowering it?
- **Sound Effects (Foley):** Are the ambient sounds (footsteps, wind, mechanical noises) crisp and immersive?
- **Sonic Space:** How is silence used? Does the "noise" of the movie feel layered and purposeful?

## Architecture

### 5-Layer Architecture Pattern

The implementation follows a 5-layer architecture:

1. **Presentation Layer**: `ReviewCreateForm.astro` - Form UI with TMDB search and cast selection
2. **Action Layer**: `src/actions/index.ts` - `createReview` action for form submission
3. **Service Layer**: `src/services/reviews/ReviewService.ts` - Business logic for review creation and enrichment
4. **Infrastructure Layer**: `src/utils/infra/` - TMDB API, file operations, content reading
5. **Data Layer**: Content collections (`src/content/reviews/`, `src/content/actors/`)

### Key Components

#### 1. ReviewCreateForm.astro
- Form with fields for title, slug, category, pubDate, body
- 7-category scoring system with score inputs (1-10 scale) for: Writing, Cohesion, Performances, Pacing, Production, Cinematography, Sound
- Category-specific text areas for detailed analysis (writingBody, cohesionBody, etc.)
- Overall Assessment text area for high-level evaluation
- Conclusion text area (renamed from "Review Content")
- TMDB search integration for automatic data enrichment with clear/reset button
- Cast search and selection with visual feedback
- Real-time slug generation from title
- Form submission handler that calls Astro Actions

#### 2. Action Layer (src/actions/index.ts)
```typescript
createReview: defineAction({
  accept: 'json',
  input: z.object({
    slug: z.string().min(1, 'Slug is required'),
    title: z.string().min(1, 'Title is required'),
    category: z.enum(['book', 'movie', 'album', 'game', 'restaurant', 'product', 'tv']),
    pubDate: z.string().min(1, 'Pub date is required'),
    cast: z.array(z.string()).optional(),
    tmdbId: z.number().optional(),
    body: z.string().optional(),
    overallAssessment: z.string().optional(),
    writingScore: z.number().min(1).max(10).optional(),
    cohesionScore: z.number().min(1).max(10).optional(),
    performancesScore: z.number().min(1).max(10).optional(),
    pacingScore: z.number().min(1).max(10).optional(),
    productionScore: z.number().min(1).max(10).optional(),
    cinematographyScore: z.number().min(1).max(10).optional(),
    soundScore: z.number().min(1).max(10).optional(),
    writingBody: z.string().optional(),
    cohesionBody: z.string().optional(),
    performancesBody: z.string().optional(),
    pacingBody: z.string().optional(),
    productionBody: z.string().optional(),
    cinematographyBody: z.string().optional(),
    soundBody: z.string().optional(),
  }),
  handler: async (input) => {
    // Delegates to ReviewService.createReview
  },
}),
```

#### 3. ReviewService.ts
Core business logic including:
- `createReview()`: Main review creation method with final score calculation
- `enrichCastMembers()`: Automatic actor enrichment from TMDB IDs
- `findActorByTmdbId()`: Helper to find existing actors by TMDB ID
- Final score calculation using weighted average formula
- Markdown body construction with structured sections

#### 4. Infrastructure Layer
- `src/utils/infra/tmdb.ts`: TMDB API integration, search, fetching, cast retrieval, external IDs
- `src/utils/infra/omdb.ts`: OMDb API integration for IMDb rating fetching
- `src/utils/infra/fileOperator.ts`: File writing operations
- `src/utils/infra/contentReader.ts`: Content collection reading
- `src/utils/infra/download.ts`: Image downloading from TMDB

## Implementation Details

### Automatic TMDB Enrichment

When a `tmdbId` is provided during review creation, the system automatically:

1. Fetches TMDB data for the movie/TV show
2. Downloads the poster image to `public/images/tmdb/`
3. Enriches the review with:
   - `tmdbId`: TMDB ID
   - `tmdbType`: 'movie' or 'tv'
   - `tmdbSlug`: Slugified title using `createSlug()` function
   - `tmdbRating`: TMDB user score (vote_average)
   - `year`: Release year
   - `overview`: Plot summary (truncated to 450 chars)
   - `poster`: Path to downloaded poster image
   - `writers`: Writers/creators (for TV shows)
   - `directors`: Directors (for movies)
   - `productionCompanies`: Production companies
   - `channel`: Network/channel (for TV shows with normalization)

### IMDb Integration

The system automatically fetches IMDb data for movies and TV shows:

1. **External IDs Fetch**: After fetching TMDB data, calls `getExternalIds()` to retrieve the IMDb ID
2. **IMDb Rating Fetch**: Uses the IMDb ID to fetch the user rating from OMDb API
3. **Enrichment**: Adds the following fields if available:
   - `imdbId`: IMDb identifier (e.g., tt1234567)
   - `imdbRating`: IMDb user rating (0-10 scale)

The integration handles graceful failures:
- If IMDb ID is not available, skips rating fetch
- If OMDb returns "N/A" or invalid format, skips rating field
- Logs debug/warn/error messages appropriately
- Does not break review creation if IMDb data is unavailable

### Automatic Cast Enrichment

The system automatically fetches and enriches the top 3 cast members from TMDB:

1. Fetches cast data from TMDB credits endpoint
2. For each cast member:
   - Checks if actor already exists by TMDB ID
   - If not, fetches full actor data from TMDB
   - Downloads profile image to `public/images/tmdb/`
   - Creates actor file with:
     - `name`: Actor name
     - `tmdbId`: TMDB ID
     - `born`: Birth date
     - `from`: Place of birth
     - `heroImage`: Path to profile image
3. Converts TMDB IDs to slugs for the review's `cast` field
4. Adds `castDetailed` field with character information

### User Override

Users can still manually select additional cast members via the form's cast search, which are merged with the automatic top 3 cast members.

### Markdown Body Structure

The review body is constructed with a structured markdown format that includes:

**Structure:**
1. **Title (H1)**: The review title
2. **Overall Assessment (H2)**: High-level evaluation of the work (new field)
3. **Category Sections (H3)**: Individual category analyses with scores in parentheses
   - Writing Analysis (score)
   - Performances Analysis (score)
   - Pacing Analysis (score)
   - Production Analysis (score)
   - Cinematography Analysis (score)
   - Sound Analysis (score)
   - Cohesion Analysis (score)
4. **Conclusion (H2)**: Final thoughts and overall verdict (renamed from "Overall Analysis")

**Category Order:**
The category sections are ordered as: writing, performances, pacing, production, cinematography, sound, cohesion.

**Implementation:**
```typescript
let combinedBody = '';

// Add title section
combinedBody += `# ${params.title}\n\n`;

// Add Overall Assessment section (H2)
if (params.overallAssessment) {
  combinedBody += `## Overall Assessment\n\n${params.overallAssessment}\n\n`;
}

// Define category order
const categoryOrder = ['writing', 'performances', 'pacing', 'production', 'cinematography', 'sound', 'cohesion'];

// Add category sections if score is provided (use H3 for categories)
for (const key of categoryOrder) {
  const name = categoryNames[key as keyof typeof categoryNames];
  const score = categoryScores[key as keyof typeof categoryScores];
  const bodyText = categoryBodies[key as keyof typeof categoryBodies];

  if (score !== undefined) {
    combinedBody += `### ${name} Analysis (${score})\n\n`;
    // Always write something under the heading to prevent remark from dropping headings
    combinedBody += bodyText ? `${bodyText}\n\n` : `<!-- ${name} notes pending -->\n\n`;
  }
}

// Add Conclusion section (H2, was Overall Analysis)
if (params.body) {
  combinedBody += `## Conclusion\n\n${params.body}`;
}
```

### Final Score Calculation

The final score is calculated using a weighted average formula:

```typescript
const categoryScores = {
  writing: params.writingScore,
  cohesion: params.cohesionScore,
  performances: params.performancesScore,
  pacing: params.pacingScore,
  production: params.productionScore,
  cinematography: params.cinematographyScore,
  sound: params.soundScore,
};

const categoryWeights = {
  writing: 0.20,
  cohesion: 0.20,
  performances: 0.15,
  pacing: 0.15,
  production: 0.10,
  cinematography: 0.10,
  sound: 0.10,
};

let totalScore = 0;
let totalWeight = 0;

for (const [key, score] of Object.entries(categoryScores)) {
  if (score !== undefined) {
    const weight = categoryWeights[key as keyof typeof categoryWeights];
    totalScore += score * weight;
    totalWeight += weight;
  }
}

const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 0;
enrichedData.finalScore = finalScore;
```

### Form Auto-Fill Enhancements

The TMDB search results now return comprehensive enrichment data for automatic form population:

**Enhanced searchTMDBResults()** returns:
- IMDb ID and rating (fetched from TMDB external IDs and OMDb)
- Writers and directors
- Production companies
- Channel (for TV shows)
- Top 3 cast members with character information

**Form auto-fill** on TMDB result selection:
- Auto-fills title, slug, and TMDB ID
- Auto-fills IMDb ID and IMDb rating if available
- Auto-fills writers, directors, production companies, channel
- Auto-adds cast members to selected cast with character info
- Only fills fields that are currently empty to preserve user input

## Problems Encountered and Solutions

### Problem 1: Category Field Missing from Frontmatter

**Issue**: Schema validation errors occurred because the `category` field was not being included in the enriched review data.

**Error**:
```
[InvalidContentEntryDataError] reviews → test-dtf-final data does not match collection schema.
Invalid option: expected one of "book"|"movie"|"album"|"game"|"restaurant"|"product"|"tv"
```

**Solution**: Explicitly added `category` to the enriched data object in `ReviewService.createReview()`:

```typescript
let enrichedData: any = { ...data, category };
```

### Problem 2: Missing TMDB Enrichment Fields

**Issue**: The implementation was missing several TMDB enrichment fields that the original `scripts/enrich-tmdb.ts` script provided (writers, directors, production companies, channel).

**Solution**: Added comprehensive TMDB field enrichment matching the original script:

```typescript
// Add writers if available
if (tmdbData.created_by && tmdbData.created_by.length > 0) {
  enrichedData.writers = tmdbData.created_by.map((w: any) => w.name);
}

// Add directors if available (for movies)
if (category === 'movie' && tmdbData.credits?.crew) {
  const directors = tmdbData.credits.crew
    .filter((c: any) => c.job === 'Director')
    .map((d: any) => d.name);
  if (directors.length > 0) {
    enrichedData.directors = directors;
  }
}

// Add production companies if available
if (tmdbData.production_companies && tmdbData.production_companies.length > 0) {
  enrichedData.productionCompanies = tmdbData.production_companies.map((pc: any) => pc.name);
}

// Add channel for TV shows with normalization
if (category === 'tv' && tmdbData.networks && tmdbData.networks.length > 0) {
  enrichedData.channel = normalizeChannel(tmdbData.networks[0].name);
}
```

### Problem 3: Duplicate Body Field in Frontmatter

**Issue**: The `body` field was appearing in both the frontmatter and the content body, causing redundancy.

**Solution**: Removed `body` from the enriched data object before writing:

```typescript
// Strip undefined values and remove duplicate body field
const { body, ...dataWithoutBody } = enrichedData;
const cleanData = Object.fromEntries(
  Object.entries(dataWithoutBody).filter(([, value]) => value !== undefined)
);

// Write with body separately
await writeContentFile({
  collection: 'reviews',
  slug,
  data: cleanData,
  body: params.body || '',
});
```

### Problem 4: Actor Enrichment Using Slugs Instead of TMDB IDs

**Issue**: The actor enrichment logic was trying to fetch TMDB data using actor slugs instead of TMDB IDs, causing failures.

**Error**:
```
[ReviewService] Failed to fetch TMDB data for actor jason-bateman
```

**Solution**: Added logic to distinguish between TMDB IDs (numeric) and slugs (non-numeric):

```typescript
async enrichCastMembers(castIds: string[]): Promise<string[]> {
  for (const castId of castIds) {
    // Check if this is a slug (non-numeric) or TMDB ID (numeric)
    const isTmdbId = /^\d+$/.test(castId);
    
    if (!isTmdbId) {
      // It's already a slug, just use it directly
      castSlugs.push(castId);
      continue;
    }
    
    // It's a TMDB ID, proceed with enrichment
    // ...
  }
}
```

### Problem 5: Incorrect tmdbSlug Format

**Issue**: The `tmdbSlug` field was using the raw title instead of a slugified version, not matching the `scripts/enrich-tmdb.ts` behavior.

**Solution**: Implemented the `createSlug()` function matching the original script:

```typescript
function createSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

And used it in the enrichment logic:

```typescript
const slug = createSlug(tmdbData.title || tmdbData.name || '');
enrichedData.tmdbSlug = slug;
```

### Problem 6: Using heroImage Instead of poster

**Issue**: The implementation was using `heroImage` field instead of `poster` field, not matching the `scripts/enrich-tmdb.ts` convention.

**Solution**: Changed to use `poster` field with the proper naming pattern:

```typescript
const filename = `${slug}-${tmdbData.id}.jpg`;
const localPath = await downloadImage(posterUrl, filename);
if (localPath) {
  enrichedData.poster = localPath;
}
```

### Problem 7: Missing castDetailed Field

**Issue**: The implementation was missing the `castDetailed` field with character information that the original script provided.

**Solution**: Added `castDetailed` field with character information:

```typescript
let castDetailed: any[] = [];

for (const castMember of topCast) {
  // Add to castDetailed
  castDetailed.push({
    id: castMember.id,
    name: castMember.name,
    character: castMember.character
  });
}

// Add castDetailed field if we have cast data
if (castDetailed.length > 0) {
  enrichedData.castDetailed = castDetailed;
}
```

### Problem 8: TypeScript Errors in ReviewCreateForm.astro

**Issue**: TypeScript errors occurred in the form component:
- `Expected 0 arguments, but got 1.` for `trim('-')`
- `Property 'removeCastMember' does not exist on type 'Window & typeof globalThis'`

**Solution**: 
1. Changed `trim('-')` to `replace(/^-|-$/g, '')` for slug cleaning
2. Used `(window as any).removeCastMember` to bypass TypeScript type checking

### Problem 9: ImageNotFound Errors on Review Pages

**Issue**: Review pages showed ImageNotFound errors for old reviews using `heroImage` field instead of `poster`.

**Error**:
```
[ImageNotFound] Could not find requested image `/images/tmdb/dtf-st-louis-poster.jpg`.
```

**Solution**: Added backwards compatibility in `src/pages/reviews/[slug].astro` to support both fields:

```astro
{(data.poster || data.heroImage) && (
  <div class="review-poster">
    <img
      src={(data.poster || data.heroImage) as string}
      alt={`${data.title} poster`}
      loading="lazy"
    />
  </div>
)}
```

### Problem 10: Missing fetchCast Utility

**Issue**: The `fetchCast` function was only available in the scripts directory, not in the infrastructure layer.

**Solution**: Moved and added the `fetchCast` function to `src/utils/infra/tmdb.ts`:

```typescript
export async function fetchCast(
  id: number,
  type: TMDBMediaType,
  apiKey: string
): Promise<TMDBCastMember[]> {
  const url = `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${apiKey}`;
  // ... implementation
}
```

### Review Slug Page Display Enhancements

The individual review page (`src/pages/reviews/[slug].astro`) was enhanced to display all available enrichment data:

**New sections added:**
- **Overview**: Plot summary from TMDB
- **Cast**: Enhanced to show character information from `castDetailed` field
- **Credits**: Displays writers, directors, and production companies
- **Season & Episode Info**: TV-specific metadata (season, episode, episodes)
- **Themes**: Thematic tags with special styling
- **Ratings**: TMDB rating displayed alongside IMDb and Rotten Tomatoes ratings

**IMDb link enhancement:**
- Footer now uses `imdbId` to construct proper IMDb URL (`https://www.imdb.com/title/{imdbId}/`)
- Falls back to `url` field if imdbId not available

**Technical fix:**
- Updated `formatActorName()` function to handle both string slugs and Astro content collection reference objects
- This fixes "slug.split is not a function" errors when cast array contains reference objects

### Schema Changes

**Added fields to reviews collection schema:**
- `tmdbRating`: TMDB user score (number, 0-10 scale, optional)

**Removed validation:**
- TV season requirement refinement removed (season is now optional for TV reviews)

**Rationale:**
- TMDB rating provides additional rating source alongside IMDb and Rotten Tomatoes
- Season requirement was too strict for some TV reviews (e.g., entire series reviews)

### Enrichment Script Updates

The `scripts/enrich-tmdb.ts` script was updated to include all new enrichment fields:

**Added functionality:**
- Fetch external IDs from TMDB to get IMDb ID
- Fetch IMDb rating from OMDb API using IMDb ID
- Include TMDB rating (vote_average)
- Enrich writers, directors, production companies, and channel
- Filter undefined values before writing to avoid YAML serialization errors

**Updated skip condition:**
- Now checks for all new fields (imdbId, imdbRating, tmdbRating) to determine if a review is fully enriched
- Only processes reviews missing any of the new data

**Usage:**
```bash
pnpm tsx scripts/enrich-tmdb.ts
```

This allows existing reviews created before the IMDb integration to be enriched with the new data.

### Problem 11: TV Season Requirement Too Strict

**Issue**: The schema validation required a `season` field for all TV reviews, which was too strict for entire series reviews.

**Error**:
```
[InvalidContentEntryDataError] reviews → severance data does not match collection schema.
"TV reviews require a season"
```

**Solution**: Removed the TV season requirement refinement from the schema, making season optional for TV reviews:

```typescript
// Removed this refinement:
.refine((d) => d.category !== "tv" || d.season !== undefined, {
  message: "TV reviews require a season",
  path: ["season"],
})
```

### Problem 12: formatActorName Not Handling Reference Objects

**Issue**: The `formatActorName()` function expected string slugs but received Astro content collection reference objects, causing "slug.split is not a function" errors.

**Error**:
```
[ERROR] slug.split is not a function
at formatActorName (/home/jk/dev/Writty/src/pages/reviews/[slug].astro:45:6)
```

**Solution**: Updated the function to handle both string slugs and reference objects:

```typescript
function formatActorName(slugOrRef: string | { id: string }): string {
  const slug = typeof slugOrRef === 'string' ? slugOrRef : slugOrRef.id;
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
```

### Problem 13: YAML Serialization Error with Undefined Values

**Issue**: The enrichment script crashed when trying to serialize undefined values to YAML.

**Error**:
```
YAMLException: unacceptable kind of an object to dump [object Undefined]
```

**Solution**: Added filtering of undefined values before writing the file:

```typescript
// Filter out undefined values to avoid YAML serialization errors
const cleaned = Object.fromEntries(
  Object.entries(updated).filter(([, value]) => value !== undefined)
);

await fs.writeFile(file, matter.stringify(parsed.content, cleaned));
```

### Problem 14: Category Body Fields Missing from Action Schema

**Issue**: Category body text (writingBody, cohesionBody, etc.) was not being passed from the form to the service because the fields were missing from the action input schema.

**Symptom**: Users filled in category body text areas, but the content appeared empty in generated `.mdx` files.

**Solution**: Added category body fields to the `createReview` action input schema:

```typescript
input: z.object({
  // ... other fields
  writingBody: z.string().optional(),
  cohesionBody: z.string().optional(),
  performancesBody: z.string().optional(),
  pacingBody: z.string().optional(),
  productionBody: z.string().optional(),
  cinematographyBody: z.string().optional(),
  soundBody: z.string().optional(),
  overallAssessment: z.string().optional(),
}),
```

### Problem 15: MDX Headers Not Rendering on Slug Page

**Issue**: Markdown headers (H1, H2, H3) were not being displayed on the review slug page, even though they were present in the `.mdx` file.

**Symptom**: The page only showed plain text without any heading styling.

**Root Cause**: The `remarkScreenplay` plugin was processing all MDX files, including reviews, and interfering with markdown rendering.

**Solution**: Modified the `remarkScreenplay` plugin to skip processing for non-scene files:

```typescript
export const remarkScreenplay: Plugin<[], Root> = () => {
  return (tree, file) => {
    // Skip processing entirely for non-scene files
    if (!isSceneFilePath(String((file as any)?.path ?? ""))) {
      return;
    }

    const newChildren: any[] = [];
    const implicitEnabled = true;
    // ... rest of the plugin logic
  };
};
```

The `isSceneFilePath` function checks if the file path includes `/src/content/scenes/` to determine if the plugin should process the file.

### Problem 16: CSS Spacing Conflicts with Global Styles

**Issue**: Custom spacing styles for review content headings and paragraphs were not being applied due to conflicts with global CSS in `global.css`.

**Root Cause**: The `global.css` file has global heading styles with lower specificity that were overriding the page-specific styles:

```css
h1, h2, h3, h4, h5, h6 {
  margin: 0 0 0.5em;
  line-height: 1.2;
  font-weight: 700;
  color: var(--text-primary);
}
```

**Solution**: Added a global style tag with `is:global` attribute to override the global styles:

```astro
<style is:global>
  .content-body h1,
  .content-body h2,
  .content-body h3,
  .content-body h4,
  .content-body h5,
  .content-body h6 {
    margin: 2rem 0 0.25rem 0 !important;
  }

  .content-body h2 {
    font-size: 1.5rem;
  }

  .content-body h3 {
    font-size: 1.25rem;
  }

  .content-body p {
    margin: 0 0 2rem 0 !important;
  }
</style>
```

This provides:
- Less space between heading and associated content (0.25rem bottom margin)
- More space between content and next heading (2rem bottom margin on paragraphs)
- Smaller H2 (1.5rem) and H3 (1.25rem) font sizes

### Problem 17: Gray-Matter Collapsing Newlines in Body

**Issue**: Using `matter.stringify(body, data)` was collapsing consecutive blank lines in the body string, causing remark/MDX to silently drop headings that weren't preceded by a blank line.

**Root Cause**: Gray-matter's stringification process normalizes whitespace, which removes the double newlines needed to separate markdown headings from content.

**Solution**: Modified `src/utils/infra/fileOperator.ts` to serialize frontmatter only via gray-matter and concatenate the body verbatim:

```typescript
// Serialize the frontmatter block only (pass empty string as body so
// gray-matter gives us just the YAML wrapped in --- fences), then strip
// the fences back off so we can rebuild the file ourselves.
const yamlOnly = matter.stringify('', data)
  .trim()
  .replace(/^---\n/, '')  // remove opening fence
  .replace(/\n---$/, ''); // remove closing fence

// Re-assemble the file with a blank line between the closing --- and the
// body. This ensures the body is appended verbatim: all blank lines
// (double newlines) that separate headings and paragraphs are kept intact.
const fileContent = `---\n${yamlOnly}\n---\n${body ? '\n' + body : ''}`;
```

This preserves all newlines exactly as written, ensuring markdown headings render correctly.

### Problem 18: TypeScript Errors After Component Refactoring

**Issue**: After refactoring `ReviewCreateForm.astro` into smaller components (`TmdbSearch.astro`, `CastSelector.astro`, `ScoreField.astro`), several TypeScript errors occurred.

**Errors**:
1. `category` field type incompatibility: Type 'string' is not assignable to type '"movie" | "tv" | "album" | "book" | "game" | "restaurant" | "product"'
2. `subtitle` and other string fields: Type 'FormDataEntryValue | undefined' is not assignable to type 'string | undefined'. Type 'File' is not assignable to type 'string'.
3. `trim('-')` in ActorCreateForm.astro: Expected 0 arguments, but got 1.

**Root Causes**:
- FormData can return `File` objects, but the action schema expected `string | undefined`
- TypeScript inferred `category` as a generic `string` instead of the specific union literal type
- JavaScript's `trim()` method doesn't accept arguments - it only removes whitespace

**Solutions**:

1. **Category validation**: Added runtime validation to ensure the category is one of the valid enum values before passing to the action:

```typescript
// Validate category is one of the allowed values
const validCategories = ['movie', 'tv', 'album', 'book', 'game', 'restaurant', 'product'] as const;
const category = rawData.category as string;
const validatedCategory = validCategories.includes(category as any)
  ? (category as 'movie' | 'tv' | 'album' | 'book' | 'game' | 'restaurant' | 'product')
  : 'movie'; // fallback to movie if invalid

const payload = {
  category: validatedCategory,
  // ...
};
```

2. **String field type guards**: Added type guards to ensure FormData values are strings before including them in the payload:

```typescript
subtitle:             typeof rawData.subtitle === 'string' ? rawData.subtitle : undefined,
url:                  (typeof rawData.url === 'string' && rawData.url.trim()) ? rawData.url : undefined,
imdbId:               typeof rawData.imdbId === 'string' ? rawData.imdbId : undefined,
rottenTomatoesId:     typeof rawData.rottenTomatoesId === 'string' ? rawData.rottenTomatoesId : undefined,
channel:              typeof rawData.channel === 'string' ? rawData.channel : undefined,
overallAssessment:    typeof rawData.overallAssessment === 'string' ? rawData.overallAssessment : undefined,
body:                 typeof rawData.body === 'string' ? rawData.body : undefined,

writingBody:          typeof rawData.writingBody === 'string' ? rawData.writingBody : undefined,
cohesionBody:         typeof rawData.cohesionBody === 'string' ? rawData.cohesionBody : undefined,
performancesBody:     typeof rawData.performancesBody === 'string' ? rawData.performancesBody : undefined,
pacingBody:           typeof rawData.pacingBody === 'string' ? rawData.pacingBody : undefined,
productionBody:       typeof rawData.productionBody === 'string' ? rawData.productionBody : undefined,
cinematographyBody:   typeof rawData.cinematographyBody === 'string' ? rawData.cinematographyBody : undefined,
soundBody:            typeof rawData.soundBody === 'string' ? rawData.soundBody : undefined,
```

3. **URL field handling**: The action schema has `z.string().url().optional()` which requires a valid URL if a string is provided. Empty strings fail this validation. Added check to only include non-empty URLs:

```typescript
url: (typeof rawData.url === 'string' && rawData.url.trim()) ? rawData.url : undefined,
```

4. **Slug cleaning fix**: Changed `trim('-')` to `replace(/^-|-$/g, '')` in ActorCreateForm.astro:

```typescript
const slug = name.toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, ''); // was .trim('-')
```

5. **Cast tag simplification**: Removed character name display from cast tags in `CastSelector.astro` per user request:

```typescript
// Before:
${m.name}
${m.character ? `<span class="cast-character">${m.character}</span>` : ''}

// After:
${m.name}
```

6. **Debug logging**: Added console logging to trace FormData and payload during submission for easier debugging:

```typescript
console.log('[ReviewCreateForm] Raw FormData:', rawData);
console.log('[ReviewCreateForm] Submitting payload:', payload);
```

### Problem 19: 400 POST Error After Refactoring

**Issue**: After the component refactoring, form submissions returned a 400 error from the `createReview` action.

**Root Cause**: The `url` field validation (`z.string().url().optional()`) was failing because empty strings were being sent. Zod's `.url()` validation requires a valid URL if a string is provided, even if the field is marked as optional.

**Solution**: Added a check to ensure the URL is non-empty before including it in the payload (see solution 3 above).

## Key Learnings

1. **Match Existing Patterns**: When replacing script-based workflows with backend services, ensure all fields and behaviors match exactly to avoid validation errors.

2. **Type Safety vs. Flexibility**: Sometimes type assertions (`as any`) are necessary when working with dynamic TMDB data, but should be used sparingly and documented.

3. **Backwards Compatibility**: When changing field names (e.g., `heroImage` to `poster`), maintain backwards compatibility in display components to avoid breaking existing content.

4. **Slug Generation**: Use consistent slug generation functions across the application to ensure uniform slug formats.

5. **Error Handling**: Implement proper error handling for external API calls (TMDB) to prevent cascading failures.

6. **Field Validation**: Always include all required schema fields, even if they seem optional, to prevent validation errors.

7. **Schema Consistency**: When adding new form fields, ensure they are added to all layers: form UI, action input schema, service function signature, and data handling logic.

8. **Plugin Scope**: Remark/MDX plugins should check file paths to avoid processing files they're not designed for (e.g., screenplay plugins should only process scene files).

9. **CSS Specificity**: Global CSS styles can override page-specific styles. Use `is:global` attribute or higher specificity to ensure custom styles take precedence.

10. **Newline Preservation**: When writing markdown files, preserve exact newline spacing by avoiding gray-matter's stringification for the body content. Concatenate frontmatter and body separately to maintain markdown structure.

11. **FormData Type Safety**: FormData values can be `File` objects or strings. Always use type guards (`typeof val === 'string'`) when extracting FormData values to ensure type safety before passing to actions.

12. **Zod Optional Validation**: Zod's `.optional()` modifier makes a field optional, but if a value is provided, it must still pass the validation (e.g., `.url()` requires a valid URL even if optional). Check for empty strings before including optional validated fields.

13. **Runtime Type Validation**: When TypeScript can't infer literal union types from FormData, add runtime validation to ensure values match expected enums before sending to actions.

## Final Implementation Status

The review creation system now:

✅ Creates reviews with full TMDB enrichment (posters, cast, writers, directors, production companies, channel, ratings)
✅ Automatically fetches IMDb data (ID and rating) via OMDb integration
✅ Includes TMDB user rating (vote_average) in enrichment
✅ Automatically enriches top 3 cast members with character information
✅ Downloads posters and profile images
✅ Uses correct field names matching `scripts/enrich-tmdb.ts`
✅ Supports both manual and automatic cast selection
✅ Form auto-fills with comprehensive enrichment data on TMDB selection
✅ Maintains backwards compatibility with existing content
✅ Provides a clean form-based interface for users
✅ Displays comprehensive review data on individual review pages (overview, cast with characters, credits, TV info, themes, ratings)
✅ IMDb link constructed from imdbId for proper navigation
✅ Enrichment script updated to handle all new fields for existing reviews
✅ Schema updated to include tmdbRating field
✅ TV season requirement relaxed to support entire series reviews
✅ Implements 7-category scoring system with weighted average calculation for final score
✅ Category scores stored in frontmatter (writingScore, cohesionScore, performancesScore, pacingScore, productionScore, cinematographyScore, soundScore)
✅ Final score calculated and stored in frontmatter
✅ Category-specific text areas for detailed analysis (writingBody, cohesionBody, etc.)
✅ Overall Assessment text area for high-level evaluation
✅ Markdown body structured with H2 for Overall Assessment and Conclusion, H3 for category sections
✅ Category sections ordered: writing, performances, pacing, production, cinematography, sound, cohesion
✅ remarkScreenplay plugin modified to skip non-scene files, fixing MDX header rendering
✅ CSS spacing fixed using global style tag to override global.css conflicts
✅ File writing improved to preserve newlines in markdown body
✅ Comment placeholders added when category body text is empty to prevent remark from dropping headings

The implementation successfully replicates the functionality of the original enrichment scripts while providing a more user-friendly, integrated experience with enhanced data display, IMDb integration, and a comprehensive 7-category scoring system for film and TV reviews.
