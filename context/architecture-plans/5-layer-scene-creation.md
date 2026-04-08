# 5-Layer Scene Creation Architecture

## Overview

For a complex task like scene creation—which involves cross-referencing other files (characters and projects) and performing analytical calculations (dialogue and page counts)—the 5-layer architecture provides a clear "chain of command."

Each layer takes on one specific part of your requirements to ensure the logic doesn't get tangled.

### 1. The Directory Map
```text
src/
├── components/
│   └── SceneCreateForm.astro       <-- LAYER 5: UI (Form & Preview)
├── pages/
│   └── api/
│       └── scenes/
│           └── create.ts            <-- LAYER 1: Transport (Gatekeeper)
├── services/
│   └── SceneService.ts             <-- LAYER 2: Service (The Orchestrator)
├── utils/
│   └── domain/
│       └── scriptAnalysis.ts       <-- LAYER 3: Domain (The "Math" & Parsing)
└── utils/
    └── infra/
        ├── projectRepo.ts          <-- LAYER 4: Infra (Project Validation)
        ├── characterRepo.ts        <-- LAYER 4: Infra (Character Validation)
        └── fileWriter.ts           <-- LAYER 4: Infra (Disk I/O)
```



---

### 2. How the Layers Solve Your Requirements

#### Requirement A: Validate Project & Characters (The Infrastructure Layer)
The **Infrastructure Layer** acts as the librarian. It doesn't know *why* you are checking for a character; it just knows how to look them up.
* **`projectRepo.ts`**: Contains a function `exists(projectId)` that checks if the corresponding folder exists in `src/content/`.
* **`characterRepo.ts`**: Contains `validateList(names[])` which scans your characters collection to ensure every person mentioned in the scene heading actually has a profile file.

#### Requirement B: Count Dialogue & Estimate Pages (The Domain Layer)
The **Domain Layer** is the "Script Expert." It contains pure logic that doesn't need a database or a file system to run.
* **`scriptAnalysis.ts`**: 
    * **Dialogue Counter**: Uses Regex to identify character names followed by blocks of text. It returns an object: `{ "John": 12, "Paul": 8 }`.
    * **Page Estimator**: Applies industry standards (e.g., average lines per page for screenplay formatting) to the total character count of the MDX body to return a float (e.g., `2.5 pages`).

#### Requirement C: The "Director" (The Service Layer)
The **Service Layer** is where the actual "workflow" lives. It coordinates the others to fulfill the request.



**The `SceneService.createScene()` logic would look like this:**
1.  **Check Project:** Calls `ProjectRepo` to ensure the project ID is valid.
2.  **Check Characters:** Calls `CharacterRepo` to verify the "Characters Present" list.
3.  **Analyze Script:** Sends the raw MDX text to the **Domain Layer** to get the dialogue stats and page count.
4.  **Collate Data:** Combines the user's form data with the new stats (dialogue/page counts) into a final frontmatter object.
5.  **Write File:** Tells the `FileWriter` to save the `.mdx` file.

---

### 3. The Code Flow Example

This is a conceptual look at how the **Service Layer** (the most important part) handles your specific requirements:

```typescript
// src/services/SceneService.ts
export const SceneService = {
  async createScene(formData) {
    // 1. Requirement: Validate Project Exists (Infra)
    const projectValid = await ProjectRepo.exists(formData.projectId);
    if (!projectValid) throw new Error("Project not found");

    // 2. Requirement: Validate Characters (Infra)
    const invalidChars = await CharacterRepo.findMissing(formData.characters);
    if (invalidChars.length > 0) throw new Error(`Unknown characters: ${invalidChars.join(', ')}`);

    // 3. Requirement: Analyze Text (Domain)
    const stats = ScriptAnalysis.parse(formData.bodyText); 
    // stats = { dialogueCounts: {...}, pageEstimate: 1.2 }

    // 4. Shape the Frontmatter (Domain)
    const mdxContent = SceneCollection.format({
      ...formData,
      dialogueStats: stats.dialogueCounts,
      pageCount: stats.pageEstimate
    });

    // 5. Final Save (Infra)
    return await FileWriter.save(`scenes/${formData.slug}.mdx`, mdxContent);
  }
}
```

### Why this is superior for screenwriting:
By separating the **Domain Layer** (the script analysis), you can eventually build a "Live Preview" in your **UI Layer** (`SceneCreateForm.astro`). As you type your scene, the form can hit a small "Preview" API that calls the exact same `ScriptAnalysis` logic to show you the page count and dialogue stats in real-time *before* you even click save. 

This keeps your "writing tools" consistent across the entire application. Does this handle the specific validations you were looking for?