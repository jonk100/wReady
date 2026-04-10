import type { ChordFormula } from '../../utils/domain/musicTheory';

/**
 * Transforms raw form data into a structured object that 
 * matches the 'chords' collection schema.
 */
export function shapeChord(formData: {
  root: string;
  formula: ChordFormula;
  suffix?: string;
  notes?: string[];
}) {
  const { root, formula, suffix, notes } = formData;
  
  // The 'slug' is typically Root + Suffix (e.g., 'Cmaj7')
  const slug = `${root}${suffix || formula.abbreviation}`.replace('#', '-sharp');

  return {
    slug,
    data: {
      name: `${root} ${formula.name}`,
      root,
      quality: formula.quality,
      suffix: suffix || formula.abbreviation,
      intervals: formula.intervals,
      notes: notes || [], // You could use musicTheory.js to calculate these
    }
  };
}