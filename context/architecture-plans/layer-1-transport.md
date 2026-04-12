# Layer 1: Transport

## Overview
The **Transport Layer** is the "Front Desk" of your application. It is the only layer that understands the outside world's communication protocols (HTTP, JSON, Form Data). While Infrastructure handles the "plumbing," Transport handles the "doorway."

### 1. It acts as the "Protocol Translator"
Users send data via web forms or API calls. The Transport layer takes that messy input and turns it into clean objects that your internal services can understand.
* **Request Parsing:** It extracts a `tmdbId` from a URL or a `sceneText` from a POST body.
* **Response Formatting:** Once the work is done, it decides how to tell the user. It sends a `201 Created` if the file was saved or a `400 Bad Request` if the form was filled out incorrectly.

### 2. It is the "Security Bouncer"
Before any logic runs, the Transport layer checks the user's credentials. 
* **Example:** It checks your `.env` for `ALLOW_CONTENT_WRITE`. If that isn't true, it stops the request immediately. Your "Brain" (Domain) never even has to wake up for unauthorized users.

### 3. It manages "State and Feedback"
It’s responsible for telling the browser what happened.
* **Redirection:** After saving a new Song, it tells the browser to go to the new song's page.
* **Error Reporting:** It catches "File already exists" errors from below and translates them into a friendly message for the UI.

### Why we separate it
Without a Transport layer, your creative logic would be tangled with web-specific code. You’d have `Astro.request` logic inside your music theory functions. By separating it, your system becomes "UI-agnostic." You could eventually trigger the same "Save Scene" logic from a mobile app or a terminal command without changing a single line of the internal code.



---

### `layer-2-service.md`





---

### `layer-3-domain.md`





---

### `layer-5-presentation.md`

