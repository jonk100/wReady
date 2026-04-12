import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export async function getLiveSongs() {
  const contentDir = path.join(process.cwd(), 'src/content/songs');
  const files = await fs.readdir(contentDir, { withFileTypes: true });
  
  const songs = [];
  for (const file of files) {
    if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.mdx'))) {
      const slug = file.name.replace(/\.(md|mdx)$/, '');
      try {
        const filePath = path.join(contentDir, file.name);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(fileContent);
        
        songs.push({
          id: slug,
          slug,
          data,
          collection: 'songs' as const,
          filePath: `src/content/songs/${file.name}`
        });
      } catch (error) {
        console.error(`Failed to load song ${slug}:`, error);
      }
    }
  }
  
  return songs;
}

export async function getLiveChords() {
  const contentDir = path.join(process.cwd(), 'src/content/chords');
  const files = await fs.readdir(contentDir, { withFileTypes: true });
  
  const chords = [];
  for (const file of files) {
    if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.mdx'))) {
      const slug = file.name.replace(/\.(md|mdx)$/, '');
      try {
        const filePath = path.join(contentDir, file.name);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(fileContent);
        
        chords.push({
          id: slug,
          slug,
          data,
          collection: 'chords' as const,
          filePath: `src/content/chords/${file.name}`
        });
      } catch (error) {
        console.error(`Failed to load chord ${slug}:`, error);
      }
    }
  }
  
  return chords;
}
