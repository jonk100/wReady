# TODO - 5 layer architecture

## Summary

Based on the current state of your codebase (which relies on disparate scripts in `scripts/` and "vertical slice" logic in `src/pages/api/`) and the new 5-layer architectural goal, your TODO list should focus on migrating existing features into this structured framework.

Here is a strategic TODO list, ordered from foundational infrastructure to high-level creative tools.

### Phase 1: Foundational Infrastructure (Layer 4)
* [ ] **Create Shared API Utilities:** Consolidate the duplicated logic found in your current `songs/create.ts` and `chords/create.ts`.
    * `src/utils/infra/fileWriter.ts`: A unified tool to handle `fs.writeFile` with slug-collision checks.
    * `src/utils/infra/imageDownloader.ts`: Move logic from `scripts/utils/download.ts` into a version usable by your API.
    * `src/utils/infra/tmdb.ts`: Transform `scripts/enrich-tmdb.ts` into a reusable module.
* [ ] **Environment Variables:** Rename `ALLOW_CHORD_WRITE` to `ALLOW_CONTENT_WRITE` in `.env` and `astro.config.mjs` to make it collection-agnostic.

### Phase 2: Domain Logic Extraction (Layer 3)
* [ ] **Music Theory Engine:** Move the `CHORD_FORMULAS` and `SCALES` arrays from `src/consts.ts` into `src/utils/domain/music.ts`. Create functions like `getChordFingering(root, formula)`.
* [ ] **Screenplay Parser:** Create `src/utils/domain/screenplay.ts` to house the Regex-based dialogue counters and page-length estimators for your `scenes` collection.
* [ ] **Data Shapers:** Create `src/utils/domain/shapers/` to hold functions that turn raw form data into the exact MDX frontmatter strings required by your `content.config.ts` schemas.

### Phase 3: The Service Layer Migration (Layer 2)
* [ ] **ReviewService:** Create `src/services/ReviewService.ts`.
    * Integrate the "Enrichment" flow: Fetch TMDB -> Download Poster -> Format MDX -> Save.
* [ ] **SceneService:** Create `src/services/SceneService.ts`.
    * Integrate the "Validation" flow: Check Project existence -> Validate Characters -> Calculate Stats -> Save.
* [ ] **MusicService:** Create `src/services/MusicService.ts`.
    * Handle Chord and Song creation, ensuring songs only reference chords that exist.

### Phase 4: API & UI Refactoring (Layers 1 & 5)
* [ ] **Thin API Routes:** Refactor `src/pages/api/songs/create.ts` and `chords/create.ts` to be 20-line files that simply call the appropriate Service.
* [ ] **The "BaseForm" Component:** Create a generic `src/components/forms/BaseCreateForm.astro` that handles:
    * The "Draft/Review" toggle logic.
    * The POST request to the API.
    * The MDX preview window.
* [ ] **Collection Forms:** Rebuild `SongCreateForm.astro`, `ChordCreateForm.astro`, and `ReviewCreateForm.astro` using the `BaseForm` as a wrapper.

### Phase 5: Collection-Specific Enhancements
* [ ] **Character Creation:** Add a project-aware character form that saves files into `src/content/characters/[project-id]/`.
* [ ] **Scriptorium Integration:** Update your Astro site to use the **Domain Layer** music logic to show live chord diagrams on the frontend, ensuring the "math" matches the "data."

### Phase 6: Maintenance & Cleanup
* [ ] **Retire Legacy Scripts:** Once the Services are working, delete the redundant files in `scripts/` (like `enrich-tmdb.ts`) since that logic now lives in the app.
* [ ] **Validation Ledger:** Update your internal documentation to reflect that all Zod validation now happens at the "Domain" and "Infra" boundary.



[Image of a software development roadmap]


**Why this order?**
By starting with **Infrastructure**, you build the tools that the **Services** need to work. By ending with the **UI**, you ensure that when you finally build the forms, the entire engine behind them is already robust and tested.