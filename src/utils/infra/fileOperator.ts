import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

/**
 * Handles the physical writing of MDX/MD files to the content layer.
 * Ensures parent directories exist and prevents overwriting if requested.
 */
export async function writeContentFile(params: {
  collection: string;
  slug: string;
  data: Record<string, any>;
  body?: string;
  overwrite?: boolean;
}) {
  const { collection, slug, data, body = '', overwrite = true } = params;
  
  // Base directory for the collection
  const baseDir = path.join(process.cwd(), 'src/content', collection);
  const filePath = path.join(baseDir, `${slug}.mdx`);

  // Ensure directory exists (handles nested slugs like 'projects/scenes/s1')
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // Collision check
  if (!overwrite) {
    try {
      await fs.access(filePath);
      throw new Error(`File collision: ${slug} already exists in ${collection}`);
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
    }
  }

  // Generate file content with gray-matter
  console.log('About to stringify with matter:', { body, data });
  const fileContent = matter.stringify(body, data);
  console.log('Matter stringify successful, content length:', fileContent.length);
  
  await fs.writeFile(filePath, fileContent, 'utf-8');
  console.log('File written to:', filePath);

  return { path: filePath, slug };
}