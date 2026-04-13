/**
 * TMDB API utilities
 * - Fetch by ID
 * - Search by title
 * - Smart matching helpers
 */

const BASE_URL = 'https://api.themoviedb.org/3';

export type TMDBMediaType = 'movie' | 'tv';

export interface TMDBItem {
	id: number;
	title?: string;
	name?: string;
	overview?: string;
	poster_path: string | null;
	release_date?: string;
	first_air_date?: string;
	vote_average?: number;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
}

/**
 * Fetch cast data from TMDB
 */
export async function fetchCast(
  id: number,
  type: TMDBMediaType,
  apiKey: string
): Promise<TMDBCastMember[]> {
  const url = `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${apiKey}`;

  try {
    const res = await fetch(url);

    if (!res.ok) return [];

    const data = await res.json();

    return (data.cast ?? []).slice(0, 10); // limit to top 10
  } catch {
    return [];
  }
}

/**
 * Get API key safely
 */
function getApiKey(): string | null {
	const key = process.env.TMDB_API_KEY;

	if (!key) {
		console.error('[TMDB] Missing API key. Available env vars:', Object.keys(process.env).filter(k => k.includes('TMDB')));
		return null;
	}

	return key;
}
/**
 * Fetch a single TMDB item by ID
 */
export async function getTMDBItem(
	id: number,
	type: TMDBMediaType
): Promise<TMDBItem | null> {
	if (id == null || type == null) {
		console.error('[TMDB] Invalid parameters', { id, type });
		return null;
	}

	const apiKey = getApiKey();
	if (!apiKey) return null;

	const url = `${BASE_URL}/${type}/${id}?api_key=${apiKey}`;

	try {
		console.log('[TMDB] Fetch', { id, type });

		const res = await fetch(url);

		if (!res.ok) {
			console.error('[TMDB] Fetch failed:', res.status);
			return null;
		}

		return await res.json();
	} catch (err) {
		console.error('[TMDB] Error:', err);
		return null;
	}
}

/**
 * Search TMDB by title
 */
export async function searchTMDB(
	query: string,
	type: TMDBMediaType
): Promise<TMDBItem[]> {
	const apiKey = getApiKey();
	if (!apiKey) return [];

	const url = `${BASE_URL}/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}`;

	try {
		console.log('[TMDB] Search', { query, type });

		const res = await fetch(url);

		if (!res.ok) {
			console.error('[TMDB] Search failed:', res.status);
			return [];
		}

		const data = await res.json();
		return data.results ?? [];
	} catch (err) {
		console.error('[TMDB] Search error:', err);
		return [];
	}
}

/**
 * Normalize strings for comparison
 */
function normalize(str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Score match quality (higher = better)
 */
export function scoreMatch(
	query: string,
	result: TMDBItem
): number {
	const name = result.title || result.name || '';
	const normQuery = normalize(query);
	const normName = normalize(name);

	let score = 0;

	if (normName === normQuery) score += 100;
	if (normName.includes(normQuery)) score += 50;

	// boost if year is close (if available)
	const date = result.release_date || result.first_air_date;
	if (date) {
		const year = parseInt(date.slice(0, 4));
		if (!isNaN(year)) score += 10;
	}

	return score;
}

/**
 * Pick best match from results
 */
export function pickBestMatch(
	query: string,
	results: TMDBItem[]
): TMDBItem | null {
	if (!results.length) return null;

	const scored = results
		.map((r) => ({ item: r, score: scoreMatch(query, r) }))
		.sort((a, b) => b.score - a.score);

	return scored[0].item;
}

/**
 * Build full poster URL
 */
export function getPosterUrl(path: string | null): string | null {
	if (!path) return null;
	return `https://image.tmdb.org/t/p/w500${path}`;
}

/**
 * Fetch external IDs for a TMDB item (including IMDb ID)
 */
export async function getExternalIds(
  id: number,
  type: TMDBMediaType
): Promise<{ imdb_id: string | null }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[TMDB] No API key available for external IDs');
    return { imdb_id: null };
  }

  const url = `${BASE_URL}/${type}/${id}/external_ids?api_key=${apiKey}`;

  try {
    console.debug('[TMDB] Fetching external IDs', { id, type });
    const res = await fetch(url);

    if (!res.ok) {
      console.warn('[TMDB] Failed to fetch external IDs:', res.status);
      return { imdb_id: null };
    }

    const data = await res.json();
    return { imdb_id: data.imdb_id || null };
  } catch (err) {
    console.error('[TMDB] Error fetching external IDs:', err);
    return { imdb_id: null };
  }
}