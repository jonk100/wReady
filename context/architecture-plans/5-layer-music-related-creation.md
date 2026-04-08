# 5-Layer Music-Related Creation Architecture

## Overview

Moving to a 5-layer architecture for chords and songs isn't just about "over-engineering"—it's about giving your music logic a dedicated home.

If you keep them as 3 layers, your "math" (intervals, scale degrees, fretboard logic) gets tangled up with your "file saving" logic. 

Here is how the 5-layer architecture would look specifically for your **Music Theory** tools:

### 1. The Music Theory Directory Map
```text
src/
├── services/
│   ├── ChordService.ts          <-- LAYER 2: Orchestrator
│   └── SongService.ts           
├── utils/
│   ├── domain/
│   │   └── musicLogic.ts        <-- LAYER 3: The "Brain" (Pure Theory)
│   └── infra/
│       └── fileWriter.ts        <-- LAYER 4: The "Hand" (Disk I/O)
```



---

### 2. Why Music Theory *Needs* a Domain Layer (Layer 3)
In your current codebase, you have complex arrays for intervals and degrees. In a 5-layer setup, `musicLogic.ts` becomes your **Domain Layer**. It doesn't care about Astro or MDX files; it only cares about the "truth" of music.

* **The Job:** You give it a root note and a formula (e.g., "C" and "Major 7"), and it returns the intervals (`[0, 4, 7, 11]`) and the notes (`[C, E, G, B]`).
* **The Benefit:** You can use this exact same logic to build a "Fretboard Visualizer" component later. Since the logic isn't stuck inside an API route, it’s a "pure" tool you can import anywhere.



---

### 3. The "Song Service" Orchestration (Layer 2)
Creating a song is more than just saving a title. A **SongService** can handle the heavy lifting:

* **Requirement:** Ensure the `key` and `mode` are valid before saving.
* **Requirement:** Automatically calculate the "related keys" or "chord palette" for the song based on the key.
* **Requirement:** If the user adds a chord to a song that doesn't exist in your `chords/` collection yet, the Service could flag a warning or even auto-create a "stub" for that chord.

---

### 4. Consistency is the Ultimate "Pro" Move
The biggest reason to go 5-layer for everything is **Developer Velocity**. 

Once you’ve built the 5-layer structure for **Reviews** and **Scenes**, your brain will start "thinking" in those layers. If you switch back to a 3-layer "vertical slice" for **Chords**, you’ll find yourself constantly asking: *"Wait, where did I put the slug validation for this one? Is it in the API route or a helper?"*

**In a 5-layer project:**
* **Validation** is always in Layer 1 (Transport) or Layer 4 (Infra).
* **Orchestration** is always in Layer 2 (Service).
* **Calculations/Formulas** are always in Layer 3 (Domain).
* **Disk Access** is always in Layer 4 (Infra).

### Example: Creating a "Power Chord"
1.  **UI:** You select "G" and "Power Chord" on the form.
2.  **API:** Receives the request and calls `ChordService.createChord()`.
3.  **Service:** Calls **MusicLogic** (Domain) to get the frets/fingering for a G5 chord.
4.  **Domain:** Returns `{ frets: [3, 5, 5, null, null, null], intervals: ['1', '5'] }`.
5.  **Service:** Takes that data, formats the MDX, and hands it to the **FileWriter**.
6.  **Infra:** Saves `src/content/chords/g5.mdx`.

By treating a "simple" chord with the same architectural respect as a "complex" scene, you're building a professional-grade creative engine that won't break when you decide to add 100 more songs or a guitar-fretboard generator.