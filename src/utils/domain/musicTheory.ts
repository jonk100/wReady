/**
 * TYPE DEFINITIONS
 */

export type NoteName = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';

export type Quality = 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant' | 'suspended';

export interface Interval {
  name: string;
  shortName: string;
  semitones: number;
}

export interface ScaleFormula {
  name: string;
  intervals: number[]; // semitones from root
  degrees: string[];   // ["1", "2", "3", etc]
}

export interface ChordFormula {
  name: string;
  abbreviation: string;
  intervals: number[]; // e.g., [0, 4, 7] for Major
  quality: Quality;
}

export interface Key {
  root: NoteName;
  type: 'major' | 'minor';
  notes: NoteName[];
  diatonicChords: {
    degree: string; // I, ii, iii...
    chordName: string;
    quality: Quality;
  }[];
}

/**
 * CONSTANTS & DATA
 */

export const CHROMATIC_SCALE_SHARPS: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_SCALE_FLATS: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const INTERVALS: Record<string, Interval> = {
  P1: { name: 'Perfect Unison', shortName: 'R', semitones: 0 },
  m2: { name: 'Minor 2nd', shortName: 'b2', semitones: 1 },
  M2: { name: 'Major 2nd', shortName: '2', semitones: 2 },
  m3: { name: 'Minor 3rd', shortName: 'b3', semitones: 3 },
  M3: { name: 'Major 3rd', shortName: '3', semitones: 4 },
  P4: { name: 'Perfect 4th', shortName: '4', semitones: 5 },
  TT: { name: 'Tritone', shortName: 'b5', semitones: 6 },
  P5: { name: 'Perfect 5th', shortName: '5', semitones: 7 },
  m6: { name: 'Minor 6th', shortName: 'b6', semitones: 8 },
  M6: { name: 'Major 6th', shortName: '6', semitones: 9 },
  m7: { name: 'Minor 7th', shortName: 'b7', semitones: 10 },
  M7: { name: 'Major 7th', shortName: '7', semitones: 11 },
};

export const SCALES: Record<string, ScaleFormula> = {
  ionian: {
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ['1', '2', '3', '4', '5', '6', '7']
  },
  dorian: {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ['1', '2', 'b3', '4', '5', '6', 'b7']
  },
  aeolian: {
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7']
  },
  majorPentatonic: {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    degrees: ['1', '2', '3', '5', '6']
  },
  minorPentatonic: {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    degrees: ['1', 'b3', '4', '5', 'b7']
  }
};

export const CHORD_FORMULAS: ChordFormula[] = [
  { name: 'Major', abbreviation: '', intervals: [0, 4, 7], quality: 'major' },
  { name: 'Minor', abbreviation: 'm', intervals: [0, 3, 7], quality: 'minor' },
  { name: 'Diminished', abbreviation: 'dim', intervals: [0, 3, 6], quality: 'diminished' },
  { name: 'Major 7th', abbreviation: 'maj7', intervals: [0, 4, 7, 11], quality: 'major' },
  { name: 'Minor 7th', abbreviation: 'm7', intervals: [0, 3, 7, 10], quality: 'minor' },
  { name: 'Dominant 7th', abbreviation: '7', intervals: [0, 4, 7, 10], quality: 'dominant' },
  { name: 'Minor 7th Flat 5', abbreviation: 'm7b5', intervals: [0, 3, 6, 10], quality: 'diminished' },
];

/**
 * UTILITIES
 */

// A simple map of Roman Numerals for Major Keys
export const DIATONIC_MAJOR_MAP = [
  { degree: 'I', quality: 'major' },
  { degree: 'ii', quality: 'minor' },
  { degree: 'iii', quality: 'minor' },
  { degree: 'IV', quality: 'major' },
  { degree: 'V', quality: 'major' },
  { degree: 'vi', quality: 'minor' },
  { degree: 'vii°', quality: 'diminished' },
];