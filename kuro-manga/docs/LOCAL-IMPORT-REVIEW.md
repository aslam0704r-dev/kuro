# Device library and mobile artwork review

Review date: 2026-10-13. Reviewed source: `work/kuro-providers`; requirements: `docs/superpowers/specs/2026-10-13-device-library-design.md` and adjacent plan. No product files were edited. All probes and synthetic data are confined to this review folder, run in fresh browser contexts, and block third-party traffic.

## Strengths

- Book/page writes use one IndexedDB transaction; the adapter uses stable ordered content IDs, valid local chapter IDs, and the existing reader contracts.
- Archive paths, regular-file checks, per-entry sizes, extraction counts, worker lifetime and WASM memory are bounded. Images receive signature checks and browser decoding before persistence.
- The revised tab synchronization preserves an existing provider bookmark. The independent deletion probe also preserved one tab's pending provider progress, another tab's persisted progress, both provider shelf memberships, and the provider bookmark.
- EPUB markup is parsed without mounting it. The revised order traversal preserves repeated spine pages and mixed XHTML/SVG image order.
- Mobile artwork is scoped to the Home breakpoint, returns the original component for desktop/detail, and keeps a source fallback. The immutable original Metro bundle SHA256 still equals `4ca7ae590a4065290203fe34e743fcb9e08253d93026aeee7a5bf25efd8b4e07`.

## Critical

None confirmed in this review.

## Important

1. **Reject multipart archives even when the first volume contains complete image files.**
   - Location: `client/local/archive-worker.mjs:8` (archive reader construction and entry iteration), `client/local/model.mjs:13` (input format validation).
   - Reproduction: the CRC-correct RAR4 fixture `Comic.part1.rar` declares `MAIN_HEAD` VOLUME|FIRSTVOLUME and `ENDARC` NEXT_VOLUME. The current worker returns its three first-volume pages and the dialog offers Add to library without an error. Libarchive does not reject this particular incomplete comic automatically.
   - Impact: a user can save only the beginning of a multipart comic while being told the comic imported successfully; this violates the explicit multipart rejection requirement.
   - Fix: reject multipart naming patterns as an early UX check and validate container volume indicators before extraction, including RAR4/RAR5 and split ZIP indicators. Volume flags should work even if the input has been renamed `.cbr`.
   - Evidence: `multipart-evidence.json`, `multipart_probe.py`, `Comic.part1.rar` in this folder.

2. **Normalize covers when a local history record is written after a direct reader reload.**
   - Location: `client/catalogue-core.mjs:44` (history record wrapper), `client/local/runtime.mjs:26` (startup history cover repair).
   - Reproduction: import and read `Comic.cbz`, then reload the reader URL. After pages reload successfully and local storage has loaded, `history.coverUrl` still points at the previous document's Blob URL; decoding it fails. Reloading Library separately repairs the history cover.
   - Impact: Continue reading/history artwork can disappear after an ordinary reader reload. Repairing history only during initial metadata refresh races with the reader's later record, which copies the expired cover from URL parameters.
   - Fix: normalize each local history record to the current runtime book's cover when available, and repair delayed records once device metadata is loaded. Retain progress values while replacing only the transient URL.
   - Evidence: `reader-history-cover-evidence.json` shows `historyDecodes:false`; `history-cover-evidence.json` shows successful cover repair on the Library route; `probe.py` reproduces both routes.

## Minor and remaining verification gaps

- `client/local/ui.mjs:13`: the draft cover effect depends on the draft alone. Toggling Reverse page order updates the textual order and saved cover but still displays the original first-page preview. Make the preview reflect the selected first page, or label it as the original cover.
- `client/local/images.mjs:6`: abort and timeout reject the decode promise without clearing both timer/listener or cancelling the image request. The URL is revoked in `finally`, but decoder work and callbacks can remain until load/error/timeout. Route every terminal path through one cleanup function.
- `tests/mobile-artwork-browser.py:18` and `:51`: current checked-in browser cases use DPR 1, reduced motion and a successful original image at 390px. The planned fallback failure, 360px, DPR 2/3 and resize-to-desktop cases remain uncovered in this snapshot. Complete these or describe their verification limits in delivery evidence.
- `client/local/pdf.mjs`: use `annotationMode:DISABLE` for `getOperatorList` as well as `render`, keeping validation operators aligned with the disabled annotation canvas.

## Previously confirmed findings now resolved

| Finding | Current independent evidence |
| --- | --- |
| Cross-tab import overwrote a provider bookmark | `multi-tab-evidence.json`: bookmark survives both tab updates and reload; initial failure preserved in `multi-tab-initial.json`. |
| PDF image decode failure silently became a blank imported page | `bad-pdf-evidence.json`: damaged image now yields a clear page error and no draft; original success/blank-page failure in `bad-pdf-initial.json`. Null PDF image-object evidence is in `pdf-objects-evidence.json`. |
| PDF wrapper worker dropped initial document messages during asynchronous startup | Ready handshake present; the same corrupt-PDF probe now completes instead of timing out. |
| EPUB repeated references were removed and mixed element order was reversed | `epub-order-evidence.json`: repeated A/B/A and SVG-image-before-img cases now match their expected order. |
| JPEG dimensions reached browser decoding before the limit check | Updated JPEG SOF guard test passes; VP8/VP8L guards are also present in source. |
| History cover remained stale on Library reload | `history-cover-evidence.json`: history and Library covers both decode successfully after that reload. Direct reader reload remains listed above. |

## Independent verification performed

- Scoped Node tests: `tests/local-import.test.mjs` and `tests/mobile-artwork.test.mjs`, **9 passed / 0 failed**.
- Fresh Chromium contexts: provider preservation across two tabs; pending/persisted provider history and collection preservation on local deletion; corrupt PDF rejection; existing reader page reload; history cover reload behavior; multipart RAR4 behavior.
- Real browser XML parsing of the current EPUB order code, including repeated and mixed image references.
- Original Metro bundle hash checked against the pinned value.

These are synthetic, deterministic browser fixtures. Main-container regression, full desktop pixel comparison, remaining cancellation/quota checks and physical-device/live-provider behavior are owned by the main task; this reviewer did not claim independent results for them.

## Declined to judge

- Completed provider expansion and remote provider availability: outside this scoped review and third-party traffic was blocked.
- Live account operations, private keys, `.env` data and existing server databases: excluded by the review instructions.
- Standalone offline application launch: expressly outside the current device-file persistence promise.
- Packaging completeness/deployment and physical iOS/Android browser behavior: not exercised by these local probes.

## Assessment

**Ready to complete this change: With fixes.** The main atomic storage and reader integration are sound, and the confirmed data-loss and corrupt-PDF cases have been repaired. Multipart rejection and direct-reader history-cover normalization remain reproducible in the latest browser rerun.

## Final recheck — supersedes the assessment above

The rebuilt bundle was independently rechecked after the remaining fixes. **No unresolved Critical or Important issue was confirmed in this final scoped pass.**

| Recheck | Result and evidence |
| --- | --- |
| Multipart filename | `Comic.part1.rar` now rejects with the multipart explanation and produces no draft. `multipart-evidence.json`. |
| Multipart flags after renaming | The same volume renamed `Renamed.cbr` also rejects with the multipart explanation, demonstrating that header validation is used. `multipart-renamed-evidence.json`. |
| Direct reader reload | Reader pages reload and the subsequently recorded history cover decodes successfully. `reader-history-cover-evidence.json` now records `historyDecodes:true`. |
| Archive/reader regression | Ordinary `Comic.cbz` imports and reads again; cross-tab provider bookmark and pending/persisted provider history preservation remain successful. `multi-tab-evidence.json`, `pending-history-evidence.json`, `history-cover-evidence.json`. |
| Normal PDF | `Comic.pdf` imports and saves all three pages with no page errors or upload requests. `pdf-final-evidence.json`. |
| Corrupt PDF | The corrupt embedded JPEG rejects with a page-specific error, no draft, and zero stored books. `pdf-final-evidence.json`. |
| Oversized PDF image | The oversized embedded image rejects with a page-specific error, no draft, and zero stored books. `pdf-final-evidence.json`. |

One transient regression found during this recheck was also fixed before the final successful run: the archive worker's new local `data` variable shadowed the message parameter and caused a temporal-dead-zone error before extraction. The final worker uses `archiveBytes`, and the ordinary CBZ and renamed multipart probes pass.

The PDF error-capture change was read alongside the pinned worker protocol. It retains the worker's failure reason when PDF.js otherwise resolves an incomplete operator stream, checks that failure before rendering, checks image dependencies again after rendering, uses disabled annotation operators consistently, and bounds teardown of its owned worker. The three PDF probes above confirm both normal acceptance and rejection paths without an observed compatibility regression.

The updated reverse preview now chooses the selected first page in source. The expanded mobile test source now includes thumbnail fallback, 360px/DPR3 with motion, resize to desktop, and the original desktop comparison; these additional mobile cases were reported passing by the main task and were inspected here, rather than rerun by this reviewer.

**Final scoped assessment: Ready to proceed.** All previously confirmed Important findings have been corrected and their original reproduction paths were independently rechecked. The earlier minor decoder cleanup note remains a non-blocking improvement; the original scope exclusions and physical-device/live verification limits still apply.
