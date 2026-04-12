/**
 * chordUtils.ts
 */

import { CHROMATIC_SCALE_SHARPS, DIATONIC_MAJOR_MAP } from "./musicTheory";

export function extractChordRoot(name: string): string {
  return name.split(" ")[0];
}

export function getChordFunction(root: string, key: string) {
  const keyIndex = CHROMATIC_SCALE_SHARPS.indexOf(key as any);
  const chordIndex = CHROMATIC_SCALE_SHARPS.indexOf(root as any);

  if (keyIndex === -1 || chordIndex === -1) {
    return { degree: "unknown", quality: "major" };
  }

  const interval = (chordIndex - keyIndex + 12) % 12;
  const diatonicIndex = Math.floor(interval / 2);

  return DIATONIC_MAJOR_MAP[diatonicIndex] ?? {
    degree: "unknown",
    quality: "major",
  };
}

// Types for chord analysis
export interface BarreData {
  finger: number;
  fret: number;
  strings: [number, number];
}

export interface ChordShape {
  suffix: number;
  name: string;
  description: string;
  detectPattern: (frets: number[]) => boolean;
  generateFingering: (frets: number[], chordName?: string) => number[];
  generateBarre?: (frets: number[]) => BarreData | null;
}

// Helper function to detect chord type from name
function detectChordType(chordName: string): 'major' | 'minor' | '7' | 'other' {
  const name = chordName.toLowerCase();
  
  if (name.includes('m') && !name.includes('maj') && !name.includes('ma')) {
    // Check for minor (but not major)
    if (name.includes('m7') || name.includes('min7')) {
      return '7';
    }
    return 'minor';
  }
  
  if (name.includes('7') && !name.includes('maj7') && !name.includes('ma7')) {
    return '7';
  }
  
  if (name.includes('maj') || name.includes('ma')) {
    return 'major';
  }
  
  // Default to major for simple chord names (like "G", "A", etc.)
  return 'major';
}

// Common chord shapes with proper fingerings
export const CHORD_SHAPES: ChordShape[] = [
  {
    suffix: 0,
    name: "Open",
    description: "Open chord voicing (no barre)",
    detectPattern: (frets: number[]) => {
      const nonOpenStrings = frets.filter(f => f > 0);
      return nonOpenStrings.length === 0 || 
             (nonOpenStrings.length > 0 && !hasBarrePattern(frets));
    },
    generateFingering: (frets: number[], chordName?: string) => {
      // Basic open chord fingering
      return frets.map((fret, index) => {
        if (fret === -1) return -1; // muted
        if (fret === 0) return 0;  // open
        
        // Simple approach: use fingers 1-4 for fretted strings
        const frettedStrings = frets.filter(f => f > 0);
        const fretIndex = frettedStrings.indexOf(fret);
        return Math.min(fretIndex + 1, 4);
      });
    }
  },
  {
    suffix: 1,
    name: "E-Shape",
    description: "E-shape barre chord (root on 6th/low E string)",
    detectPattern: (frets: number[]) => {
      // E-shape detection: Look for characteristic E-shape barre patterns
      // Major pattern: [root, root+2, root+2, root+1, root, root] (e.g., G major: [3, 5, 5, 4, 3, 3])
      // Minor pattern: [root, root+2, root+2, root, root, root] (e.g., G minor: [3, 5, 5, 3, 3, 3])
      // 7th pattern: [root, root+2, root, root+1, root, root] (e.g., G7: [3, 5, 3, 4, 3, 3])
      
      const lowEString = frets[0];
      if (lowEString <= 0) {
        console.log('E-Shape detection: Low E string not fretted');
        return false;
      }
      
      // Check for E-shape characteristic patterns
      const aString = frets[1];
      const dString = frets[2];
      const gString = frets[3];
      const bString = frets[4];
      const highEString = frets[5];
      
      const rootFret = lowEString;
      
      // Check major pattern: [root, root+2, root+2, root+1, root, root]
      const matchesMajorPattern = (
        aString === rootFret + 2 &&
        dString === rootFret + 2 &&
        gString === rootFret + 1 &&
        bString === rootFret &&
        highEString === rootFret
      );
      
      // Check minor pattern: [root, root+2, root+2, root, root, root]
      const matchesMinorPattern = (
        aString === rootFret + 2 &&
        dString === rootFret + 2 &&
        gString === rootFret &&
        bString === rootFret &&
        highEString === rootFret
      );
      
      // Check 7th pattern: [root, root+2, root, root+1, root, root]
      const matches7thPattern = (
        aString === rootFret + 2 &&
        dString === rootFret &&
        gString === rootFret + 1 &&
        bString === rootFret &&
        highEString === rootFret
      );
      
      const matchesPattern = matchesMajorPattern || matchesMinorPattern || matches7thPattern;
      
      console.log('E-Shape detection:', { 
        frets, 
        rootFret, 
        majorExpected: [rootFret, rootFret + 2, rootFret + 2, rootFret + 1, rootFret, rootFret],
        minorExpected: [rootFret, rootFret + 2, rootFret + 2, rootFret, rootFret, rootFret],
        seventhExpected: [rootFret, rootFret + 2, rootFret, rootFret + 1, rootFret, rootFret],
        matchesMajorPattern,
        matchesMinorPattern,
        matches7thPattern,
        matchesPattern 
      });
      
      return matchesPattern;
    },
    generateFingering: (frets: number[], chordName?: string) => {
      const chordType = chordName ? detectChordType(chordName) : 'major';
      console.log('Generating E-shape fingering:', { chordName, chordType, frets });
      
      const result = frets.map((fret, index) => {
        if (fret === -1) return -1; // muted
        if (fret === 0) return 0;  // open
        
        // E-shape pattern: [root, root+2, root+2, root+1, root, root]
        // Generate fingering based on position in pattern and chord type
        
        if (chordType === 'major') {
          // Major: 1,3,4,2,1,1
          if (index === 0 && fret > 0) return 1; // Low E (barre/root)
          if (index === 1 && fret > 0) return 3; // A string (3rd)
          if (index === 2 && fret > 0) return 4; // D string (5th)
          if (index === 3 && fret > 0) return 2; // G string (octave)
          if (index === 4 && fret > 0) return 1; // B string (barre)
          if (index === 5 && fret > 0) return 1; // High E (barre)
        } else if (chordType === 'minor') {
          // Minor: 1,3,4,1,1,1
          if (index === 0 && fret > 0) return 1; // Low E (barre/root)
          if (index === 1 && fret > 0) return 3; // A string (minor 3rd)
          if (index === 2 && fret > 0) return 4; // D string (5th)
          if (index === 3 && fret > 0) return 1; // G string (barre/minor 3rd)
          if (index === 4 && fret > 0) return 1; // B string (barre)
          if (index === 5 && fret > 0) return 1; // High E (barre)
        } else if (chordType === '7') {
          // 7th: 1,3,1,2,1,1 (for pattern [root, root+2, root, root+1, root, root])
          if (index === 0 && fret > 0) return 1; // Low E (barre/root)
          if (index === 1 && fret > 0) return 3; // A string (3rd)
          if (index === 2 && fret > 0) return 1; // D string (barre/flat 7th)
          if (index === 3 && fret > 0) return 2; // G string (5th)
          if (index === 4 && fret > 0) return 1; // B string (barre)
          if (index === 5 && fret > 0) return 1; // High E (barre)
        }
        
        return 2; // Default fallback
      });
      
      console.log('Final fingering result:', result);
      return result;
    },
    generateBarre: (frets: number[]) => detectBarrePattern(frets)
  },
  {
    suffix: 2,
    name: "A-Shape",
    description: "A-shape barre chord (root on 5th/A string)",
    detectPattern: (frets: number[]) => {
      const barreInfo = detectBarrePattern(frets);
      const includesString1 = barreInfo !== null && barreInfo.strings.includes(1);
      const excludesString0 = barreInfo !== null && !barreInfo.strings.includes(0);
      console.log('A-Shape detection:', { barreInfo, includesString1, excludesString0 });
      return includesString1 && excludesString0;
    },
    generateFingering: (frets: number[], chordName?: string) => {
      const barreInfo = detectBarrePattern(frets);
      if (!barreInfo) return generateBasicFingering(frets);
      
      return frets.map((fret, index) => {
        if (fret === -1) return -1; // muted
        if (fret === 0) return 0;  // open
        
        // Barre finger (1) on A-D-G strings typically
        if (fret === barreInfo.fret && 
            index >= barreInfo.strings[0] && 
            index <= barreInfo.strings[1]) {
          return 1;
        }
        
        // A-shape specific fingering
        if (fret === barreInfo.fret + 2 && index === 4) return 3; // B string
        if (fret === barreInfo.fret + 2 && index === 5) return 4; // high E string
        
        return 2; // Default for other strings
      });
    },
    generateBarre: (frets: number[]) => detectBarrePattern(frets)
  },
  {
    suffix: 3,
    name: "D-Shape",
    description: "D-shape barre chord (root on 4th/D string)",
    detectPattern: (frets: number[]) => {
      const barreInfo = detectBarrePattern(frets);
      return barreInfo !== null && 
             barreInfo.strings.includes(2) && 
             !barreInfo.strings.includes(0) && 
             !barreInfo.strings.includes(1);
    },
    generateFingering: (frets: number[], chordName?: string) => {
      const barreInfo = detectBarrePattern(frets);
      if (!barreInfo) return generateBasicFingering(frets);
      
      return frets.map((fret, index) => {
        if (fret === -1) return -1; // muted
        if (fret === 0) return 0;  // open
        
        // Partial barre on D-G-B strings
        if (fret === barreInfo.fret && 
            index >= barreInfo.strings[0] && 
            index <= barreInfo.strings[1]) {
          return 1;
        }
        
        // D-shape specific fingering
        if (fret === barreInfo.fret + 2 && index === 5) return 4; // high E string
        
        return 2; // Default for other strings
      });
    },
    generateBarre: (frets: number[]) => detectBarrePattern(frets)
  }
];

// Helper functions
function hasBarrePattern(frets: number[]): boolean {
  const nonOpenStrings = frets.map((fret, index) => ({ fret, index })).filter(item => item.fret > 0);
  if (nonOpenStrings.length < 2) return false;
  
  const lowestFret = Math.min(...nonOpenStrings.map(item => item.fret));
  const stringsAtLowestFret = nonOpenStrings.filter(item => item.fret === lowestFret);
  
  return stringsAtLowestFret.length >= 2;
}

function detectBarrePattern(frets: number[]): BarreData | null {
  const nonOpenStrings = frets.map((fret, index) => ({ fret, index })).filter(item => item.fret > 0);
  
  console.log('Non-open strings:', nonOpenStrings);
  
  if (nonOpenStrings.length === 0) return null;
  
  const lowestFret = Math.min(...nonOpenStrings.map(item => item.fret));
  const stringsAtLowestFret = nonOpenStrings.filter(item => item.fret === lowestFret);
  
  console.log('Lowest fret:', lowestFret, 'Strings at lowest fret:', stringsAtLowestFret);
  
  if (stringsAtLowestFret.length >= 2) {
    const barreStrings = stringsAtLowestFret.map(item => item.index + 1); // Convert to 1-based
    const barreData = {
      finger: 1,
      fret: lowestFret,
      strings: [Math.min(...barreStrings), Math.max(...barreStrings)] as [number, number]
    };
    console.log('Barre detected:', barreData);
    console.log('Strings at lowest fret details:', stringsAtLowestFret.map(item => ({ index: item.index, string: item.index + 1, fret: item.fret })));
    return barreData;
  }
  
  console.log('No barre pattern detected');
  return null;
}

function generateBasicFingering(frets: number[]): number[] {
  return frets.map((fret, index) => {
    if (fret === -1) return -1; // muted
    if (fret === 0) return 0;  // open
    
    // Simple approach: assign fingers 1-4 sequentially
    const frettedStrings = frets.filter(f => f > 0);
    const fretIndex = frettedStrings.indexOf(fret);
    return Math.min(fretIndex + 1, 4);
  });
}

// Main analysis functions
export function analyzeChordShape(frets: number[]): ChordShape | null {
  console.log('Analyzing chord shape for frets:', frets);
  
  for (const shape of CHORD_SHAPES) {
    const matches = shape.detectPattern(frets);
    console.log(`Testing ${shape.name} (suffix ${shape.suffix}):`, matches);
    if (matches) {
      console.log(`Matched shape: ${shape.name} with suffix ${shape.suffix}`);
      return shape;
    }
  }
  
  // Default to open shape if no pattern matches
  console.log('No shape matched, defaulting to Open (suffix 0)');
  return CHORD_SHAPES[0];
}

export function generateChordSuffix(frets: number[]): number {
  const shape = analyzeChordShape(frets);
  return shape ? shape.suffix : 0;
}

export function generateChordFingering(frets: number[], chordName?: string): number[] {
  const shape = analyzeChordShape(frets);
  return shape ? shape.generateFingering(frets, chordName) : generateBasicFingering(frets);
}

export function generateChordBarre(frets: number[]): BarreData | null {
  const shape = analyzeChordShape(frets);
  if (shape && shape.generateBarre) {
    return shape.generateBarre(frets);
  }
  return null;
}