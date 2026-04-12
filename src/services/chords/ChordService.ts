import { writeContentFile, deleteContentFile } from '../../utils/infra/fileOperator';
import { ContentReader } from '../../utils/infra/contentReader';

export const ChordService = {
  /**
   * Creates a new chord entry file on disk.
   *
   * @param params - Validated chord data from the createChord action
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if the slug already exists
   */
  async createChord(params: {
    slug: string;
    displayName: string;
    voicingLabel: string;
    baseFret: number;
    fingering: number[];
    frets: number[];
    notes?: string[];
    alternateNames?: string[];
    barre?: any;
  }) {
    const { slug, ...data } = params;

    const exists = await ContentReader.exists('chords', slug);
    if (exists) {
      throw new Error(`Chord slug "${slug}" already exists.`);
    }

    const writeData = {
      displayName: data.displayName,
      voicingLabel: data.voicingLabel,
      baseFret: data.baseFret,
      fingering: data.fingering,
      frets: data.frets,
      notes: data.notes || [],
      alternateNames: data.alternateNames,
      barre: data.barre,
    };

    const cleanData = Object.fromEntries(
      Object.entries(writeData).filter(([_, value]) => value !== undefined)
    );

    const result = await writeContentFile({
      collection: 'chords',
      slug,
      data: cleanData,
    });

    return { id: result.slug, success: true };
  },

  /**
   * Deletes a chord entry file from disk by slug.
   * Throws if the slug does not exist, so the action can return a clear error.
   *
   * @param slug - The chord slug to delete e.g. 'am7-1'
   * @returns {{ id: string, success: boolean }}
   * @throws {Error} if no file is found for the slug
   */
  async deleteChord(slug: string) {
    const exists = await ContentReader.exists('chords', slug);
    if (!exists) {
      throw new Error(`Chord slug "${slug}" does not exist.`);
    }

    const result = await deleteContentFile({ collection: 'chords', slug });
    return { id: result.slug, success: true };
  },
};