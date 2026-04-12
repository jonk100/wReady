/**
 * Download and store TMDB images locally
 */

import fs from 'fs/promises';
import path from 'path';

const IMAGE_DIR = path.join(process.cwd(), 'public/images/tmdb');

/**
 * Download image from URL → save locally
 */
export async function downloadImage(
	url: string,
	filename: string
): Promise<string | null> {
	try {
		await fs.mkdir(IMAGE_DIR, { recursive: true });

		const res = await fetch(url);

		if (!res.ok) {
			console.error('[IMG] Failed:', res.status);
			return null;
		}

		const buffer = Buffer.from(await res.arrayBuffer());

		const filePath = path.join(IMAGE_DIR, filename);

		await fs.writeFile(filePath, buffer);

		console.log('[IMG] Saved:', filename);

		return `/images/tmdb/${filename}`;
	} catch (err) {
		console.error('[IMG] Error:', err);
		return null;
	}
}