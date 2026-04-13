import { defineAction } from 'astro:actions';
import { z } from 'astro:content';
import { SongService } from '../services/songs/SongService';
import { ChordService } from '../services/chords/ChordService';
import { WritingService } from '../services/writings/WritingService';
import { ReviewService } from '../services/reviews/ReviewService';
import { ActorService } from '../services/actors/ActorService';
import { searchTMDB } from '../utils/infra/tmdb';

export const server = {
  // ---------------------------------------------------------------------------
  // SONGS
  // ---------------------------------------------------------------------------

  createSong: defineAction({
    accept: 'json',
    input: z.object({
      title: z.string().min(1, 'Title is required'),
      slug: z.string().min(1, 'Slug is required'),
      keyRoot: z.string().min(1, 'Key root is required'),
      keyMode: z.enum(['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian']),
      tempo: z.number().int().positive().optional(),
      timeSignatureTop: z.number().int().positive(),
      timeSignatureBottom: z.number().int().positive(),
      chordVoicings: z.array(z.string()),
      structure: z.array(z.string()),
      sections: z.array(z.object({
        name: z.string(),
        chords: z.array(z.string()),
        bars: z.number().int().positive(),
        repeats: z.number().int().positive().default(1),
      })),
      album: z.string().optional(),
      chordSheetUrl: z.string().optional(),
      status: z.string().optional(),
      themes: z.array(z.string()).optional(),
      body: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const result = await SongService.createSong(input);
        return { success: true, id: result.id, message: 'Song created successfully' };
      } catch (error) {
        console.error('Action createSong error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  }),

  deleteSong: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug is required'),
    }),
    handler: async ({ slug }) => {
      try {
        const result = await SongService.deleteSong(slug);
        return { success: true, id: result.id, message: `Song "${slug}" deleted` };
      } catch (error) {
        console.error('Action deleteSong error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  }),

  // ---------------------------------------------------------------------------
  // CHORDS
  // ---------------------------------------------------------------------------

  createChord: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug is required'),
      displayName: z.string().min(1, 'Display name is required'),
      voicingLabel: z.string().min(1, 'Voicing label is required'),
      baseFret: z.string().transform((val) => {
        const num = parseInt(val, 10);
        return isNaN(num) ? 1 : num;
      }),
      fingering: z.array(z.number()).min(6, 'Fingering must have at least 6 positions'),
      frets: z.array(z.number()).min(6, 'Frets must have at least 6 positions'),
      notes: z.string().optional().transform((val) => {
        if (!val || val === 'null') return undefined;
        try { return JSON.parse(val); } catch { return undefined; }
      }),
      alternateNames: z.string().optional().transform((val) => {
        if (!val || val === 'null') return undefined;
        try { return JSON.parse(val); } catch { return undefined; }
      }),
      barre: z.string().optional().transform((val) => {
        if (!val || val === 'null') return undefined;
        try { return JSON.parse(val); } catch { return undefined; }
      }).optional(),
    }),
    handler: async (input) => {
      try {
        const result = await ChordService.createChord(input);
        return { success: true, id: result.id, message: 'Chord created successfully' };
      } catch (error) {
        console.error('Action createChord error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  }),

  deleteChord: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug is required'),
    }),
    handler: async ({ slug }) => {
      try {
        const result = await ChordService.deleteChord(slug);
        return { success: true, id: result.id, message: `Chord "${slug}" deleted` };
      } catch (error) {
        console.error('Action deleteChord error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  }),

  // ---------------------------------------------------------------------------
  // WRITINGS
  // ---------------------------------------------------------------------------

  createPoem: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug is required'),
      title: z.string().min(1, 'Title is required'),
      form: z.string().optional(),
      set: z.string().optional(),
      themes: z.array(z.string()).optional(),
      status: z.string().optional(),
      writtenAt: z.string().optional(),
      body: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const result = await WritingService.createPoem(input);
        return { success: true, id: result.id, message: 'Poem created successfully' };
      } catch (error) {
        console.error('Action createPoem error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  }),

  createShortStory: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug is required'),
      title: z.string().min(1, 'Title is required'),
      set: z.string().optional(),
      companionProject: z.string().optional(),
      wordCount: z.number().int().positive().optional(),
      themes: z.array(z.string()).optional(),
      status: z.string().optional(),
      writtenAt: z.string().optional(),
      body: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const result = await WritingService.createShortStory(input);
        return { success: true, id: result.id, message: 'Short story created successfully' };
      } catch (error) {
        console.error('Action createShortStory error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  }),

  createDream: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug is required'),
      title: z.string().min(1, 'Title is required'),
      set: z.string().optional(),
      companionProject: z.string().optional(),
      wordCount: z.number().int().positive().optional(),
      themes: z.array(z.string()).optional(),
      status: z.string().optional(),
      writtenAt: z.string().optional(),
      body: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const result = await WritingService.createDream(input);
        return { success: true, id: result.id, message: 'Dream created successfully' };
      } catch (error) {
        console.error('Action createDream error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  }),

  // ---------------------------------------------------------------------------
  // REVIEWS
  // ---------------------------------------------------------------------------

  createReview: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug is required'),
      title: z.string().min(1, 'Title is required'),
      subtitle: z.string().optional(),
      category: z.enum(['book', 'movie', 'album', 'game', 'restaurant', 'product', 'tv']),
      pubDate: z.string(),
      postSeries: z.string().optional(),
      tags: z.array(z.string()).optional(),
      themes: z.array(z.string()).optional(),
      season: z.number().int().positive().optional(),
      episode: z.number().int().positive().optional(),
      episodes: z.number().int().positive().optional(),
      url: z.string().url().optional(),
      imdbId: z.string().optional(),
      imdbRating: z.number().min(0).max(10).optional(),
      rottenTomatoesId: z.string().optional(),
      rottenTomatoesRating: z.number().min(0).max(100).optional(),
      writers: z.array(z.string()).optional(),
      directors: z.array(z.string()).optional(),
      productionCompanies: z.array(z.string()).optional(),
      channel: z.string().optional(),
      tmdbId: z.number().int().positive().optional(),
      cast: z.array(z.string()).optional(),
      body: z.string().optional(),
      writingScore: z.number().min(1).max(10).optional(),
      cohesionScore: z.number().min(1).max(10).optional(),
      performancesScore: z.number().min(1).max(10).optional(),
      pacingScore: z.number().min(1).max(10).optional(),
      productionScore: z.number().min(1).max(10).optional(),
      cinematographyScore: z.number().min(1).max(10).optional(),
      soundScore: z.number().min(1).max(10).optional(),
    overallAssessment: z.string().optional(),
    writingBody: z.string().optional(),
    cohesionBody: z.string().optional(),
    performancesBody: z.string().optional(),
    pacingBody: z.string().optional(),
    productionBody: z.string().optional(),
    cinematographyBody: z.string().optional(),
    soundBody: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const result = await ReviewService.createReview(input);
        return { success: true, id: result.id, message: 'Review created successfully' };
      } catch (error) {
        console.error('Action createReview error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  }),

  searchTMDB: defineAction({
    accept: 'json',
    input: z.object({
      query: z.string().min(1, 'Search query is required'),
      category: z.enum(['movie', 'tv']),
    }),
    handler: async (input) => {
      try {
        const resultsJson = await ReviewService.searchTMDBResults(input.query, input.category);
        // Return the JSON string directly to avoid Astro Actions serialization issues
        return resultsJson;
      } catch (error) {
        console.error('Action searchTMDB error:', error);
        return '[]';
      }
    },
  }),

  // ---------------------------------------------------------------------------
  // ACTORS
  // ---------------------------------------------------------------------------

  createActor: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug is required'),
      name: z.string().min(1, 'Name is required'),
      tmdbId: z.number().int().positive(),
      born: z.string().optional(),
      from: z.string().optional(),
      heroImageUrl: z.string().url().optional(),
    }),
    handler: async (input) => {
      try {
        const result = await ActorService.createActor(input);
        return { success: true, id: result.id, message: 'Actor created successfully' };
      } catch (error) {
        console.error('Action createActor error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  }),

  searchActors: defineAction({
    accept: 'json',
    input: z.object({
      query: z.string().min(1, 'Search query is required'),
    }),
    handler: async (input) => {
      try {
        const resultsJson = await ActorService.searchActors(input.query);
        return resultsJson;
      } catch (error) {
        console.error('Action searchActors error:', error);
        return '[]';
      }
    },
  }),
};