# Layer 5: Presentation

## Overview
The **Presentation Layer** is the "Face" of the application. In your project, these are your Astro components and forms. It is the only layer the user ever sees.

### 1. It captures "Intent"
It provides the buttons, text areas, and dropdowns that turn a user's thoughts into data.
* **Smart Inputs:** Using a dropdown for "Project" ensures the user doesn't make a typo. 
* **Live Previews:** Because the **Domain Layer** is separate, the Presentation layer can import it to show a "Live Page Count" or a "Chord Diagram" while the user is still typing.

### 2. It handles "User Feedback"
It manages the emotional experience of the app.
* **Loading States:** Showing a spinner while the `ReviewService` is busy downloading images from TMDB.
* **Success/Error Styling:** Turning a border red if a required field is missing or showing a "Scene Saved!" toast notification.

### 3. It manages "Local State"
It handles things that don't need to be saved to the disk yet.
* **Example:** Remembering which tab (Write vs. Preview) the user was on while they are editing a screenplay beat.

### Why we separate it
By keeping the UI separate from the logic, your components stay "Dumb and Pretty." They don't need to know how to talk to TMDB or how to calculate a Minor 7th chord. They just send data to the "Gatekeeper" (Transport) and wait for a response. This makes your UI much easier to redesign or swap out without risking the data "under the hood."