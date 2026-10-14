# Device manga import and mobile artwork

User intent: import manga from their own device into KURO Library and read it; fix the blurry mobile Home spotlight, preserving the existing desktop design. The user requested all file types after the initial CBZ/images proposal.

## Import

- Add a compact `Import manga` action in the existing Library. A focused, accessible dialog accepts a comic archive, PDF, selected images, or image folder. Keep existing library cards, collections, statuses and provider books.
- Support the main comic containers: CBZ/ZIP, CBR/RAR v4/v5, CB7/7z, CBT/TAR, compressed TAR, image-based EPUB, and PDF. Accept JPEG, PNG, WebP, GIF, BMP and AVIF image pages when the browser decodes them. Explain unsupported, encrypted, multipart, damaged and text-only files accurately.
- One selected archive/PDF/image set becomes one local book/chapter. Sort archive/image paths naturally (2 before 10); skip hidden system entries and non-image metadata, never execute content or recurse into embedded archives.
- Persist validated page Blobs and a generated cover in IndexedDB on the current browser/device. No file upload, account credentials or Supabase migration. Match the existing device-scoped Library/history behavior and show that limitation in UI.
- Exact ordered page-content hashes prevent duplicate imports. Do not merge different local volumes or same-name books. Commit book and all pages atomically, keep cancelled/rejected imports out of Library, handle quota errors. Support explicit deletion of device files and progress; existing bookmark removal remains available.
- Enforce 150 MiB input, 200 MiB extracted data, 600 readable pages, 2,000 archive entries, 12 MiB per image, 32 million pixels and 16,384 px per side. Validate signatures and full browser decode. Extract in a cancellable/time-bounded worker with a bounded WebAssembly heap; reject unsafe paths, links, encryption and oversize declarations before allocating entries. PDF uses canvas rendering without interactive scripts, forms or links; render serially with bounded canvas/output and cancellation.
- Register one local adapter after existing public adapters at original startup. Extend identity validation and reuse current detail/reader/history contracts. Repair transient cover Blob URLs on reload; release page URLs outside the reader after evicting local page queries. Multi-tab changes update local metadata without overwriting provider entries.

## Mobile Home

Observed live example: no blur filter; the artwork is full-cover raster content transformed continuously with fractional scale/translation. Many provider thumbnails are only 193/320px but the mobile artwork fills about 590px at DPR 2/3; the original resolution helper upgrades only three provider families.

- Below the existing 700px desktop breakpoint, upgrade recognizable thumbnail URLs to original images with a safe fallback to the supplied cover, use the original resolution and crisp contain fitting, and eliminate continual fractional scaling on the Home artwork layer. Preserve scene/text animations and reduced motion.
- Scope changes to the Home spotlight; use the original component and styling at desktop widths and on detail pages. Do not alter provider data, original export or desktop layout.

## Verification and delivery

Use deterministic real-browser import/reader/reload/progress/delete/quota/cancellation tests with generated files, real libarchive format fixtures and a PDF. Add validator/storage/adapter tests. Compare desktop Home screenshots before/after and inspect mobile high-resolution/fallback/resize behavior at 360/390px. Test existing provider/auth/profile behavior relevant to changed bootstrap/security headers. Deliver updated full source ZIP, preview, guide and evidence. State fixtures vs live observations and unsupported codecs honestly.

Implementation is authorized by the user's task. No extra design-approval gate is required under the conversation's permission instructions.
