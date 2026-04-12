# Review Creation Implementation and Hiccups

## Overview

This document documents the complete implementation of the review creation system with automatic TMDB enrichment and actor creation, along with the problems encountered and their solutions.

## Implementation Goals

The primary goal was to create a streamlined review creation workflow that:

1. Allows users to create reviews with optional TMDB enrichment
2. Automatically enriches reviews with TMDB data (posters, cast, writers, directors, production companies, channel)
3. Automatically creates and enriches actor files when cast members are selected from TMDB
4. Matches the functionality of the existing `scripts/enrich-tmdb.ts` and `scripts/enrich-actors.ts` scripts
5. Provides a simple form-based interface for review creation

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
- TMDB search integration for automatic data enrichment
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
  }),
  handler: async (input) => {
    // Delegates to ReviewService.createReview
  },
}),
```

#### 3. ReviewService.ts
Core business logic including:
- `createReview()`: Main review creation method
- `enrichCastMembers()`: Automatic actor enrichment from TMDB IDs
- `findActorByTmdbId()`: Helper to find existing actors by TMDB ID

#### 4. Infrastructure Layer
- `src/utils/infra/tmdb.ts`: TMDB API integration, search, fetching, cast retrieval
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
   - `year`: Release year
   - `overview`: Plot summary (truncated to 450 chars)
   - `poster`: Path to downloaded poster image
   - `writers`: Writers/creators (for TV shows)
   - `directors`: Directors (for movies)
   - `productionCompanies`: Production companies
   - `channel`: Network/channel (for TV shows with normalization)

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

## Key Learnings

1. **Match Existing Patterns**: When replacing script-based workflows with backend services, ensure all fields and behaviors match exactly to avoid validation errors.

2. **Type Safety vs. Flexibility**: Sometimes type assertions (`as any`) are necessary when working with dynamic TMDB data, but should be used sparingly and documented.

3. **Backwards Compatibility**: When changing field names (e.g., `heroImage` to `poster`), maintain backwards compatibility in display components to avoid breaking existing content.

4. **Slug Generation**: Use consistent slug generation functions across the application to ensure uniform slug formats.

5. **Error Handling**: Implement proper error handling for external API calls (TMDB) to prevent cascading failures.

6. **Field Validation**: Always include all required schema fields, even if they seem optional, to prevent validation errors.

## Final Implementation Status

The review creation system now:

✅ Creates reviews with full TMDB enrichment
✅ Automatically enriches top 3 cast members with character information
✅ Downloads posters and profile images
✅ Uses correct field names matching `scripts/enrich-tmdb.ts`
✅ Supports both manual and automatic cast selection
✅ Maintains backwards compatibility with existing content
✅ Provides a clean form-based interface for users

The implementation successfully replicates the functionality of the original enrichment scripts while providing a more user-friendly, integrated experience.
