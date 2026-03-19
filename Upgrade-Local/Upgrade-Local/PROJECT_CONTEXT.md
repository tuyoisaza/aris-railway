# Upgrade: Project Context & Ethos

> **For AI Agents & Developers**: Read this first to understand *why* this project exists and *how* it should be built.

## 1. The Ethos: "Not a Technical Update, A Mental One"
Upgrade isn't a typical course platform. It is a system for updating human mental operating systems.

### Core Principles
1.  **Adult-to-Adult**: We do not motivate, coddle, or "guru" the user. We speak to their capacity for responsibility.
2.  **Sober & Direct**: The design and copy are minimalist, clean, and "intellectual but not academic". No flash, no hype.
3.  **The "Version" Metaphor**: Users are "running old versions" of themselves. Upgrade provides the "patch".
4.  **No "Tips"**: We teach criteria (how to decide), not tips (what to do).

### Aesthetic Guidelines
-   **Visuals**: Dark mode accents, clean typography (Inter), abundant whitespace. "Premium, calm, serious."
-   **Tone**: See `docs/STYLE_GUIDE.md`. If it sounds like a LinkedIn influencer, *delete it*.

## 2. Technical Architecture & Constraints
This project operates under unique constraints to simulate a high-fidelity environment without a complex backend.

### The "Thick Frontend" Architecture
-   **Standalone Logic**: The frontend (`js/`) handles authentication, routing, data decryption, and business logic. The architecture is "Fat Client".
-   **No "Real" Backend (Yet)**: We simulate a backend server using `api.js`. It mocks latency and encryption behavior.
-   **State Management**: `localStorage` acts as the persistent database for the prototype.
-   **Zero Dependencies**: Vanilla HTML/CSS/JS. No React, No Vue, No Bundlers.

### The Connectivity Model (Webhooks)
Although currently mocked, the architecture is designed to be **Distributed & Async**. Interaction points are "hooks":
1.  **Event-Driven**: The app "sends" data to Webhooks (content-addressable endpoints).
2.  **Encrypted Payloads**: User data is encrypted client-side (`crypto.js`) before sending. The backend is treated as a "Blind Store".
3.  **Reactive Progress**: As the user progresses, the frontend "calls home" via these hooks. Current implementation mocks this via `api.js` updating `localStorage` but the architectural intent is to be loosely coupled.

## 3. Working on This Project
-   **Do not introduce frameworks** unless explicitly asked. The challenge is to build complex interactions with raw tools.
-   **Preserve the "Mockup" nature**: We are building the *interface* of a complex system. If a feature needs a backend (e.g., payment), mock the *experience* of it perfectly (spinners, success states), don't get stuck on the infrastructure.
-   **Respect the Brand**: Before committing any text or UI change, check: "Is this sober? Is this treating the user like an adult?"

## 4. Key Files & Status (As of Dec 2025)
-   `index.html`: Public landing. (Complete)
-   `dashboard.html`: Authenticated application. (In Progress)
-   `js/data.js`: The "Database" containing the Pensum and Translations.
-   `js/api.js`: The "Server" mock logic. Check here to see how hooks and encryption are simulated.
-   `docs/BRAND_MANUAL.md`: The Source of Truth for identity.
-   `docs/STYLE_GUIDE.md`: The Source of Truth for tone.

## 5. How to Run
-   **No Build Step**: Just open `index.html` in a browser.
-   **Local Development**: Use a Live Server to serve the files.
