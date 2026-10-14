# KURO 4.3.0: reviewed device comics

**Strict content rules are mandatory.** Unreviewed files are refused before preview or saving. Previously stored unreviewed files remain preserved but hidden. See [STRICT-CONTENT.md](STRICT-CONTENT.md) for owner review and deployment.

The approved original KURO demo is `tests/fixtures/safe-device-demo.cbz`. Open Library → Import manga, select it, edit its title, and add/read it in the existing reader. All three demo pages were visually inspected and their exact byte fingerprints are checked on import and display.

The parsers and storage behavior below remain included, subject to this mandatory admission step. The older general-import wording describes4.2 behavior before the strict rule was requested.

## Parser and storage reference

# KURO 4.2.0: device manga and mobile artwork

## Use the new feature

1. Open **Library** and choose **Import manga**.
2. Choose one comic archive/PDF, select multiple image pages, or choose an image folder. Drag and drop also works on desktop.
3. Wait for page checks. Edit the title and check the page order; use **Reverse page order** if needed.
4. Choose **Add to library**, then **Read now**. The book also appears among your existing Library cards and works with KURO's normal reader and saved page progress.
5. Open **Device files** to read stored books, restore a removed bookmark, or delete KURO's browser copy. Deletion requires confirmation and also removes that book's progress and shelf membership; it leaves your original device file intact.

## Supported files

| File | How KURO handles it |
| --- | --- |
| CBZ / ZIP | Extracts image pages, checks each page, sorts numbered paths naturally. |
| CBR / RAR | Reads complete RAR4/RAR5 archives. Split volumes are rejected, including renamed volumes. |
| CB7 / 7z | Extracts supported image pages. |
| CBT / TAR, TAR.GZ/TGZ, TAR.BZ2, TAR.XZ | Extracts supported image pages. |
| PDF | Converts pages serially to WebP at up to 1,800 × 2,600 pixels, without the interactive PDF viewer, annotations or scripts. Damaged/omitted image dependencies reject the import. |
| Image-based EPUB | Follows its package spine and image order, including raster images inside SVG wrappers. EPUB HTML/SVG/scripts are never displayed or executed. Text-only EPUBs are rejected. |
| JPEG, PNG, WebP, GIF, BMP, AVIF | Select pages or an image folder. Browser decoding must succeed. |

This covers the main comic formats; it is not a universal file converter. Password-protected files, multipart archives, unsupported archive codecs, nested archives, SVG pages, text-only ebooks and formats outside the table are rejected with an explanation. A folder is imported as one book/chapter; several image folders can be combined inside one archive. Import multiple comic files one at a time.

Limits: **150 MiB** total input, **200 MiB** extracted/rendered page data, **600 pages**, **12 MiB per image**, **32 million pixels**, **16,384 pixels per image side**, **2,000 archive entries**, and **200 stored books / 1 GiB** of KURO device files. The browser's own quota may be lower. Extraction is time bounded and runs in a worker with a 512 MiB WASM maximum. PDF conversion uses bounded canvases and an owned worker. A rejected/cancelled import writes no partial book.

Exact ordered page content identifies duplicate imports, regardless of archive name or container. Different page order, content, volumes or identical titles remain separate books. PDF conversion can produce different bytes from source image archives, so those are separate imports. Existing reading status and progress survive an exact duplicate import.

## Storage

Files stay in **IndexedDB on this browser/device and website origin**. No manga file is uploaded to Supabase or any provider. This matches KURO's existing device-scoped Library/history. Imports are not restricted to an account or automatically synced across devices. The Android/Windows wrappers use their browser's storage for your deployed KURO website.

Keep your original files. Clearing website data, removing a browser profile or browser storage eviction can remove KURO's copies. Private/incognito sessions may have temporary storage or a smaller quota. Changing the website hostname/origin uses a different storage area.

You can read imported files without source-provider access while KURO is already open. Fresh offline launch still follows the existing offline screen; this release does not add an offline app-shell cache.

## Mobile Home improvement

Below **700px**, Home requests recognizable original-size covers instead of WordPress/MangaDex/CDN thumbnails, falls back to the supplied cover when necessary, fits the artwork without extra enlargement, and removes continual fractional artwork scaling. Existing title/scene effects and reduced-motion behavior remain. Desktop Home uses the original artwork component and layout, as do detail pages. Quality remains limited by the images a provider actually supplies.

## What you need to configure

- **No new Supabase migration, storage bucket, private key or API key is needed for device import.** Existing auth/profile policies and configuration are preserved; use their existing setup guides for a first deployment.
- Deploy this **complete source package** to the same Vercel project/origin as your current KURO. The existing Vercel configuration installs pinned dependencies with `npm ci --ignore-scripts`, then runs `npm run build`.
- The included CSP permits same-origin workers and WebAssembly compilation (`'wasm-unsafe-eval'`), while ordinary JavaScript eval and embedded objects remain blocked. If a hosting layer overrides CSP, use the supplied `vercel.json`/`server/security.mjs` directives. Serve `.wasm` as `application/wasm` and `.mjs` as JavaScript. Include all `dist/vendor/local/` files.
- Browser storage must be allowed. Use a current Chrome, Edge, Firefox or Safari; codecs and folder picking vary by browser. File selection and drag-and-drop have fallback choices in the dialog.
- Open the website over HTTPS; `localhost` is also allowed for local checks. Plain HTTP on a phone/LAN does not provide the required secure browser hashing API.
- Existing APK/EXE binaries remain **3.9.0** and open `https://kuro-manga.vercel.app/`. This web update becomes available to them after website deployment. A new native binary is not required for these features.

## Local setup

With Node **22.13+ in the 22.x line**:

```sh
npm ci --ignore-scripts
npm run build
npm start
```

Open the local address printed by the server and visit `/library`. The default production/account setup still uses `.env.server`; do not put secrets into client code. Device imports themselves work without account keys. The supplied editable companion modules are under `client/local/` and `client/mobile-artwork.mjs`; the original Expo bundle remains unchanged because its editable source was not provided.

## Reproduce checks

```sh
npm test
node tests/helpers/local-fixtures.mjs
python -m pip install playwright pillow py7zr
python -m playwright install chromium
python tests/helpers/local-fixtures.py
```

Start the existing local test server (`PORT=4184 node tests/profile-server.mjs`) and run the following against it; set `APP_URL` if using a different address:

```sh
python tests/local-library-browser.py
python tests/mobile-artwork-browser.py
```

The desktop screenshot comparison uses a pre-change 4.1.0 baseline. Capture it against that package with `CAPTURE_BASELINE=1 python tests/mobile-artwork-browser.py MobileArtworkBrowser.test_desktop_home_preserves_original_layout_and_artwork`, then compare against 4.2.0. The delivered comparison/evidence records the run already performed. Without a baseline, the comparison test clearly requires that prerequisite.

See `docs/LOCAL-LIBRARY-TEST-RESULTS.md` and `docs/LOCAL-IMPORT-REVIEW.md` for actual evidence and limitations. Live Vercel deployment, physical mobile/native installation and live Supabase policy verification were not performed in this update.
