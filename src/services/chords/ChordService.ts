import { writeContentFile } from '../../utils/infra/fileOperator';
import { ContentReader } from '../../utils/infra/contentReader';

export const ChordService = {
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
    console.log('ChordService received params:', JSON.stringify(params, null, 2));
    
    const { slug, ...data } = params;
    console.log('Extracted data:', JSON.stringify(data, null, 2));

    // 1. Reference Check
    console.log('Checking if chord exists:', slug);
    const exists = await ContentReader.exists('chords', slug);
    if (exists) {
      throw new Error(`Chord slug "${slug}" already exists.`);
    }
    console.log('Chord does not exist, proceeding...');

    // 2. Write to disk
    // The data object here matches your Zod schema in content.config.ts
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
    
    // Remove undefined values to prevent YAML serialization errors
    const cleanData = Object.fromEntries(
      Object.entries(writeData).filter(([_, value]) => value !== undefined)
    );
    
    console.log('Writing data to file:', JSON.stringify(cleanData, null, 2));
    
    const result = await writeContentFile({
      collection: 'chords',
      slug,
      data: cleanData,
    });

    console.log('File written successfully:', result);
    return { id: result.slug, success: true };
  }
};