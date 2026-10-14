# Device Library and Mobile Artwork Implementation Plan

> **For agentic workers:** use executing-plans to implement these tasks inline. Independent architecture/review delegation is permitted by the applicable audit/review skills.

**Goal:** Read device comics in the existing KURO Library/reader and improve mobile Home image clarity while preserving desktop.

**Architecture:** One browser-local adapter joins the existing pre-startup Metro extension. IndexedDB owns page Blobs; existing Library/history own bookmarks/progress. Isolated archive extraction and serial PDF rendering feed validated, atomic imports. A mobile-only artwork extension uses full-size covers and scoped CSS.

**Tech Stack:** Node 22 build, React/Expo export companion, IndexedDB, libarchive-wasm 1.2.0, current PDF.js exact pinned version, browser canvas/crypto, esbuild, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-13-device-library-design.md`

## Global constraints

- Preserve the immutable original bundle, existing provider IDs, auth/profile/native code and existing Library data.
- No private keys, live account changes or live deployment claims.
- Exact limits and supported formats are defined in the spec. Files stay local to this browser/device.
- Original desktop Home rendering and mobile details stay unchanged.

## Review focus

- Malicious archive entries/declared sizes/compression bombs: bounded worker and fail atomically.
- Quota/cancel/reload/multiple tabs: no partial books, leaked URLs or overwritten provider rows.
- Duplicate content under renamed archives: preserve progress and avoid second Library entry.
- PDF/image decode errors: full import rejection and actionable error, no silent missing pages.
- Thumbnail original missing, viewport resize and reduced motion: safe image fallback and unchanged desktop.

### 1. Import model and extraction

Files: `client/local/{model,archive,pdf,images,importer}.mjs`, `client/local/archive-worker.mjs`, tests/local-import.test.mjs, scripts/build-local.mjs.

- [x] Add failing model/format/limits/path/order tests and run them.
- [x] Implement signature checks, normalization/hash and limits; pin/copy dependencies and worker/assets with licenses.
- [x] Implement bounded archive and PDF processing with real-file tests, explicit unsupported cases and cancellation.

### 2. Persistence, adapter and existing Library

Files: `client/local/{store,runtime,ui}.mjs`, `client/catalogue-core.mjs`, `dist/local-library.css`, tests/local-library-browser.py.

- [x] Add failing browser test for Library import action and complete file-to-reader flow.
- [x] Implement atomic IndexedDB storage, stable identities, cover repair, duplicate imports and deletion.
- [x] Register local adapter/identity/Library component at startup, preserve existing stores and source preferences.
- [x] Implement accessible Library dialog, file/folder/drop/title/order previews, progress/cancel/errors and device-file management.
- [x] Verify reload, progress, sorting, delete, book re-add, quota/cancel, multi-tab and mobile layout.

### 3. Mobile clarity

Files: client/mobile-artwork.mjs, dist/mobile-artwork.css, client/catalogue-core.mjs, tests/mobile-artwork.test.mjs, tests/mobile-artwork-browser.py.

- [x] Capture desktop baseline and add failing mobile original-resolution/scaling test.
- [x] Implement mobile artwork wrapper and scoped CSS, safe source fallback, resize and reduced motion.
- [x] Verify desktop pixel comparison and real mobile sample; do not edit original bundle.

### 4. Review, regression and package

Files: package/build/check scripts, docs/LOCAL-LIBRARY.md, docs/LOCAL-LIBRARY-TEST-RESULTS.md, outputs/kuro-full-source-4.2.0.zip.

- [x] Independent code review of import storage/extraction and startup/mobile integration; resolve real findings.
- [x] Run targeted existing regressions/build, record exact outcomes and physical-device/live limits.
- [x] Create complete ZIP, verify integrity/unchanged assets/no secrets, deliver preview and deployment steps.
