
# Writty Live-Write Implementation Roadmap

This roadmap follows the **Live-Write Pattern** that's proven to work with chords, songs, and writings collections. It prioritizes establishing the live-write infrastructure first, then implementing collections in order of complexity.

## Phase 0: Live-Write Infrastructure
*Establish the shared infrastructure that all live-write collections depend on.*

- [x] **File Operations:** Create `src/utils/infra/fileOperator.ts` and `src/utils/infra/contentReader.ts` for centralized file system operations.
- [x] **Actions Pattern:** Establish Astro Actions pattern in `src/actions/index.ts` instead of API routes.
- [x] **Live-Write Template:** Create proven pattern for index pages using `fs.readdir()` + `gray-matter`.
- [x] **Form Reload Pattern:** Establish `window.location.reload()` pattern for immediate content visibility.

---

## Phase 1: Working Collections (Live-Write Pattern Proven)
*Collections already successfully implemented with live-write.*

- [x] **Chords Collection:** Complete live-write implementation with form validation and chord analysis integration.
- [x] **Songs Collection:** Complete live-write implementation with complex form fields and chord voicing references.
- [x] **Writings Collection:** Complete live-write implementation for poems, short stories, and dreams with unified form.

### Key Lessons from Working Collections:
1. **Index Pages Must Read Directly:** `fs.readdir()` + `gray-matter` is essential for live updates.
2. **Actions Over API Routes:** Astro Actions provide better integration and simpler error handling.
3. **No fs.utimes():** Not needed when index pages read from disk directly.
4. **Form Reload Timing:** 800-1000ms delay works reliably for content visibility.
5. **Reference Handling:** String references work fine in cards; no need for complex object resolution.

---

## Phase 2: Media & Enrichment Collections (Medium Complexity)
*Collections requiring external API integration and asset management.*

### Reviews Collection
- [ ] **Content Config:** Ensure reviews use `glob()` loader (verify existing setup).
- [ ] **Index Page:** Update `src/pages/reviews/index.astro` to use `fs.readdir()` pattern.
- [ ] **Enrichment Infra:** Move TMDB and download utilities to `src/utils/infra/`.
- [ ] **Review Service:** Create `src/services/reviews/ReviewService.ts` with TMDB enrichment.
- [ ] **Actions:** Add `createReview` action to `src/actions/index.ts`.
- [ ] **Review Form:** Create `src/components/reviews/ReviewCreateForm.astro` with TMDB search.
- [ ] **Review Card:** Update `src/components/collection-cards/ReviewCard.astro` for live-write pattern.

### Actors Collection  
- [ ] **Content Config:** Ensure actors use `glob()` loader (verify existing setup).
- [ ] **Index Page:** Update `src/pages/actors/index.astro` to use `fs.readdir()` pattern.
- [ ] **Actor Service:** Create `src/services/actors/ActorService.ts` with headshot enrichment.
- [ ] **Actions:** Add `createActor` action to `src/actions/index.ts`.
- [ ] **Actor Form:** Create `src/components/actors/ActorCreateForm.astro` with image handling.
- [ ] **Actor Card:** Update `src/components/collection-cards/ActorCard.astro` for live-write pattern.

---

## Phase 3: Complex Narrative Collections (High Complexity)
*Collections with cross-references and complex validation.*

### Projects Collection
- [ ] **Content Config:** Verify projects use `glob()` loader.
- [ ] **Index Page:** Update `src/pages/projects/index.astro` to use `fs.readdir()` pattern.
- [ ] **Project Service:** Create `src/services/projects/ProjectService.ts` with character list management.
- [ ] **Actions:** Add `createProject` action to `src/actions/index.ts`.
- [ ] **Project Form:** Create `src/components/projects/ProjectCreateForm.astro`.
- [ ] **Project Card:** Update `src/components/collection-cards/ProjectCard.astro`.

### Characters Collection
- [ ] **Content Config:** Verify characters use `glob()` loader.
- [ ] **Index Page:** Update `src/pages/characters/index.astro` to use `fs.readdir()` pattern.
- [ ] **Character Service:** Create `src/services/characters/CharacterService.ts` with project validation.
- [ ] **Actions:** Add `createCharacter` action to `src/actions/index.ts`.
- [ ] **Character Form:** Create `src/components/characters/CharacterCreateForm.astro` with project selection.
- [ ] **Character Card:** Update `src/components/collection-cards/CharacterCard.astro`.

### Scenes Collection
- [ ] **Content Config:** Verify scenes use `glob()` loader.
- [ ] **Index Page:** Update `src/pages/scenes/index.astro` to use `fs.readdir()` pattern.
- [ ] **Scene Service:** Create `src/services/scenes/SceneService.ts` with character/project validation.
- [ ] **Actions:** Add `createScene` action to `src/actions/index.ts`.
- [ ] **Scene Form:** Create `src/components/scenes/SceneCreateForm.astro` with rich text editor.
- [ ] **Scene Card:** Update `src/components/collection-cards/SceneCard.astro`.

---

## Phase 4: Domain Logic & Advanced Features
*Adding complex business logic while maintaining live-write pattern.*

- [ ] **Music Theory Domain:** Create `src/utils/domain/musicTheory.ts` for chord/song validation.
- [ ] **Script Analysis Domain:** Create `src/utils/domain/scriptAnalysis.ts` for scene calculations.
- [ ] **Reference Validation:** Add cross-collection validation in services (e.g., characters exist in projects).
- [ ] **Auto-Enrichment:** Integrate TMDB and other APIs into services for automatic metadata.
- [ ] **Live Statistics:** Add real-time analysis to forms using domain logic.

---

## Phase 5: Cleanup & Optimization
*Finalizing the live-write architecture and removing legacy code.*

- [ ] **Legacy API Routes:** Remove old `src/pages/api/` routes replaced by Actions.
- [ ] **Custom Loaders:** Remove any remaining custom loaders from `content.config.ts`.
- [ ] **getCollection() Cleanup:** Replace any remaining `getCollection()` calls with `fs.readdir()` pattern.
- [ ] **Performance Optimization:** Add caching for expensive operations in services.
- [ ] **Error Handling:** Standardize error messages and logging across all services.

---

## Implementation Checklist for Each Collection

When implementing a new collection, verify each of these:

| # | Component | Check | Pass Condition |
|---|---|---|---|
| 1 | `content.config.ts` | Uses `glob()` loader | Yes |
| 2 | Index Page | Reads with `fs.readdir` + `gray-matter` | Yes |
| 3 | Index Page | Has `export const prerender = false` | Yes |
| 4 | Action | `create[Collection]` defined in `actions/index.ts` | Yes |
| 5 | Service | Uses `writeContentFile()` and `ContentReader.exists()` | Yes |
| 6 | Service | Does NOT call `fs.utimes()` | Yes |
| 7 | Form | Calls `actions.create[Collection]()` | Yes |
| 8 | Form | Reloads on success with `window.location.reload()` | Yes |

---

## Quick Reference Commands

### Create a New Collection:
1. Add to `content.config.ts` with `glob()` loader
2. Update index page with `fs.readdir()` pattern  
3. Add action to `src/actions/index.ts`
4. Create service in `src/services/[collection]/`
5. Create form component
6. Update/create card component

### Debug Live-Write Issues:
- Check index page uses `fs.readdir()` not `getCollection()`
- Verify service doesn't call `fs.utimes()`
- Ensure form reloads with proper timing
- Check action returns proper success/error format