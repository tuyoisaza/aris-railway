# PWA Implementation Plan

## Goal
Make "Upgrade" installable and offline-capable.

## Components

### 1. Manifest (`manifest.json`)
-   Define app metadata (Name, Colors, Display Mode).
-   *Note*: User needs to provide `img/icon-192.png` and `img/icon-512.png`.

### 2. Service Worker (`sw.js`)
-   Cache shell: `index.html`, `css/style.css`, `js/*.js`.
-   Offline fallback for core pages.

### 3. Registration (`js/app.js`)
-   Register the service worker on load.

### 4. HTML Updates
-   Add `<link rel="manifest">` and `theme-color` meta to `index.html`.

## Verification
-   Check "Application" tab in DevTools for Manifest/SW.
-   Test "Add to Home Screen".
