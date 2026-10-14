# KURO 4.1 provider expansion — final review

Scope: read-only review of provider parsers, fixed connections, registry/alias integration, runtime registration, public URL/image protections, signed tile transforms, cache capacity, pacing, and refresh deadlines against `outputs/kuro-full-source-4.0.0.zip`. Product files were not modified by the reviewer.

## Assessment

**No remaining confirmed Critical or Important findings in the reviewed scope.** All five findings raised during this review were fixed and independently retested with their original controlled repros. Source availability must still be reported from the implementer's dated live checks; an installed adapter is not a guarantee that a remote source is currently available.

## Integration evidence

- Registry: **1,236 canonical providers; 1,254 unique requested names; 109 installed readers; 116 total adapters; 101 fixed connection configurations**.
- Every row in `dist/provider-requested.json` resolves to its declared canonical provider. All **24 original installed adapter IDs** survive the 4.0 comparison. `MangaRead.org` resolves to the existing `mangaread` ID. The previous external Azorafly name resolves through the Azoramoon alias.
- All **116 adapters register** in the controlled compiled source-manager harness: 107 newly registered runtime adapters plus nine preserved legacy adapters. The only original adapter-family change is MadaraScans from Madara to Themesia; its `/series/` path identity remains supported.
- Every configured text/image host passes exact-host HTTPS admission and offsite/credential URL rejection. Configured API URLs are admitted by their static text policy. Public DNS pinning, size/MIME/full-decode checks, manifest reconstruction, and MAC-authenticated transforms remain in place.
- The provider directory renders at most 80 rows initially and uses text nodes for source names, notes, errors, aliases, and credits. Its static sample checks and runtime failures retain distinct labels.

Controlled audit: `review/integration-audit.mjs`; result: `review/integration-audit.log`.

## Validation

Fresh independent catalogue fixture run: **75 passed, 0 failed, 2 skipped (77 total)**. The skips require a dedicated local Redis endpoint, which was not configured in this review process. Log: `review/final-catalogue-tests.log`. This does not replace the implementer's separate full-suite/real-Redis/browser run.

Controlled checks also confirmed:

- Direct Asura/Flame premium, locked, and future chapter IDs fail before loading reader manifests.
- Public transport does not forward supplied Cookie or Authorization headers.
- A non-involutive tile permutation matches the upstream reader's source-to-destination direction.
- Native HTTPS AbortError cancellation does not cache a false failure for an ordinary reader request.

Evidence: `review/core-repros-final.log` and `review/transport-abort-cache-repro.log`.

## Resolution ledger

1. **Search filters silently ignored — resolved.** Asura, Flame, and Iken now reject the controlled ONGOING item for a COMPLETED-only search and include the existing page-filter notice. Kind mapping and source-supported ordering were added. Repro: `review/filter-repro.mjs`; result: `review/filter-repro-final.log`.

2. **Refresh could exceed hosted duration before saving its cursor — resolved.** Refresh now selects at most six readers, commits each wave before its I/O, and enforces a 42 second asynchronous deadline. The original modeled 68.2 second case now requires **35.1 seconds** with six readers. Deadline/cursor fixtures pass. Repro: `review/refresh-duration-repro.mjs`; result: `review/refresh-duration-final.log`.

3. **Large restored images rejected before compression — resolved.** A valid 2,549,355-byte, 2200×2200 JPEG formerly restored to 12,487,934 bytes and failed with 422. Compression inside `restoreTiles` now delivers **2,824,618 bytes with unchanged 2200×2200 dimensions**. Repro: `review/large-tiles-repro.mjs`; before/final results: `review/large-tiles-before.log`, `review/large-tiles-final.log`.

4. **Ordinary requests inherited cancellation from shared refresh inflight work — resolved.** `server/catalogue/cache.mjs:63` now isolates inflight entries by their cancellation scope. The identical ordinary latest request succeeds while refresh times out; an unrelated request also succeeds and the outer asynchronous context has no catalogue signal. Evidence: `review/deadline-isolation-before.log`, `review/deadline-isolation-after.log`.

5. **Cancelled Redis work cancelled its own lock cleanup — resolved.** `server/catalogue/cache.mjs:24` and `cache.mjs:41` give lock-release commands an independent bounded cleanup signal. The original controlled expired-deadline case now leaves **zero locks**, rather than a lock awaiting its 35,000 ms TTL. Evidence: the same deadline-isolation before/after logs.

## Declined to judge

- Live provider availability or complete remote catalog coverage: real source probes were prohibited; the implementer owns the dated live-check report.
- Actual Redis server/replica behavior in this review process: its integration fixtures skipped. Controlled REST-boundary repros verified deadline behavior and cleanup; this is narrower than an actual Redis run.
- Profile/auth/native behavior, private environment/signing files, and user databases: outside this assigned provider-core review and excluded from inspection.
- Final package/documentation version edits: the implementer explicitly marked these as still being finalized; no claim about completed release packaging is made here.