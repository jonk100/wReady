# Layer 1: Infrastructure

## Overview

In the context of software architecture (and your specific 5-layer plan), **"Infra"** is short for **Infrastructure**.

It represents the layer of your code that handles the "dirty work" of talking to things outside of your application's logic. If the **Domain Layer** is the "brain" (the rules and math), the **Infra Layer** is the "hands" (the physical actions).

Here is a breakdown of what Infra actually does for you:

### 1. It is "Storage Agnostic"
The Infrastructure layer is the only place in your app that knows *where* your data is stored.
* **Currently:** Your infra handles saving and reading `.mdx` files on your hard drive.
* **The Future:** If you decided to move all your songs and screenplays to a database (like PostgreSQL or MongoDB), you would **only** change the code in the Infra layer. The rest of your app wouldn't even notice the difference.

### 2. It handles "External Services"
Anytime your app needs to talk to the internet, that code belongs in Infra.
* **Example:** Your TMDB integration. The code that actually performs the `fetch()` to the TMDB API, handles network timeouts, or manages API keys is Infrastructure.

### 3. It manages the File System (Disk I/O)
In your current "Writty" project, Infra is responsible for:
* Checking if a file path exists.
* Creating new folders (like project-specific character folders).
* Saving images (posters/headshots) to the `/public/` directory.

### Why we separate it
We keep "Infra" separate so that it doesn't "pollute" your creative logic. 

**Without an Infra layer:**
Your `createScene` function would have a hundred lines of code mixed together: checking if the disk is full, calculating the page count, formatting the date, and finally writing the file. If the disk-writing code breaks, the whole thing crashes.

**With an Infra layer:**
Your `createScene` service simply says: *"Hey FileWriter, save this text to this path."* The Service doesn't care *how* the file is saved; it just trusts the "Infra" to do its job.

### Common Examples in your Project:
* **`fileWriter.ts`**: Handles the `fs` module to save MDX.
* **`tmdbClient.ts`**: Handles the network requests to get movie data.
* **`imageDownloader.ts`**: Handles the stream of data required to save a `.jpg` to your computer.

In short, **Infrastructure is the plumbing.** You don't want your plumbing (pipes and sewers) mixed in with your interior design (Domain logic); you want it tucked behind the walls so you can swap a pipe without tearing down the whole house.