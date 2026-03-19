# Verification Report: Dark Mode & PWA

## Summary
-   **Dark Mode**: ✅ Verified. Clicking the toggle changes the background color from #F8FAFC (Light) to #0F172A (Dark).
-   **PWA**: ⚠️ Partially Verified.
    -   `manifest.json` is linked.
    -   `sw.js` is created and registration is attempted.
    -   **Limitation**: Service Workers require `http://` or `https://` to register. They will not work on `file://`. You must serve the folder with a local server (e.g. `python -m http.server` or Live Server VS Code extension) to see the "SW Registered" message.

## Evidence
-   **Toggle Action**: Verified via browser interaction manually.
-   **Console Log**: `SW Failed: TypeError: Failed to register a ServiceWorker: The URL protocol of the current origin ('null') is not supported.` (Expected failure on local file).

## Next Steps
-   To test offline capabilities fully, please deploy to Vercel/Netlify or use a local server.
