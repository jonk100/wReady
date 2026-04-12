# 5-Layer Review Creation Architecture

## Overview

To implement the "Enriched Review" flow using a 5-layer architecture, you would organize your files to separate the user interface, the business logic (enrichment), and the actual file-saving mechanics.

Here is the file map for creating a movie review:

### 1. The Directory Structure
```text
src/
├── components/
│   └── ReviewCreateForm.astro       <-- LAYER 5: Presentation (UI)
├── pages/
│   └── api/
│       └── reviews/
│           └── create.ts            <-- LAYER 1: Transport (API Route)
├── services/
│   └── ReviewService.ts             <-- LAYER 2: Service (Orchestration)
├── utils/
│   └── api/
│       ├── collections/
│       │   └── reviews.ts           <-- LAYER 3: Domain (Data Shaping)
│       └── infra/
│           ├── tmdb.ts              <-- LAYER 4: Infrastructure (External API)
│           ├── fileWriter.ts        <-- LAYER 4: Infrastructure (Disk I/O)
│           └── imageDownloader.ts   <-- LAYER 4: Infrastructure (Assets)
└── content.config.ts                <-- Domain Schema (Zod)
```



---

### 2. File Responsibilities & Logic

#### Layer 5: The UI (`ReviewCreateForm.astro`)
This is the entry point. It captures the user's input (e.g., the TMDB ID and the review text) and sends it to the API.
* **Role:** Handle the `fetch` request to the backend and show loading/success states.

#### Layer 1: The API Route (`pages/api/reviews/create.ts`)
This is a "thin" gatekeeper. It doesn't know how to talk to TMDB or write files.
* **Logic:** 1.  Verify the authentication/environment variables (e.g., `ALLOW_CONTENT_WRITE`).
    2.  Extract the `tmdbId` and `rating` from the request.
    3.  Call `ReviewService.createReview()`.
    4.  Return a JSON response.

#### Layer 2: The Service (`services/ReviewService.ts`)
The "Brain." It coordinates the complex multi-step process.
* **Logic:**
    1.  Ask the **TMDB Utility** for movie metadata (title, director, year, poster URL).
    2.  Ask the **Image Downloader** to save the poster locally using the movie title as the filename (following your naming convention).
    3.  Ask the **Review Domain Helper** to combine this metadata with the user’s review into a valid MDX string.
    4.  Ask the **File Writer** to save the final `.mdx` file.



#### Layer 3: The Domain Helper (`utils/api/collections/reviews.ts`)
This is pure data transformation. It has no side effects (it doesn't touch the internet or the disk).
* **Logic:**
    1.  Import the Zod schema from `content.config.ts`.
    2.  Format the frontmatter block.
    3.  Ensure the filename follows the correct sorting logic (e.g., ensuring `01-title.mdx` comes before `10-title.mdx`).

#### Layer 4: The Infrastructure (`utils/api/infra/`)
These are specialized tools that do one thing only.
* **`tmdb.ts`:** Handles the fetch to the external API and error handling if the service is down.
* **`imageDownloader.ts`:** Fetches the image buffer and saves it to `/public/posters/`.
* **`fileWriter.ts`:** Checks if the slug exists and writes the MDX content to the `src/content/reviews/` directory.

---

### 3. The Data Flow Summary

When you click "Submit" on your review form, the data travels like this:

1.  **Transport:** "I have a request to create Review #12345."
2.  **Service:** "Okay. First, I'll go get the movie info. Then, I'll grab the poster. Then, I'll ask the Domain to format the file content. Finally, I'll tell the disk to save it."
3.  **Domain:** "Here is the perfectly formatted text for that review, including the director and poster path."
4.  **Infrastructure:** "Saving `src/content/reviews/the-big-lebowski.mdx` now."

This structure allows you to run the exact same enrichment logic via a manual terminal script (by calling the `ReviewService` directly) as you do through the web browser.