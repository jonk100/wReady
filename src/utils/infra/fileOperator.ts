import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

/**
 * Handles the physical writing of MDX/MD files to the content layer.
 * Ensures parent directories exist and prevents overwriting if requested.
 *
 * NOTE: We deliberately avoid matter.stringify(body, data) here because
 * gray-matter collapses consecutive blank lines in the body string. This
 * causes remark/MDX to silently drop any heading that isn't preceded by a
 * blank line — they simply never appear in the rendered output. Instead we
 * serialize only the frontmatter via matter and then concatenate the body
 * verbatim, preserving every newline exactly as written.
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

  /**
   * Serialize the frontmatter block only (pass empty string as body so
   * gray-matter gives us just the YAML wrapped in --- fences), then strip
   * the fences back off so we can rebuild the file ourselves.
   */
  const yamlOnly = matter.stringify('', data)
    .trim()
    .replace(/^---\n/, '')  // remove opening fence
    .replace(/\n---$/, ''); // remove closing fence

  /**
   * Re-assemble the file with a blank line between the closing --- and the
   * body. This ensures the body is appended verbatim: all blank lines
   * (double newlines) that separate headings and paragraphs are kept intact.
   */
  const fileContent = `---\n${yamlOnly}\n---\n${body ? '\n' + body : ''}`;

  await fs.writeFile(filePath, fileContent, 'utf-8');
  console.log('File written to:', filePath);

  return { path: filePath, slug };
}

/**
 * Deletes a content file from disk by collection and slug.
 * Tries .mdx first, then falls back to .md.
 *
 * @param collection - The content collection name e.g. 'chords', 'songs'
 * @param slug - The entry slug (filename without extension)
 * @returns {{ slug: string, success: boolean }}
 * @throws {Error} if no matching file is found for the slug
 */
export async function deleteContentFile({
  collection,
  slug,
}: {
  collection: string;
  slug: string;
}): Promise<{ slug: string; success: boolean }> {
  const base = path.join(process.cwd(), 'src/content', collection);

  // Try .mdx first, then .md
  const candidates = [
    path.join(base, `${slug}.mdx`),
    path.join(base, `${slug}.md`),
  ];

  for (const filePath of candidates) {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log(`Deleted: ${filePath}`);
      return { slug, success: true };
    } catch {
      // File doesn't exist at this path — try next candidate
    }
  }

  throw new Error(
    `No file found for slug "${slug}" in collection "${collection}". ` +
    `Looked for: ${candidates.join(', ')}`
  );
}