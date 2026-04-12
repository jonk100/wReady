# 5-Layer Architecture Guide: The "Writty" Framework

This document outlines the architectural standard for the Scriptorium/Writty project. It moves beyond simple file-saving toward a robust, scalable system for managing complex creative data (screenplays, music theory, and media reviews).

---

## The 5-Layer Stack

### [1. Transport Layer (The Gatekeeper)](./layer-1-transport.md)
**Location:** `src/pages/api/`
**Responsibility:** HTTP handling.
This is the "front door" for your web forms. It checks if the user is allowed to write content (via environment variables), parses the request, and hands it off to the Service Layer.
* **Key Rule:** No business logic or file-saving code here.
* **Example:** `api/scenes/create.ts` just extracts the JSON and calls the `SceneService`.

### [2. Service Layer (The Orchestrator)](./layer-2-service.md)
**Location:** `src/services/`
**Responsibility:** Coordination and Workflow.
The "brain" of the operation. It manages multi-step processes that involve different parts of the system.
* **Key Rule:** If an action affects more than one file or requires an external API (like TMDB), it lives here.
* **Example:** `ReviewService.ts` fetches metadata from TMDB, downloads the poster, and then tells the file writer to save the MDX.

### [3. Domain Layer (The Truth)](./layer-3-domain.md)
**Location:** `src/utils/domain/` or `src/utils/api/collections/`
**Responsibility:** Pure Logic and Data Shaping.
This layer knows the "rules" of your world. It doesn't know about the internet or your hard drive; it only knows about music theory, screenplay formatting, or Zod schemas.
* **Key Rule:** Must be "Pure"—input in, data out. No side effects.
* **Example:** `musicLogic.ts` calculates chords. `scriptAnalysis.ts` counts dialogue lines and estimates page counts.

### [4. Infrastructure Layer (The Hands)](./layer-4-infrastructure.md)
**Location:** `src/utils/infra/`
**Responsibility:** Technical Execution (I/O).
This layer handles the "dirty work" of talking to the outside world—the file system, external APIs, or databases.
* **Key Rule:** These tools are "dumb." They don't know *what* they are saving, only *where* and *how*.
* **Example:** `fileWriter.ts` saves a string to a path. `tmdb.ts` performs the actual network fetch.

### [5. Presentation Layer (The UI)](./layer-5-presentation.md)
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

## Another context

To help you build out this framework, here is an expanded deep dive into each layer. These examples specifically draw from your project's dual nature: **Technical/Music Data** and **Narrative/Creative Writing**.

---

### 1. Transport Layer (The Gatekeeper)
**File Context:** `src/pages/api/...`

This layer is the only part of your code that "speaks" HTTP. It handles the messy reality of the web so your internal logic doesn't have to.

* **Request Sanitization:** It takes `FormData` or `JSON` and cleans it up. If a user leaves a field blank, the Transport layer decides if that should be a `null` or an empty string before passing it on.
* **Status Code Logic:** It decides whether to send a `201 Created`, a `401 Unauthorized`, or a `400 Bad Request`.
* **Examples:**
    * **The Guard:** Checking `process.env.NODE_ENV` to ensure the "Create Scene" button only works on your local machine and isn't accessible once you deploy the site.
    * **The Parser:** Converting a checkbox in your `SongForm` (which comes as the string `"on"`) into a proper boolean `true` for your database/file.



---

### 2. Service Layer (The Orchestrator)
**File Context:** `src/services/...`

The Service Layer is the "Command Center." It manages the **side effects** of an action. In a creative project, saving a file is rarely the only thing that needs to happen.

* **The "Workflow" Manager:** It coordinates between the external world (Infra) and your internal rules (Domain).
* **Examples:**
    * **The Script Supervisor (`SceneService`):** When you save a scene, the service first asks the `ProjectRepo` if the project exists. Then it asks the `CharacterRepo` to verify the actors. Finally, it tells the `FileWriter` to save. If any step fails, the Service manages the "rollback."
    * **The Music Librarian (`SongService`):** When creating a song, it could check if the specified "Key" and "Scale" are compatible. If you're writing a song in "G Major" but use a "C#" chord, the service might flag a warning in the response.



---

### 3. Domain Layer (The Truth)
**File Context:** `src/utils/domain/...`

This is the most important layer for a project like yours. It houses the "Laws of Physics" for your music and stories. It should be able to run in a tiny script without any web server or file system.

* **Pure Logic:** No `fetch`, no `fs.writeFile`. Just inputs and outputs.
* **Examples:**
    * **The Music Mathematician (`musicLogic.ts`):** A function that takes a "Root Note" and an "Interval Map" and returns a list of frequencies or fret positions. This is where your `CHORD_FORMULAS` from `consts.ts` should live.
    * **The Narrative Analyst (`scriptAnalysis.ts`):** A function that takes a string of text and uses Regex to find every word in ALL CAPS followed by a newline. It identifies these as "Characters" and counts the words following them as "Dialogue." It returns a statistical object: `{ "BEATLES": 450, "PRESS": 120 }`.



---

### 4. Infrastructure Layer (The Hands)
**File Context:** `src/utils/infra/...`

Infra is about **Implementation Details**. It doesn't care about your story; it only cares about the technical task of moving data.

* **The "Plug":** It connects your app to your hard drive or the internet.
* **Examples:**
    * **The File System Wrapper (`fileWriter.ts`):** Instead of calling `fs.writeFileSync` everywhere, you call `FileWriter.save()`. This allows you to centralize logic like "always add a timestamp to the filename" or "ensure the folder exists before saving."
    * **The Media Client (`tmdb.ts`):** This is where you put the API Key and the specific URL for TMDB. If TMDB changes their API from version 3 to version 4, you only have to change this one file.
    * **The Asset Manager (`imageDownloader.ts`):** This takes a URL like `https://image.tmdb.org/...` and streams it into your `public/posters/` folder.



---

### 5. Presentation Layer (The UI)
**File Context:** `src/components/forms/...`

This is where the user "feels" the architecture. Because you’ve separated the layers, your UI components become much smarter and more interactive.

* **The "Real-Time" Feed:** Because the **Domain Layer** is separate, you can import it directly into your Astro component's client-side script.
* **Examples:**
    * **Live Previewing:** As you type a scene into the `SceneForm`, the component calls the `scriptAnalysis` logic (Domain) every 500ms. The user sees a live "Page Count" and "Reading Time" update in the sidebar without hitting "Save."
    * **Smart Selection:** In your `CharacterForm`, the "Project" dropdown is populated by a list provided by the `ProjectRepo` (Infra). When a project is selected, the form might automatically change the "Subdirectory" hint to match.

### Summary of the "Chain of Command"
1.  **UI** captures the text: "EXT. LONDON - DAY".
2.  **Transport** receives it and says: "This is a valid POST request for a Scene."
3.  **Service** says: "Okay, I'll validate the characters, get the page count from the **Domain**, and then tell the **Infra** to save it."
4.  **Domain** says: "Based on the text length, that is 0.5 pages."
5.  **Infra** says: "I have successfully written `london-day.mdx` to the disk."
6.  **UI** displays: "Scene Saved! Estimated length: 30 seconds."