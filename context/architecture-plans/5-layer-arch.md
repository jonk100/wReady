# 5-Layer Architecture Guide: The "Writty" Framework

This document outlines the architectural standard for the Scriptorium/Writty project. It moves beyond simple file-saving toward a robust, scalable system for managing complex creative data (screenplays, music theory, and media reviews).

---

## The 5-Layer Stack

### 1. Transport Layer (The Gatekeeper)
**Location:** `src/pages/api/`
**Responsibility:** HTTP handling.
This is the "front door" for your web forms. It checks if the user is allowed to write content (via environment variables), parses the request, and hands it off to the Service Layer.
* **Key Rule:** No business logic or file-saving code here.
* **Example:** `api/scenes/create.ts` just extracts the JSON and calls the `SceneService`.

### 2. Service Layer (The Orchestrator)
**Location:** `src/services/`
**Responsibility:** Coordination and Workflow.
The "brain" of the operation. It manages multi-step processes that involve different parts of the system.
* **Key Rule:** If an action affects more than one file or requires an external API (like TMDB), it lives here.
* **Example:** `ReviewService.ts` fetches metadata from TMDB, downloads the poster, and then tells the file writer to save the MDX.

### 3. Domain Layer (The Truth)
**Location:** `src/utils/domain/` or `src/utils/api/collections/`
**Responsibility:** Pure Logic and Data Shaping.
This layer knows the "rules" of your world. It doesn't know about the internet or your hard drive; it only knows about music theory, screenplay formatting, or Zod schemas.
* **Key Rule:** Must be "Pure"—input in, data out. No side effects.
* **Example:** `musicLogic.ts` calculates chords. `scriptAnalysis.ts` counts dialogue lines and estimates page counts.

### 4. Infrastructure Layer (The Hands)
**Location:** `src/utils/infra/`
**Responsibility:** Technical Execution (I/O).
This layer handles the "dirty work" of talking to the outside world—the file system, external APIs, or databases.
* **Key Rule:** These tools are "dumb." They don't know *what* they are saving, only *where* and *how*.
* **Example:** `fileWriter.ts` saves a string to a path. `tmdb.ts` performs the actual network fetch.

### 5. Presentation Layer (The UI)
**Location:** `src/components/forms/`
**Responsibility:** User Input and Feedback.
The Astro components that the user interacts with. 
* **Key Rule:** Keep logic out of the `.astro` file. It should only collect data and display success/error messages.
* **Example:** `SceneCreateForm.astro`.

---

## Mapping Your Collections

Here is how your existing Tiered Content System fits into this 5-layer flow:

| Collection Tier | Domain Logic (Layer 3) | Service Task (Layer 2) |
| :--- | :--- | :--- |
| **Reviews / Actors** | Zod validation; Actor/Role mapping | **Enrichment:** Auto-fetch TMDB data and download posters/headshots. |
| **Chords / Songs** | **Music Theory:** Interval calculations, fretboard logic, and transposition. | **Validation:** Ensure chords used in a Song exist in the `chords` collection. |
| **Screenplay (Scenes/Beats)** | **Analysis:** Page count estimation, dialogue counting, and tension graph data. | **Continuity:** Verify characters present are linked to the specific Project. |
| **Project Entities** | Path logic (determining subdirectories like `characters/minuet/`). | **Index Management:** Update the Project's "Cast List" when a character is added. |

---

## Why This Matters for Your Project

### 1. Narrative Continuity
When you create a `scene`, the **Service Layer** can cross-reference your `characters` collection. If you try to add "John Lennon" to a scene in a project where he hasn't been created yet, the service can stop the process or auto-create a stub.

### 2. Automated Enrichment
Your existing scripts for TMDB and Actor enrichment are currently separate. In 5-layer architecture, these become **Infrastructure** tools that the **ReviewService** calls automatically every time you submit a form.

### 3. "Pure" Music Theory
By moving music math to the **Domain Layer**, you can build a "Scale Previewer" or "Chord Finder" in the UI that uses the exact same logic as your `chord` creation API. You write the math once, and use it everywhere.

### 4. Future-Proofing
If you ever move from `.mdx` files to a database (like PostgreSQL), you **only** change the **Infrastructure Layer** (`fileWriter.ts` becomes `dbClient.ts`). The rest of your app—your services, your music logic, and your forms—remains exactly the same.