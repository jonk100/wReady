# Layer 2: Service

## Overview
The **Service Layer** is the "Orchestrator" or the "Project Manager." It doesn't do the heavy math (Domain) and it doesn't save the files (Infra). Instead, it tells everyone else when it’s their turn to work.

### 1. It manages "Workflows"
Most actions in your project have multiple steps. A Service coordinates them into a single "Use Case."
* **The "Review" Workflow:** 1. Tell Infra to fetch TMDB data. 2. Tell Infra to download the image. 3. Tell Domain to shape the MDX. 4. Tell Infra to save the file. 

### 2. It enforces "Business Rules"
Services ensure that the "rules of your world" are followed across different collections.
* **Example:** In the `SceneService`, it ensures that every character you’ve listed in a scene actually exists in your character database before allowing the file to be saved.

### 3. It handles "Side Effects"
Sometimes saving one thing means updating another.
* **Example:** When you create a new `Character`, the `CharacterService` might automatically update the `Project`'s "Cast List" file so you don't have to do it manually.

### Why we separate it
Separating the Service layer prevents "Fat API Routes." It allows you to keep the logic for *how* a screenplay is processed in one central place. If you decide to add an automated "Tone Analysis" every time you save a scene, you only have to add one line to the `SceneService` instead of hunting through every API route in your project.