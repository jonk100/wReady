// src/loaders/live-file-loader.ts
import type { Loader } from 'astro/loaders';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export function liveFileLoader(baseDir: string): Loader {
  return {
    name: 'live-file-loader',
    // 1. Destructure 'parseData' from the arguments
    load: async ({ store, parseData, logger }) => {
      const absolutePath = path.resolve(process.cwd(), baseDir);
      
      try {
        const files = await fs.readdir(absolutePath);
        store.clear();

        await Promise.all(
          files
            .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
            .map(async (file) => {
              const filePath = path.join(absolutePath, file);
              const content = await fs.readFile(filePath, 'utf-8');
              const { data, content: body } = matter(content);
              const id = file.replace(/\.(md|mdx)$/, '');

              // 2. Validate and parse the data using Astro's helper.
              // This is what allows Astro to "see" these as valid entries.
              const parsedData = await parseData({ id, data });

              store.set({
                id,
                data: parsedData,
                body
              });
            })
        );
        
        logger.info(`Live-loaded from ${baseDir}`);
      } catch (e) {
        logger.error(`Failed to live-load from ${baseDir}: ${e}`);
      }
    }
  };
}