# 5-Layer Character Creation Architecture

## Overview

In software design, the value of a 5-layer architecture isn't just about managing complexity; it’s about **predictability**. When every feature in your app follows the same "map," you never have to guess where a piece of logic lives. If you start making exceptions for "simple" things, you end up with a fragmented codebase where some features are clean and others are cluttered.

Here is how the 5-layer approach handles a character entry, specifically focusing on your requirement that it "belongs" to a project or subdirectory.

### 1. The Directory Strategy
Since characters are scoped to a project, your architecture needs to handle the file pathing logic.

```text
src/
├── services/
│   └── CharacterService.ts      <-- LAYER 2: Orchestrator
├── utils/
│   ├── domain/
│   │   └── character.ts         <-- LAYER 3: Data Shaper (Zod/MDX)
│   └── infra/
│       ├── projectRepo.ts       <-- LAYER 4: Folder/Project Validation
│       └── fileWriter.ts        <-- LAYER 4: File I/O
```

### 2. The 5-Layer Breakdown for Characters

#### Layer 5: UI (`CharacterCreateForm.astro`)
The form only needs to ask for the character's Name, Role, and a **Project Dropdown**. 
* **Role:** It gathers the inputs and `POST`s them. It doesn't know where the file is going to be saved.

#### Layer 1: Transport (`api/characters/create.ts`)
* **Role:** It receives the data, checks your `ALLOW_CONTENT_WRITE` permission, and hands the object to the `CharacterService`.

#### Layer 2: Service (`CharacterService.ts`)
This is where your "belongs to a project" logic is enforced.
* **Orchestration:** 1.  It calls the **ProjectRepo (Infra)** to verify the project folder exists.
    2.  It determines the target subdirectory (e.g., `src/content/characters/[project-id]/`).
    3.  It calls the **Character Domain (Domain)** to generate the frontmatter.
    4.  It tells the **FileWriter (Infra)** to save the file in that specific project folder.



#### Layer 3: Domain (`utils/domain/character.ts`)
* **Logic:** It handles the character-specific details. If you ever want to add "Archetype" or "Internal Goal" fields later, this is the only file that changes. It also generates the slug (e.g., "John Lennon" becomes `john-lennon.mdx`).

#### Layer 4: Infrastructure (`utils/infra/fileWriter.ts`)
* **Logic:** This remains your "dumb" tool. It just takes the path provided by the Service (`characters/minuet/john-lennon.mdx`) and the content string, and hits "save."

---

### Why this is better for "Simple" tasks

1.  **Uniform Error Handling:** If the `ProjectRepo` fails because a project folder is missing, the `CharacterService` catches it and sends a consistent error message back to the UI.
2.  **Subdirectory Flexibility:** By keeping the path logic in the **Service Layer**, you can easily change how you organize characters. If you decide later that characters should be in `projects/[id]/characters/` instead of a top-level folder, you only change one line in the Service.
3.  **Future-Proofing:** Even a "simple" character entry usually grows. You might eventually want to auto-link the character to a "Cast List" in the project's README. If you have a **Service Layer**, you just add that step to the orchestrator. If you didn't, you'd be cramming that logic into a "simple" API route.



### The "Subdirectory" logic
In your **Service Layer**, you can define a helper that ensures the character is tucked away correctly:

```typescript
// Inside CharacterService.ts
const projectFolder = formData.projectId; // e.g. "minuet"
const fileName = slugify(formData.name);  // e.g. "john-lennon.mdx"
const fullPath = `characters/${projectFolder}/${fileName}`;

return await FileWriter.save(fullPath, mdxContent);
```

By sticking to the 5-layer pattern, you treat your "simple" character entry with the same professional rigor as your "complex" scene analysis, making the whole system much more stable as you scale up your writing projects.