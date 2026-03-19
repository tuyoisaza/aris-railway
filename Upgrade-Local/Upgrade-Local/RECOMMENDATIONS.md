# Recommended Improvements for Upgrade

## 1. Design & UX: The "Premium" Feel
-   **Dark Mode (System & Toggle)**: Currently, the CSS variables are hardcoded for light mode. A "dark mode" is standard for developer/tech-adjacent audiences.
    -   *Action*: Refactor `:root` variables and add a theme toggler.
-   **Focus Mode**: For the course reading view (`course.html`), implement a "distraction-free" toggle that hides nav/footer.
-   **Motion Design**: Add "enter" animations for the dashboard cards so they cascade in, feeling more like an app than a web page.

## 2. Technical: Industry Best Practices
-   **PWA (Progressive Web App)**: Make the app installable.
    -   *Why*: "Upgrade is an OS". Users should have it on their phone home screen.
    -   *Tech*: `manifest.json` + `service-worker.js`.
-   **SEO & Social Sharing**:
    -   *Open Graph*: Add meta tags so when links are shared on WhatsApp/LinkedIn, they show a rich preview.
    -   *Schema.org*: Mark up the "Pensum" as `Course` structured data so Google recognizes it.

## 3. Academic/Pedagogical Features
-   **The Decision Journal**: A simple local-storage based tool where users log a decision *before* they make it, and review it 2 weeks later.
    -   *Why*: Fits the "Criteria" ethos perfectly.
-   **Spaced Repetition (NBS Cards)**: Digital version of the "NBS" cards mentioned in the brand manual. A daily "card" that pops up in the dashboard.

## 4. Marketing & Growth
-   **Shareable "System Version"**:
    -   After the diagnostic test, generate a shareable image/card: "My Operating System is 65% Compatible with the Future. Upgrade Level: Intermediate."
    -   *Ethos Check*: Keep it sober. No "Badge of Honor", just "System Status".
