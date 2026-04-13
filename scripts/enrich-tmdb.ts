/**
 * Upgraded TMDB enrichment with Slug-based filenames
 */
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

import {
	searchTMDB,
	pickBestMatch,
	getPosterUrl,
	getTMDBItem,
} from '../src/utils/tmdb.ts';

import { getExternalIds } from '../src/utils/infra/tmdb';

import { getImdbRating } from '../src/utils/infra/omdb';

import { getCached, setCached } from './utils/cache';
import { downloadImage } from './utils/download';
import { createSlug } from './utils/slug';
import { fetchCast } from './utils/cast';

const REVIEWS_DIR = path.join(process.cwd(), 'src/content/reviews');
const API_KEY = process.env.TMDB_API_KEY;

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

async function getFiles(dir: string): Promise<string[]> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map((entry) => {
			const full = path.join(dir, entry.name);
			return entry.isDirectory() ? getFiles(full) : full;
		})
	);
	return files.flat().filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
}

async function run() {
	const files = await getFiles(REVIEWS_DIR);

	for (const file of files) {
		const raw = await fs.readFile(file, 'utf-8');
		const parsed = matter(raw);
		const data = parsed.data;

		// Skip if already fully enriched (check for new fields)
		if (data.tmdbId && data.poster && data.imdbId && data.imdbRating && data.tmdbRating) continue;
		if (!['movie', 'tv'].includes(data.category)) continue;

		const cacheKey = `${data.category}:${data.title}`;
		let match = await getCached<any>(cacheKey);

		if (!match) {
			if (data.tmdbId) {
				match = await getTMDBItem(data.tmdbId, data.category);
			} else {
				const results = await searchTMDB(data.title, data.category);
				match = pickBestMatch(data.title, results);
			}
			if (!match) continue;
			await setCached(cacheKey, match);
		}

		console.log('[MATCH]', match.title || match.name);

		// ✅ SLUG GENERATION
		const slug = createSlug(match.title || match.name || '');

		// ✅ POSTER DOWNLOAD (Slug + ID)
		const posterUrl = getPosterUrl(match.poster_path);
		let localPoster = data.poster || null;

		console.log('[POSTER] Poster path:', match.poster_path);
		console.log('[POSTER] Poster URL:', posterUrl);

		if (posterUrl && !localPoster) {
			const filename = `${slug}-${match.id}.jpg`;
			console.log('[POSTER] Downloading:', filename);
			localPoster = await downloadImage(posterUrl, filename);
			if (localPoster) {
				console.log('[POSTER] Success:', localPoster);
			} else {
				console.log('[POSTER] Failed to download poster');
			}
		} else if (localPoster) {
			console.log('[POSTER] Using existing poster:', localPoster);
		} else {
			console.log('[POSTER] No poster available');
		}

		// ✅ CAST FETCHING
		const cast = API_KEY
			? await fetchCast(match.id, data.category, API_KEY)
			: [];

		// ✅ EXTERNAL IDs (for IMDb)
		let imdbId = data.imdbId;
		if (!imdbId) {
			const externalIds = await getExternalIds(match.id, data.category);
			if (externalIds.imdb_id) {
				imdbId = externalIds.imdb_id;
				console.log('[IMDb] Found IMDb ID:', imdbId);
			}
		}

		// ✅ IMDb RATING
		let imdbRating = data.imdbRating;
		if (imdbId && !imdbRating) {
			const rating = await getImdbRating(imdbId);
			if (rating) {
				imdbRating = rating;
				console.log('[IMDb] Fetched rating:', rating);
			}
		}

		// ✅ WRITERS (TV shows)
		let writers = data.writers;
		if (!writers && match.created_by && match.created_by.length > 0) {
			writers = match.created_by.map((w: any) => w.name);
		}

		// ✅ DIRECTORS (movies)
		let directors = data.directors;
		if (!directors && data.category === 'movie' && match.credits?.crew) {
			const crewDirectors = match.credits.crew
				.filter((c: any) => c.job === 'Director')
				.map((d: any) => d.name);
			if (crewDirectors.length > 0) {
				directors = crewDirectors;
			}
		}

		// ✅ PRODUCTION COMPANIES
		let productionCompanies = data.productionCompanies;
		if (!productionCompanies && match.production_companies && match.production_companies.length > 0) {
			productionCompanies = match.production_companies.map((pc: any) => pc.name);
		}

		// ✅ CHANNEL (TV shows)
		let channel = data.channel;
		if (!channel && data.category === 'tv' && match.networks && match.networks.length > 0) {
			channel = normalizeChannel(match.networks[0].name);
		}

		const updated = {
			...data,
			tmdbId: match.id,
			tmdbType: data.category,
			tmdbSlug: slug,
			tmdbRating: data.tmdbRating ?? match.vote_average,
			poster: localPoster,
			year: data.year ?? (match.release_date || match.first_air_date || '').slice(0, 4),
			overview: data.overview ?? match.overview?.slice(0, 450) + '...',
			channel: channel ?? normalizeChannel(data.channel),
			imdbId,
			imdbRating,
			writers,
			directors,
			productionCompanies,
			castDetailed: cast.map(c => ({
				id: c.id,
				name: c.name,
				character: c.character
			}))
		};

		// Filter out undefined values to avoid YAML serialization errors
		const cleaned = Object.fromEntries(
			Object.entries(updated).filter(([, value]) => value !== undefined)
		);

		await fs.writeFile(file, matter.stringify(parsed.content, cleaned));
	}
}

run();