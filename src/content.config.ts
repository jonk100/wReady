import { defineCollection, reference, type SchemaContext } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Refer to ./content.config.md for architectural overview.
 * Slugs support nested directories (e.g., "project-name/file-name").
 *
 * All collections use the Astro 5+ `glob()` loader API.
 * The `base` path is relative to the project root.
 *
 * NOTE ON IDs: With the glob() loader, `entry.id` is the file path
 * relative to `base`, without the extension — e.g. "patriot" or
 * "subdir/file-name". Use `entry.id` (not `entry.slug`) in hrefs.
 */

const nonEmptyString = z.string().min(1);
const optionalString = z.string().optional();
const positiveInt = z.number().int().positive();

// ---------------------------------------------------------------------------
// TOP-LEVEL CONTAINERS
// ---------------------------------------------------------------------------

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    type: z.enum(["screenplay-series", "standalone-film", "book"]),
    logline: z.string().optional(),
    synopsis: z.string().optional(),
    genres: z.array(z.string()).default([]),
    themes: z.array(reference("themes")).default([]),
    status: z
      .enum(["development", "in-progress", "first-draft", "revised", "complete"])
      .default("development"),
    episodeCount: z.number().int().positive().optional(),
    startedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
});

const albums = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/albums" }),
  schema: z.object({
    title: z.string(),
    year: z.number().int().optional(),
    keyRoot: z.string().optional(),
    keyMode: z.enum(["major", "minor"]).optional(),
    themes: z.array(reference("themes")).default([]),
    status: z
      .enum(["demo", "recording", "mixing", "mastered", "released"])
      .default("demo"),
  }),
});

const sets = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/sets" }),
  schema: z.object({
    title: z.string(),
    contentTypes: z.array(z.enum(["poems", "short-stories", "dreams"])).default([]),
    themes: z.array(reference("themes")).default([]),
    status: z.enum(["draft", "complete", "published"]).default("draft"),
  }),
});

const postSeries = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/post-series" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    /**
     * Controls how posts in this series are sorted in listings.
     * - "date"     → chronological (reviews, essays)
     * - "position" → manual ordering (course modules, structured series)
     */
    sortBy: z.enum(["date", "position"]).default("date"),
  }),
});

// ---------------------------------------------------------------------------
// GLOBAL SHARED ENTITIES
// ---------------------------------------------------------------------------

const themes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/themes" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

/**
 * `chords` — a reference library of specific chord voicings with
 * guitar fingering data.
 *
 * Each record is a specific voicing, not just a chord name.
 * Slug convention: "{chord-name}-{root-string-number}"
 *
 * The number suffix encodes the root note's string position:
 *   0 = open voicing (no barre)
 *   1 = root on string 1 / low E (E-shape barre)
 *   2 = root on string 2 / A string (A-shape barre)
 *   3 = root on string 3 / D string (D-shape barre)
 *
 * Example slugs: "am7-0", "am7-1", "am7-2"
 * Example file:  src/content/chords/am7-1.mdx
 */
const chords = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/chords" }),
  schema: z.object({
    displayName: z.string(),
    voicingLabel: z.string(),
    // z.coerce ensures strings like "-1" become numbers
    baseFret: z.coerce.number().default(1),
    fingering: z.array(z.coerce.number()),
    frets: z.array(z.coerce.number()),
    
    // Barre must have exactly 2 string indices (start and end)
    barre: z.object({
      finger: z.coerce.number(),
      fret: z.coerce.number(),
      strings: z.tuple([z.coerce.number(), z.coerce.number()]),
    }).optional(),

    notes: z.array(z.coerce.string()).optional(), // Coerce to string to handle unquoted YAML
    alternateNames: z.array(z.string()).optional(),
    enharmonic: z.string().optional(),
  }),
});

/**
 * `actors` — people who appear in reviewed films and TV series.
 *
 * Created automatically by enrich-actors.ts from cast data written
 * by enrich-tmdb.ts. Reviews reference actor slugs via their `cast` field.
 *
 * Slug convention: "{actor-name}" e.g. "elliott-gould"
 * Example file:   src/content/actors/elliott-gould.mdx
 */
const actors = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/actors" }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      /** Full name as it appears in TMDB */
      name: z.string(),

      /** TMDB person ID — used for API lookups and deduplication */
      tmdbId: z.number().int().positive(),

      /** Date of birth in ISO format e.g. "1938-08-29" */
      born: z.string().nullable().optional(),

      /** Place of birth e.g. "New York City, New York, USA" */
      from: z.string().nullable().optional(),

      /**
       * Local path to the downloaded TMDB profile image.
       * Populated by enrich-actors.ts.
       * Uses Astro's image() helper for optimisation.
       */
      heroImage: z.string().startsWith("/images/").nullable().optional(),
    }),
});

// ---------------------------------------------------------------------------
// PROJECT-SCOPED ENTITIES
// ---------------------------------------------------------------------------

const characters = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/characters" }),
  schema: z.object({
    name: z.string(),
    project: reference("projects"),
    role: z.string().optional(),
    arc: z.string().optional(),
    themes: z.array(reference("themes")).default([]),
    dialogue_name: z.union([z.string(), z.array(z.string())]).optional(),
    character_type: z.enum(["historical_figure", "fictional", "composite"]).optional(),
    age: z.object({
      act_1: z.number().optional(),
      act_2: z.number().optional(),
      act_3: z.number().optional(),
    }).optional(),
    occupation: z.string().optional(),
    description: z.string().optional(),
    first_appearance: reference("scenes").optional(),
    last_appearance: reference("scenes").optional(),
    created: z.date().optional(),
    updated: z.date().optional(),
  }),
});

const locations = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/locations" }),
  schema: z.object({
    name: z.string(),
    project: reference("projects"),
    intOrExt: z.enum(["INT", "EXT", "INT/EXT"]).optional(),
    realWorldRef: z.string().optional(),
    type: z.enum(["interior", "exterior", "misc"]).optional(),
    description: z.string().optional(),
    mood: z.string().optional(),
    visual_notes: z.string().optional(),
    practical_notes: z.string().optional(),
    scenes_used: z.array(reference("scenes")).default([]),
    reference_images: z.array(z.string()).default([]),
    created: z.date().optional(),
  }),
});

const plots = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/plots" }),
  schema: z.object({
    title: z.string(),
    project: reference("projects"),
    plotType: z.enum(["main", "sub"]).default("main"),
    plotLevel: z.enum(["A", "B", "C", "D"]).default("A"),
    parentPlot: reference("plots").optional(),
    summary: z.string().optional(),
    themes: z.array(reference("themes")).default([]),
  }),
});

// ---------------------------------------------------------------------------
// SCREENPLAY HIERARCHY
// ---------------------------------------------------------------------------

const episodes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/episodes" }),
  schema: z.object({
    title: z.string(),
    project: reference("projects"),
    episodeNumber: z.number().int().positive(),
    logline: z.string().optional(),
    status: z
      .enum(["outline", "first-draft", "revised", "locked"])
      .default("outline"),
    themes: z.array(reference("themes")).default([]),

    /**
     * Episode-level plot prioritization.
     * These fields allow episodes to declare which plots are dominant,
     * active, or anchoring tension without hardcoding A/B/C enums.
     * All fields reference actual plot entries for flexibility.
     */
    /** Which plot provides the primary agency and visible tension this episode */
    dominantDriver: reference("plots").optional(),
    
    /** Which plots have scenes/progression this episode (3–4 recommended) */
    activePlots: z.array(reference("plots")).default([]),
    
    /** Which plot's emotional stakes will peak this episode */
    tensionAnchor: reference("plots").optional(),
  }),
});

const sequences = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/sequences" }),
  schema: z.object({
    title: z.string(),
    project: reference("projects"),
    episode: reference("episodes").optional(),
    sequenceNumber: z.number().int().positive(),
    description: z.string().optional(),
  }),
});

const scenes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/scenes" }),
  schema: z.object({
    title: z.string().default("Untitled"),
    heading: z.string(),
    project: reference("projects"),
    episode: reference("episodes").optional(),
    sequence: reference("sequences").optional(),
    sceneNumber: z.number().int().positive(),
    intOrExt: z.enum(["INT", "EXT", "INT/EXT"]),
    location: z.array(reference("locations")).default([]),
    timeOfDay: z
      .enum(["DAY", "NIGHT", "DAWN", "DUSK", "CONTINUOUS", "LATER", "MOMENTS LATER"])
      .default("DAY"),
    characters: z.array(reference("characters")).default([]),
    plots: z.array(reference("plots")).default([]),
    themes: z.array(reference("themes")).default([]),
    synopsis: z.string().optional(),
    pageCount: z.number().positive().optional(),
    status: z
      .enum(["outline", "first-draft", "revised", "locked"])
      .default("outline"),
  }),
});

// ---------------------------------------------------------------------------
// SHARED: BEATS (screenplays + books)
// ---------------------------------------------------------------------------

const beats = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/beats" }),
  schema: z.object({
    project: reference("projects"),

    scene: reference("scenes").optional(),
    chapter: reference("chapters").optional(),

    /** What character is trying to achieve in THIS beat */
    objective: z.string().optional(),

    /** The tactic used (verb-driven: persuade, deflect, threaten) */
    action: z.string().optional(),

    /** What changes as a result */
    outcome: z.string().optional(),

    /** Who is driving this beat (character forcing change) */
    owner: z.array(reference("characters")).default([]),

    /** One-line dramatic summary */
    summary: z.string(),

    /** Plot-specific connections */
    plots: z.array(z.object({
      plot: reference("plots"),
      tension: z.number().int().min(1).max(10),
      beatType: z.enum([
        "setup",
        "turn",
        "payoff",
        "revelation",
        "decision",
        "advancement",
        "escalation",
        "evolution"
      ]),
      beatNumber: z.number().int().positive().optional(),
    })),

    /** Optional global classification */
    beatType: z.enum([
      "setup",
      "turn",
      "payoff",
      "revelation",
      "decision",
      "advancement",
      "escalation",
      "evolution"
    ]).optional(),

    tension: z.number().int().min(1).max(10).optional(),

    themes: z.array(reference("themes")).default([]),
  }),
});

// ---------------------------------------------------------------------------
// BOOK HIERARCHY
// ---------------------------------------------------------------------------

const books = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/books" }),
  schema: z.object({
    title: z.string(),
    project: reference("projects"),
    genres: z.array(z.string()).default([]),
    themes: z.array(reference("themes")).default([]),
    status: z
      .enum(["outline", "drafting", "first-draft", "revised", "complete"])
      .default("outline"),
  }),
});

const chapters = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/chapters" }),
  schema: z.object({
    title: z.string().optional(),
    project: reference("projects"),
    book: reference("books"),
    chapterNumber: z.number().int().positive(),
    characters: z.array(reference("characters")).default([]),
    locations: z.array(reference("locations")).default([]),
    plots: z.array(reference("plots")).default([]),
    themes: z.array(reference("themes")).default([]),
    synopsis: z.string().optional(),
    status: z
      .enum(["outline", "first-draft", "revised", "locked"])
      .default("outline"),
  }),
});

// ---------------------------------------------------------------------------
// MUSIC
// ---------------------------------------------------------------------------

/**
 * `songs` — individual songs, standalone or belonging to an album.
 *
 * Chord sheet data lives in `sections` (unique section definitions with
 * progressions) and `structure` (the ordered playback sequence).
 *
 * Example slug:  "holy-water"
 * Example file:  src/content/songs/holy-water.mdx
 */
const songs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/songs" }),
  schema: z.object({
    title: z.string(),

    /** Optional album this song belongs to */
    album: reference("albums").optional(),

    /** Key root e.g. "G", "C#", "Bb" */
    keyRoot: z.string(),

    /** Key mode */
    keyMode: z.enum(["major", "minor"]),

    /** Tempo in BPM */
    tempo: z.number().int().positive().optional(),

    /** Time signature numerator e.g. 4 for 4/4 */
    timeSignatureTop: z.number().int().positive().default(4),

    /** Time signature denominator e.g. 4 for 4/4 */
    timeSignatureBottom: z.number().int().positive().default(4),

    /**
     * Specific chord voicings used in this song, by slug.
     * e.g. ["g-0", "d-0", "em-0", "b-1", "c-0", "a-0"]
     * Drives the hover chord diagram feature — display name
     * comes from the chord record's `displayName` field.
     */
    chordVoicings: z.array(reference("chords")).default([]),

    /**
     * Ordered playback sequence of section names.
     * e.g. ["verse", "chorus", "solo", "verse", "bridge", "verse", "chorus", "solo"]
     * Names must match the `name` fields in `sections` below.
     */
    structure: z.array(z.string()).default([]),

    /**
     * Unique section definitions — each section type appears once here
     * regardless of how many times it appears in `structure`.
     * Each entry has:
     *   - name:    matches entries in `structure` e.g. "verse"
     *   - chords:  chord display names per bar e.g. ["G", "D", "Em", "B"]
     *   - bars:    total bar count for the section
     *   - repeats: how many times the section repeats when it appears
     */
    sections: z
      .array(
        z.object({
          name: z.string(),
          chords: z.array(z.string()),
          repeats: z.number().int().positive().default(1),
          bars: z.number().int().positive(),
        })
      )
      .default([]),

    themes: z.array(reference("themes")).default([]),
    chordSheetUrl: z.string().url().optional(),
    status: z
      .enum(["idea", "demo", "arranged", "recorded", "released"])
      .default("idea"),
    writtenAt: z.coerce.date().optional(),
  }),
});

// ---------------------------------------------------------------------------
// STANDALONE WRITINGS
// ---------------------------------------------------------------------------

const poems = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/poems" }),
  schema: z.object({
    title: z.string(),
    set: reference("sets").optional(),
    form: z.string().optional(),
    themes: z.array(reference("themes")).default([]),
    status: z.enum(["draft", "revised", "complete"]).default("draft"),
    writtenAt: z.coerce.date().optional(),
  }),
});

const shortStories = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/short-stories" }),
  schema: z.object({
    title: z.string(),
    set: reference("sets").optional(),
    companionProject: reference("projects").optional(),
    wordCount: z.number().int().positive().optional(),
    themes: z.array(reference("themes")).default([]),
    status: z.enum(["draft", "revised", "complete"]).default("draft"),
    writtenAt: z.coerce.date().optional(),
  }),
});

const dreams = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/dreams" }),
  schema: z.object({
    title: z.string(),
    set: reference("sets").optional(),
    companionProject: reference("projects").optional(),
    wordCount: z.number().int().positive().optional(),
    themes: z.array(reference("themes")).default([]),
    status: z.enum(["draft", "revised", "complete"]).default("draft"),
    writtenAt: z.coerce.date().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    postSeries: reference("post-series"),
    position: z.number().int().positive().optional(),
    excerpt: z.string().optional(),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    themes: z.array(reference("themes")).default([]),
    status: z.enum(["draft", "published"]).default("draft"),
  }),
});

/**
 * `reviews` — film, TV, and other media reviews.
 *
 * TMDB fields are populated automatically by enrich-tmdb.ts.
 * The `cast` field is populated by enrich-actors.ts after actor
 * files have been created in src/content/actors/.
 *
 * Enrichment workflow:
 *   1. Create stub review with `category`, `title`, `pubDate`
 *   2. pnpm run enrich:tmdb   → writes tmdbId, poster, year, overview, castDetailed
 *   3. pnpm run enrich:actors → creates actor files, writes cast slugs, removes castDetailed
 */
const reviews = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/reviews" }),
  schema: ({ image }: SchemaContext) =>
    z
      .object({
        // --- Core identity ---
        title: nonEmptyString,
        subtitle: optionalString,
        postSeries: reference("post-series").optional(),
        category: z.enum(["book", "movie", "album", "game", "restaurant", "product", "tv"]),
        pubDate: z.coerce.date(),
        status: z.enum(["draft", "published"]).default("draft"),

        // --- Taxonomy ---
        tags: z.array(z.string()).default([]),
        themes: z.array(reference("themes")).default([]),
        heroImage: image().optional(),

        // --- TV specifics ---
        season: positiveInt.optional(),
        episode: positiveInt.optional(),
        episodes: positiveInt.optional(),

        // --- External ratings ---
        url: z.string().url().optional(),
        imdbId: optionalString,
        imdbRating: z.number().min(0).max(10).optional(),
        tmdbRating: z.number().min(0).max(100).optional(),
        rottenTomatoesId: optionalString,
        rottenTomatoesRating: z.number().min(0).max(100).optional(),

        // --- Category scores (1-10 scale) ---
        writingScore: z.number().min(1).max(10).optional(),
        cohesionScore: z.number().min(1).max(10).optional(),
        performancesScore: z.number().min(1).max(10).optional(),
        pacingScore: z.number().min(1).max(10).optional(),
        productionScore: z.number().min(1).max(10).optional(),
        cinematographyScore: z.number().min(1).max(10).optional(),
        soundScore: z.number().min(1).max(10).optional(),

        // --- Final calculated score ---
        finalScore: z.number().min(1).max(10).optional(),

        // --- Credits ---
        /**
         * References to actor records in src/content/actors/.
         * Populated by enrich-actors.ts — do not edit manually
         * while castDetailed is still present.
         */
        cast: z.array(reference("actors")).default([]),
        writers: z.array(z.string()).optional(),
        directors: z.array(z.string()).optional(),
        productionCompanies: z.array(z.string()).optional(),
        channel: optionalString,

        // --- TMDB fields (populated by enrich-tmdb.ts) ---
        tmdbId: z.number().optional(),
        tmdbType: z.enum(["movie", "tv"]).optional(),
        tmdbSlug: optionalString,
        year: z.string().regex(/^\d{4}$/).optional(),
        poster: z.string().startsWith("/images/").optional(),
        overview: z.string().max(500).optional(),

        /**
         * Temporary staging field written by enrich-tmdb.ts,
         * consumed and removed by enrich-actors.ts.
         * Should not be present in fully-enriched review files.
         */
        castDetailed: z
          .array(
            z.object({
              id: positiveInt,
              name: nonEmptyString,
              character: z.string().max(100),
            })
          )
          .optional(),
      })
      .refine((d) => d.category !== "movie" || d.tmdbType === "movie", {
        message: "Movies must use tmdbType 'movie'",
        path: ["tmdbType"],
      })
      .refine((d) => d.category !== "tv" || d.tmdbType === "tv", {
        message: "TV must use tmdbType 'tv'",
        path: ["tmdbType"],
      }),
});

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------

export const collections = {
  projects,
  albums,
  sets,
  "post-series": postSeries,
  themes,
  chords,
  actors,
  characters,
  locations,
  plots,
  episodes,
  sequences,
  scenes,
  beats,
  books,
  chapters,
  songs,
  poems,
  "short-stories": shortStories,
  dreams,
  posts,
  reviews,
};