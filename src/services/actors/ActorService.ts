import { writeContentFile } from '../../utils/infra/fileOperator';
import { ContentReader } from '../../utils/infra/contentReader';
import { downloadImage } from '../../utils/infra/download';
import { searchTMDB as searchTMDBApi } from '../../utils/infra/tmdb';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export const ActorService = {
  /**
   * Creates a new actor with optional headshot image handling.
   * If heroImageUrl is provided, downloads the image and stores it locally.
   *
   * @param params - Validated input from the action handler
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if the slug already exists
   */
  async createActor(params: {
    slug: string;
    name: string;
    tmdbId: number;
    born?: string;
    from?: string;
    heroImageUrl?: string;
  }) {
    const { slug, heroImageUrl, ...data } = params;

    // 1. Guard: reject duplicate slugs
    const exists = await ContentReader.exists('actors', slug);
    if (exists) {
      throw new Error(`Slug "${slug}" already exists in actors.`);
    }

    // 2. Handle headshot image download if provided
    let enrichedData: any = { ...data };
    
    if (heroImageUrl) {
      try {
        const filename = `${slug}-headshot.jpg`;
        const localPath = await downloadImage(heroImageUrl, filename);
        if (localPath) {
          enrichedData.heroImage = localPath;
        }
      } catch (error) {
        console.warn(`Failed to download headshot for ${slug}:`, error);
        // Continue without the image - don't fail the entire operation
      }
    }

    // 3. Strip undefined values so YAML serialisation doesn't write null keys
    const cleanData = Object.fromEntries(
      Object.entries(enrichedData).filter(([, value]) => value !== undefined)
    );

    // 4. Write to disk - the SSR page will pick this up on next request
    const result = await writeContentFile({
      collection: 'actors',
      slug,
      data: cleanData,
    });

    return { id: result.slug, success: true };
  },

  /**
   * Search for actors in local collection first, then TMDB if not found.
   * Returns combined results with local actors marked as existing.
   */
  async searchActors(query: string): Promise<string> {
    try {
      // Search local collection first
      const localActors = await this.searchLocalActors(query);
      
      // If we have local results, return them
      if (localActors.length > 0) {
        return JSON.stringify(localActors);
      }
      
      // If no local results, search TMDB for people
      const apiKey = process.env.TMDB_API_KEY;
      if (!apiKey) {
        return '[]';
      }
      
      const tmdbUrl = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
      const response = await fetch(tmdbUrl);
      
      if (!response.ok) {
        return '[]';
      }
      
      const data = await response.json();
      const simplifiedResults = data.results.map((actor: any) => ({
        id: actor.id,
        name: actor.name,
        known_for: actor.known_for?.map((item: any) => item.title || item.name).slice(0, 3).join(', ') || '',
        profile_path: actor.profile_path,
        exists: false
      }));
      
      return JSON.stringify(simplifiedResults);
    } catch (error) {
      console.error('ActorService.searchActors error:', error);
      return '[]';
    }
  },

  /**
   * Search local actors collection by name
   */
  async searchLocalActors(query: string): Promise<any[]> {
    try {
      const collectionDir = path.resolve(process.cwd(), 'src/content/actors');
      const files = await fs.readdir(collectionDir);
      
      const actors = await Promise.all(
        files
          .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
          .map(async (file) => {
            const raw = await fs.readFile(path.join(collectionDir, file), 'utf-8');
            const { data } = matter(raw);
            const id = file.replace(/\.(md|mdx)$/, '');
            
            // Simple name matching (case-insensitive)
            if (data.name && data.name.toLowerCase().includes(query.toLowerCase())) {
              return {
                id,
                name: data.name,
                tmdbId: data.tmdbId,
                exists: true
              };
            }
            return null;
          })
      );
      
      return actors.filter(actor => actor !== null);
    } catch (error) {
      console.error('Error searching local actors:', error);
      return [];
    }
  },

  /**
   * Validates TMDB actor data and formats it for actor creation.
   * This is a helper for potential future TMDB integration.
   */
  formatTMDBActor(tmdbData: any) {
    return {
      name: tmdbData.name,
      tmdbId: tmdbData.id,
      born: tmdbData.birthday,
      from: tmdbData.place_of_birth,
      heroImageUrl: tmdbData.profile_path 
        ? `https://image.tmdb.org/t/p/w500${tmdbData.profile_path}`
        : undefined,
    };
  }
};
