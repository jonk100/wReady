# Layer 3: Domain

## Overview
The **Domain Layer** is the "Brain" of the application. It contains the "Laws of Physics" for your specific interests—Music Theory and Screenwriting. It is "Pure Logic," meaning it doesn't need the internet or a hard drive to function.

### 1. It holds the "Calculations"
This is where the math happens. It takes raw input and returns structured truth.
* **Music Theory:** You give it a root note and a formula; it returns the exact intervals and chord names. It doesn't know it's being saved to an `.mdx` file; it just knows music.
* **Script Analysis:** It counts dialogue lines, estimates page length based on word count, and identifies character names using Regex.

### 2. It defines the "Data Shapes" (Schemas)
Your Zod schemas in `content.config.ts` are a perfect example of Domain logic. They define what a "Valid Project" or a "Valid Chord" looks like.
* **Constraints:** "A song must have a tempo between 40 and 250." This is a Domain rule.

### 3. It is "Pure and Portable"
Because the Domain layer doesn't touch the "Plumbing" (Infra) or the "Doorway" (Transport), you can copy-paste your `musicLogic.ts` file into any other project and it will work perfectly. It is the most stable and reusable part of your code.

### Why we separate it
We separate it so that your "Intelligence" isn't tied to your "Tools." If you switch from Astro to a different framework in three years, your Music Theory and Screenwriting logic remains 100% valid. It protects your creative intellectual property from the fast-changing world of web technology.