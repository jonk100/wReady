/**
 * OMDb API utilities
 * - Fetch IMDb ratings by IMDb ID
 */

const BASE_URL = 'https://www.omdbapi.com';

/**
 * Get API key safely
 */
function getApiKey(): string | null {
  const key = process.env.OMDB_API_KEY;

  if (!key) {
    console.error('[OMDb] Missing API key. Available env vars:', Object.keys(process.env).filter(k => k.includes('OMDB')));
    return null;
  }

  return key;
}

/**
 * Fetch IMDb rating by IMDb ID
 * @param imdbId - The IMDb ID (e.g., "tt0133093")
 * @returns IMDb rating as a number (0-10) or null if unavailable
 */
export async function getImdbRating(imdbId: string): Promise<number | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[OMDb] No API key available for IMDb rating');
    return null;
  }

  const url = `${BASE_URL}/?apikey=${apiKey}&i=${imdbId}`;

  try {
    console.debug('[OMDb] Fetching IMDb rating', { imdbId });
    const res = await fetch(url);

    if (!res.ok) {
      console.warn('[OMDb] Failed to fetch IMDb rating:', res.status);
      return null;
    }

    const data = await res.json();

    if (data.Response === 'False') {
      console.warn('[OMDb] API returned error:', data.Error);
      return null;
    }

    const rating = parseFloat(data.imdbRating);
    if (isNaN(rating)) {
      console.warn('[OMDb] Invalid IMDb rating format:', data.imdbRating);
      return null;
    }

    console.debug('[OMDb] Successfully fetched IMDb rating', { imdbId, rating });
    return rating;
  } catch (err) {
    console.error('[OMDb] Error fetching IMDb rating:', err);
    return null;
  }
}
