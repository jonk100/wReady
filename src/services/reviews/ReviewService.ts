import { writeContentFile } from '../../utils/infra/fileOperator';
import { ContentReader } from '../../utils/infra/contentReader';
import { downloadImage } from '../../utils/infra/download';
import { getTMDBItem, searchTMDB, pickBestMatch, getPosterUrl, fetchCast, type TMDBMediaType } from '../../utils/infra/tmdb';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Generate clean slugs for TMDB items
 */
function createSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalize channel names for consistent display
 */
function normalizeChannel(channel: string): string {
  if (!channel) return channel;
  
  // Map of channel name variations to normalized names
  const channelMap: Record<string, string> = {
    'Amazon Prime Video': 'Amazon',
    'Amazon Prime': 'Amazon',
    'HBO Max': 'Max',
    'Disney Plus': 'Disney+',
    'Apple TV Plus': 'Apple TV+',
  };
  
  return channelMap[channel] || channel;
}

export const ReviewService = {
  /**
   * Creates a new review with optional TMDB enrichment.
   * If tmdbId is provided, enriches the review with TMDB data.
   * If cast TMDB IDs are provided, enriches the actors automatically.
   *
   * @param params - Validated input from the action handler
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if the slug already exists
   */
  async createReview(params: {
    slug: string;
    title: string;
    subtitle?: string;
    category: 'book' | 'movie' | 'album' | 'game' | 'restaurant' | 'product' | 'tv';
    pubDate: string;
    postSeries?: string;
    tags?: string[];
    themes?: string[];
    season?: number;
    episode?: number;
    episodes?: number;
    url?: string;
    imdbId?: string;
    imdbRating?: number;
    rottenTomatoesId?: string;
    rottenTomatoesRating?: number;
    writers?: string[];
    directors?: string[];
    productionCompanies?: string[];
    channel?: string;
    tmdbId?: number;
    cast?: string[];
    body?: string;
  }) {
    const { slug, tmdbId, category, cast, ...data } = params;

    // 1. Guard: reject duplicate slugs
    const exists = await ContentReader.exists('reviews', slug);
    if (exists) {
      throw new Error(`Slug "${slug}" already exists in reviews.`);
    }

    // 2. Enrich with TMDB data if tmdbId is provided and category supports it
    let enrichedData: any = { ...data, category };
    
    if (tmdbId && (category === 'movie' || category === 'tv')) {
      const tmdbType = category === 'movie' ? 'movie' : 'tv';
      const tmdbData: any = await getTMDBItem(tmdbId, tmdbType);
      
      if (tmdbData) {
        // Use createSlug for tmdbSlug to match enrich-tmdb.ts
        const slug = createSlug(tmdbData.title || tmdbData.name || '');
        
        enrichedData = {
          ...enrichedData,
          tmdbId: tmdbData.id,
          tmdbType,
          tmdbSlug: slug,
          year: (data as any).year ?? (tmdbData.release_date || tmdbData.first_air_date || '').slice(0, 4),
          overview: (data as any).overview ?? (tmdbData.overview?.slice(0, 450) + '...'),
        };

        // Download poster if available (use poster field to match enrich-tmdb.ts)
        if (tmdbData.poster_path) {
          const posterUrl = getPosterUrl(tmdbData.poster_path);
          if (posterUrl) {
            const filename = `${slug}-${tmdbData.id}.jpg`;
            const localPath = await downloadImage(posterUrl, filename);
            if (localPath) {
              enrichedData.poster = localPath;
            }
          }
        }

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
      }
    }

    // 3. Enrich cast members if TMDB IDs are provided or fetch automatically from TMDB
    let castSlugs: string[] = [];
    let allCastIds: string[] = [];
    let castDetailed: any[] = [];
    
    // Start with manually selected cast if provided
    if (cast && cast.length > 0) {
      allCastIds = [...cast];
    }
    
    // Automatically fetch top 3 cast from TMDB if tmdbId is provided
    if (tmdbId && (category === 'movie' || category === 'tv')) {
      const apiKey = process.env.TMDB_API_KEY;
      if (apiKey) {
        const tmdbCast = await fetchCast(tmdbId, category, apiKey);
        // Get top 3 cast members by order
        const topCast = tmdbCast.slice(0, 3);
        
        // Add their TMDB IDs if not already in the manual selection
        for (const castMember of topCast) {
          const castId = castMember.id.toString();
          if (!allCastIds.includes(castId)) {
            allCastIds.push(castId);
          }
          // Add to castDetailed
          castDetailed.push({
            id: castMember.id,
            name: castMember.name,
            character: castMember.character
          });
        }
      }
    }
    
    // Enrich all cast members
    if (allCastIds.length > 0) {
      castSlugs = await this.enrichCastMembers(allCastIds);
      enrichedData.cast = castSlugs;
    }

    // Add castDetailed field if we have cast data
    if (castDetailed.length > 0) {
      enrichedData.castDetailed = castDetailed;
    }

    // 4. Strip undefined values and remove duplicate body field
    const { body, ...dataWithoutBody } = enrichedData;
    const cleanData = Object.fromEntries(
      Object.entries(dataWithoutBody).filter(([, value]) => value !== undefined)
    );

    // 5. Write to disk - the SSR page will pick this up on next request
    const result = await writeContentFile({
      collection: 'reviews',
      slug,
      data: cleanData,
      body: params.body || '',
    });

    return { id: result.slug, success: true };
  },

  /**
   * Search TMDB for movies/TV shows by title.
   * Returns the best match or null if no results found.
   */
  async searchTMDB(title: string, category: 'movie' | 'tv'): Promise<any> {
    const tmdbType = category === 'movie' ? 'movie' : 'tv';
    const results = await searchTMDB(title, tmdbType);
    return pickBestMatch(title, results);
  },

  /**
   * Search TMDB for movies/TV shows by title and return all results.
   * Used for the search interface where users can select from multiple options.
   */
  async searchTMDBResults(query: string, category: 'movie' | 'tv'): Promise<string> {
    const tmdbType = category === 'movie' ? 'movie' : 'tv';
    const results = await searchTMDB(query, tmdbType);
    
    // Convert to simple objects and return as JSON string
    const simplifiedResults = results.map(item => ({
      id: item.id,
      title: item.title || item.name || '',
      release_date: item.release_date || item.first_air_date || '',
      overview: item.overview || ''
    }));
    
    return JSON.stringify(simplifiedResults);
  },

  /**
   * Enrich cast members from TMDB IDs or slugs.
   * Creates actor files if they don't exist, downloads profile images.
   */
  async enrichCastMembers(castIds: string[]): Promise<string[]> {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.warn('[ReviewService] TMDB API key not available for cast enrichment');
      return [];
    }

    const castSlugs: string[] = [];
    const actorsDir = path.resolve(process.cwd(), 'src/content/actors');

    for (const castId of castIds) {
      try {
        // Check if this is a slug (non-numeric) or TMDB ID (numeric)
        const isTmdbId = /^\d+$/.test(castId);
        
        if (!isTmdbId) {
          // It's already a slug, just use it directly
          castSlugs.push(castId);
          continue;
        }

        // It's a TMDB ID, check if actor already exists
        const existingActor = await this.findActorByTmdbId(parseInt(castId, 10));
        if (existingActor) {
          castSlugs.push(existingActor);
          continue;
        }

        // Fetch TMDB data for the actor
        const tmdbUrl = `https://api.themoviedb.org/3/person/${castId}?api_key=${apiKey}`;
        const response = await fetch(tmdbUrl);
        
        if (!response.ok) {
          console.warn(`[ReviewService] Failed to fetch TMDB data for actor ${castId}`);
          continue;
        }

        const actorData = await response.json();
        
        // Create actor slug from name
        const slug = actorData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');

        // Download profile image if available
        let heroImage = null;
        if (actorData.profile_path) {
          const profileUrl = `https://image.tmdb.org/t/p/w500${actorData.profile_path}`;
          const filename = `${slug}-${castId}.jpg`;
          const localPath = await downloadImage(profileUrl, filename);
          if (localPath) {
            heroImage = localPath;
          }
        }

        // Create actor file
        const actorDataToWrite = {
          name: actorData.name,
          tmdbId: parseInt(castId, 10),
          born: actorData.birthday || null,
          from: actorData.place_of_birth || null,
          heroImage
        };

        // Clean undefined/null values
        const cleanActorData = Object.fromEntries(
          Object.entries(actorDataToWrite).filter(([, value]) => value !== null && value !== undefined)
        );

        const filePath = path.join(actorsDir, `${slug}.mdx`);
        await fs.writeFile(filePath, matter.stringify('', cleanActorData));
        
        console.log(`[ReviewService] Created actor: ${slug}`);
        castSlugs.push(slug);
      } catch (error) {
        console.error(`[ReviewService] Error enriching actor ${castId}:`, error);
      }
    }

    return castSlugs;
  },

  /**
   * Find an actor in the local collection by TMDB ID.
   */
  async findActorByTmdbId(tmdbId: number): Promise<string | null> {
    try {
      const actorsDir = path.resolve(process.cwd(), 'src/content/actors');
      const files = await fs.readdir(actorsDir);
      
      for (const file of files) {
        if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
        
        const filePath = path.join(actorsDir, file);
        const raw = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(raw);
        
        if (data.tmdbId === tmdbId) {
          return file.replace(/\.(md|mdx)$/, '');
        }
      }
      
      return null;
    } catch (error) {
      console.error('[ReviewService] Error finding actor by TMDB ID:', error);
      return null;
    }
  }
};
