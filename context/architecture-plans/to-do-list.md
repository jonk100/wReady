
# Writty 5-Layer Migration Roadmap

This `todo.md` is structured using the **Vertical Slice** strategy. It prioritizes setting up the global "plumbing" first, then executing one full 5-layer path for a simple collection (Chords) before moving on to the more complex narrative and media collections.

## Phase 0: The Global Framework
*Establish the shared types and infrastructure that all layers will depend on.*

- [x] **API Response Type:** Create `src/types/api.ts` to define a standard `ApiResponse<T>` envelope.
- [x] **The "Hands" (Infra):** Create `src/utils/infra/fileOperator.ts` to centralize all `fs` operations (write, slug-check, directory creation).
- [ ] **Domain Cleanup:** Rename `src/utils/music/` to `src/utils/domain/music/` and audit `musicTheory.ts` to ensure it remains a pure logic file.
- [ ] **Environment Audit:** Update `.env` to use a unified `ALLOW_CONTENT_WRITE` flag.

---

## Phase 1: Vertical Slice - Chords (Low Complexity)
*A complete implementation of the 5-layer flow to test the architecture.*

- [x] **Chord Shaper (Domain):** ~~Create `src/services/chords/chordShaper.ts` to transform raw form data into a Zod-compliant frontmatter object.~~ **REVISED:** Not needed - simplified to direct field mapping in service layer.
- [x] **Chord Service (Service):** Create `src/services/chords/ChordService.ts` to orchestrate the shaper and the file operator.
- [x] **API Refactor (Transport):** Rewrite `src/pages/api/chords/create.ts` to use the new service and return the shared API response type.
- [x] **UI Update (Presentation):** Connect the Chord creation form to the new API endpoint.

### Lessons Learned from Chords Implementation:
1. **Contract Mismatch:** Initial service expected complex `ChordFormula` object but form sent flat strings. Fixed by simplifying service interface.
2. **YAML Serialization Error:** `undefined` values in data caused gray-matter to fail. Fixed by filtering out `undefined` values before file writing.
3. **Field Mapping:** Service must map form field names to schema field names exactly (e.g., `displayName` not `name`).
4. **Event Integration:** Form needs event listeners to catch data from `ChordAnalyser` component.
5. **Optional Fields:** Must handle optional fields (`barre`, `alternateNames`) consistently across all layers.

---

## Phase 2: Vertical Slice - Media & Enrichment (Medium Complexity)
*Integrating external APIs and asset management into the service layer.*

- [ ] **Enrichment Infra:** Move `scripts/enrich-tmdb.ts` and `scripts/utils/download.ts` into `src/utils/infra/`.
- [ ] **Review Service:** Create `src/services/reviews/ReviewService.ts`.
    - Logic: Fetch TMDB -> Download Poster -> Shape Frontmatter -> Save.
    - **IMPORTANT:** Apply lessons learned - filter undefined values, map fields exactly to schema
- [ ] **Actor Service:** Create `src/services/actors/ActorService.ts` to handle automated headshot downloads and metadata.
- [ ] **API Refactor:** Rewrite `src/pages/api/reviews/create.ts`.
    - **NOTE:** Add `export const prerender = false;` to all API routes
- [ ] **Review Form UI:** Create `src/components/reviews/ReviewCreateForm.astro` to handle TMDB search and manual data entry.
    - **UX Features:** TMDB autocomplete search, poster preview, loading states, error handling
    - **Content Editor:** Rich text area for review body/content with markdown preview
- [ ] **Poster Preview Component:** Create `src/components/reviews/PosterPreview.astro` to show downloaded poster before saving
- [ ] **TMDB Search Component:** Create `src/components/reviews/TMDBSearch.astro` for real-time movie/TV search with autocomplete
- [ ] **Review Status Indicator:** Add visual feedback for enrichment steps (TMDB fetch, poster download, save)

---

## Phase 3: Vertical Slice - Screenplay & Narrative (High Complexity)
*Implementing internal cross-references and complex text analysis.*

- [ ] **Script Analyst (Domain):** Create `src/utils/domain/screenplay/scriptAnalyst.ts` for Regex-based dialogue and page-count calculations.
- [ ] **Character Subdirectory Logic:** Update the `CharacterService` to enforce project-based nesting (`content/characters/[project-slug]/`).
- [ ] **Scene Service:** - Implement cross-collection validation (checking if Characters and Projects exist via Infra repos).
    - Integrate the Script Analyst for automatic frontmatter stats.
    - **CRITICAL:** Handle complex optional fields and references properly
- [ ] **API Refactor:** Rewrite `src/pages/api/scenes/create.ts`.

---

## Phase 4: Maintenance & Tooling
*Cleaning up legacy code and finalizing the directory structure.*

- [x] **API Route Prerender:** Add `export const prerender = false;` to all API routes (discovered during chord debugging)
- [ ] **Script Migration:** Move `.zsh` generation scripts from `scripts/` to a new `bin/` or `tools/` directory.
- [ ] **Legacy Cleanup:** Delete the `scripts/` folder once all TypeScript logic is safely inside `src/`.
- [ ] **Project Reference Audit:** Ensure all `scenes` are using the new Astro 5 `reference()` type in their frontmatter.

---

## Phase 5: UI Expansion (Post-Migration)
*Adding "Smart" features once the backend engine is stable.*

- [ ] **Live Editor Stats:** Import the **Domain** `scriptAnalyst.ts` into the `SceneCreateForm` for real-time line counting as the user types.
- [x] **Chord Previewer:** ~~Use the **Domain** `musicTheory.ts` to render visual fretboard diagrams in the chord creation UI.~~ **EXISTING:** ChordAnalyser component already provides this functionality
- [ ] **Tension Mapper:** Auto-generate tension graph coordinates during the `Beat` or `Scene` creation service.

---

## Additional Requirements Discovered:
- **Error Logging:** Add comprehensive logging to all services for debugging
- **Event Integration:** Ensure forms can catch events from analyzer components
- **Schema Validation:** Double-check all field mappings against content.config.ts
- **Optional Field Handling:** Standardize approach to undefined value filtering across all services