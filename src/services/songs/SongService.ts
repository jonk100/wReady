import { writeContentFile, deleteContentFile } from '../../utils/infra/fileOperator';
import { ContentReader } from '../../utils/infra/contentReader';

export const SongService = {
  /**
   * Creates a new song entry file on disk.
   *
   * @param params - Validated song data from the createSong action
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if the slug already exists, or if references are invalid
   */
  async createSong(params: {
    title: string;
    slug: string;
    keyRoot: string;
    keyMode: string;
    tempo?: number;
    timeSignatureTop: number;
    timeSignatureBottom: number;
    chordVoicings: string[];
    structure: string[];
    sections: Array<{
      name: string;
      chords: string[];
      bars: number;
      repeats?: number;
    }>;
    album?: string;
    chordSheetUrl?: string;
    status?: string;
    themes?: string[];
    body?: string;
  }) {
    const { slug, body, ...data } = params;

    const exists = await ContentReader.exists('songs', slug);
    if (exists) {
      throw new Error(`Song slug "${slug}" already exists.`);
    }

    if (data.chordVoicings && data.chordVoicings.length > 0) {
      for (const chordSlug of data.chordVoicings) {
        const chordExists = await ContentReader.exists('chords', chordSlug);
        if (!chordExists) {
          throw new Error(`Chord voicing "${chordSlug}" does not exist in the chords collection.`);
        }
      }
    }

    if (data.album) {
      const albumExists = await ContentReader.exists('albums', data.album);
      if (!albumExists) {
        throw new Error(`Album "${data.album}" does not exist in the albums collection.`);
      }
    }

    if (data.themes && data.themes.length > 0) {
      for (const themeSlug of data.themes) {
        const themeExists = await ContentReader.exists('themes', themeSlug);
        if (!themeExists) {
          throw new Error(`Theme "${themeSlug}" does not exist in the themes collection.`);
        }
      }
    }

    if (data.sections && data.sections.length > 0) {
      for (const section of data.sections) {
        if (!section.name || section.name.trim() === '') {
          throw new Error('All sections must have a name');
        }
        if (!section.chords || section.chords.length === 0) {
          throw new Error(`Section "${section.name}" must have at least one chord`);
        }
        if (!section.bars || section.bars < 1) {
          throw new Error(`Section "${section.name}" must have at least 1 bar`);
        }
        if (section.repeats && section.repeats < 1) {
          throw new Error(`Section "${section.name}" repeats must be at least 1 if specified`);
        }
      }
    }

    if (data.structure && data.structure.length > 0 && data.sections) {
      const sectionNames = new Set(data.sections.map(s => s.name));
      for (const structureItem of data.structure) {
        if (!sectionNames.has(structureItem)) {
          throw new Error(`Structure references section "${structureItem}" which does not exist in sections`);
        }
      }
    }

    const writeData = {
      title: data.title,
      album: data.album,
      keyRoot: data.keyRoot,
      keyMode: data.keyMode,
      tempo: data.tempo,
      timeSignatureTop: data.timeSignatureTop,
      timeSignatureBottom: data.timeSignatureBottom,
      chordVoicings: data.chordVoicings,
      structure: data.structure,
      sections: data.sections,
      themes: data.themes,
      chordSheetUrl: data.chordSheetUrl,
      status: data.status || 'idea',
    };

    const cleanData = Object.fromEntries(
      Object.entries(writeData).filter(([_, value]) => value !== undefined)
    );

    const result = await writeContentFile({
      collection: 'songs',
      slug,
      data: cleanData,
      body: body ?? '',
    });

    return { id: result.slug, success: true };
  },

  /**
   * Deletes a song entry file from disk by slug.
   * Throws if the slug does not exist, so the action can return a clear error.
   *
   * @param slug - The song slug to delete e.g. 'holy-water-0'
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if no file is found for the slug
   */
  async deleteSong(slug: string) {
    const exists = await ContentReader.exists('songs', slug);
    if (!exists) {
      throw new Error(`Song slug "${slug}" does not exist.`);
    }

    const result = await deleteContentFile({ collection: 'songs', slug });
    return { id: result.slug, success: true };
  },
};