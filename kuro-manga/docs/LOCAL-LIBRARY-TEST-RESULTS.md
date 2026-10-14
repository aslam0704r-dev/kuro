# KURO 4.2.0 verification — 2026-10-13

## Final results

| Check | Result |
| --- | --- |
| Full Node suite, real dedicated local Redis | **165 passed; 0 failed; 0 skipped** |
| New device Library browser suite | **12 passed** |
| Mobile/desktop artwork browser suite | **5 passed** |
| Existing provider/reader browser regressions | **12 passed** |
| Existing profile browser lifecycle | **13 checks passed** |
| Existing profile UI regressions | **3 passed** |
| Existing compact install notification | **10 passed** |
| Production build and exported asset checks | Passed |
| APK/EXE hashes, public certificate and assetlinks validation | Passed; native binaries unchanged |
| Independent scoped review | All confirmed Critical/Important findings resolved and rechecked |

The executed browser checks total **55**. Tests use real Chromium and the compiled KURO interface with controlled local account/provider fixtures. They do not verify live Supabase or deploy the public website.

## Import evidence

- Real CBZ, TAR, gzip/bzip2/xz TAR, stored RAR4 and RAR5, compressed 7z, image EPUB and three-page PDF fixtures imported. Common containers carrying identical ordered images produced one device record; the PDF conversion and differing EPUB spine produced separate records.
- The existing reader displayed actual Blob images after import and direct reader reload. A real page advance was saved and resumed; the history cover decoded after reload.
- An exact duplicate retained completed status/read markers. Same-title books with different pages stayed separate.
- Malicious paths, disguised/damaged images, a 13 MiB archive page, text-only EPUB, invalid PDF, damaged PDF image, oversized PDF image and renamed multipart RAR were rejected without a stored book.
- Browser quota was reduced using Chromium's real storage quota override: the transaction failed, and book count and page count were both zero.
- Cancelling while worker startup was held stored no book. Deleting removed only the browser copy, history and shelf membership; the original fixture file remained intact.
- Two tabs preserved an existing provider bookmark across import/reload. Independent review also verified preservation of pending and persisted provider progress and both shelves during device-file deletion.
- No file POST/upload requests and no uncaught page errors occurred in the device import tests.
- WASM memory maximum is tested on the actual bounded module: growth past 512 MiB throws. CSP allows WASM compilation and same-origin workers while JavaScript eval and embedded objects remain blocked.

## Artwork evidence

- A 193 × 278 thumbnail on mobile selected the available 1,200 × 1,800 original. The artwork layer had no blur filter or fractional scale.
- Missing original cover fell back to the supplied thumbnail; the story and action remained usable.
- Checked 360px and 390px widths, DPR 3 with motion, reduced motion, and resize back to desktop.
- Full desktop comparison at 1,280 × 900 retained the original artwork component. The screenshot differed by only **19 pixels**, each by **one color-channel level**, at the rounded border; layout, content and artwork were unchanged. The comparison permits at most 64 such antialias pixels.
- The existing original Metro bundle's SHA256 remains `4ca7ae590a4065290203fe34e743fcb9e08253d93026aeee7a5bf25efd8b4e07`.
- A final selected live Asura Home sample on the local gateway loaded a 1,042 × 1,510 cover at 390px/DPR3 with contain fitting, `transform:none`, `filter:none`, and zero page errors. This checks one current Home example, not every provider or the public Vercel deployment.
- 21st search was unavailable without sign-in. Existing KURO colors/components/fonts were reused. Local 21st review completed with 27 informational hardcoded-color notices and no deterministic fixes; these colors match the inspected existing design.

## Scope and limits

These fixtures cover representative format implementations and reported regressions, not every file or codec that exists. Browser codecs, storage quotas and physical-device behavior vary. The worker resource boundary is not a comprehensive third-party decoder audit. Imported files are device/browser scoped; no new Supabase policy is involved.

The existing APK/Windows binaries were checked for preservation and packaged. Physical Android/Windows installation was not rerun. The live Vercel website and live Supabase policies were not changed or verified in this update. The 4.1 provider audit remains dated evidence from that release; this update did not rescan all external manga/providers.

## Reproduction

See the root `LOCAL-LIBRARY.md`. Detailed logs/evidence from this run are local under `work/local-*-final.log` and `work/local-evidence/`; the independent report and final JSON comparison are included in `docs/` and the delivered artifacts. The earlier red tests and temporary worker/PDF setup failures were corrected before the final runs reported above.
