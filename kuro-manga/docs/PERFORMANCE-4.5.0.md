# KURO 4.5.0 loading performance

Date: 15 October 2026. Base: 4.4.2, commit `8fc86d312282b9dded83f39697f379110c893635`.

## Reproduced cause

An isolated live home-page session received its two source feeds in approximately 2.2–2.5 seconds, but had loaded only one cover after 31 seconds. Chapter verification advanced two images per hosted call, with repeated calls taking approximately 2.4 seconds each plus the client's retry delay. An archive/all-manga session had no ready covers after 30 seconds. These are individual observations with changing shared inventory and network conditions, not fixed performance guarantees or an audit of all manga.

## Changes

1. **Reuse current verification in lists.** The existing approved MangaDex list response includes canonical complete-chapter evidence from the shared inventory. A single atomic Redis read retrieves the relevant buckets. The browser seeds its existing readiness cache and can display verified cards without another per-title readiness or chapter request.
2. **Reduce cold round trips.** The initial availability check tries smaller complete chapters first without changing the displayed chapter order. The validator checks pairs of images, persists every completed pair, processes at most 16 pages per invocation, and stops starting additional pairs after four seconds of validation work. The hosted request deadline remains in place.
3. **Resume interrupted work.** A cancellation retains prior completed pairs. Definitive image corruption invalidates earlier proofs, including when another image stalls. Registered integrity cleanup gets an independent bounded context, and the outer request waits for that cleanup before returning.
4. **Keep one authoritative readiness cache.** A fresh negative result removes a visible card immediately. The shared inventory revision is read atomically with its rows; older cached responses cannot overwrite a newer result even if requests finish out of order. Direct-reader and list results use the same markers. Provider-supplied readiness fields are stripped at the metadata trust boundary.

## Fresh tests

- Full Node suite, including dedicated real Redis: **232 passed, 0 failed, 0 skipped**.
- Browser checks: **46 passed** across new performance checks (4), strict content (16), readability/duplicates/reader gates (6), profile editing (13), profile interactions (3), and email authentication (4).
- Build passed, including original Metro SHA, 66 referenced resources, APK/EXE integrity and unchanged native signing evidence.
- New regressions were observed failing before their fixes. They cover warm list shortcuts, upstream-field forgery through list and single-title metadata, mounted-cache invalidation, old in-flight results, all-page validation, corrupt later batches, resumable limits, sibling cancellation and independent integrity cleanup.

The controlled 12-page validator case requires **one invocation instead of six** while still fetching/decoding all 12 pages with at most two concurrent images. Controlled home/archive browser checks used no per-title readiness or chapter-page requests for an already verified title; initial fixture runs rendered its cover in about 0.8–1.4 seconds. Those fixture times are not live service timings.

The remaining local import, artwork and installer browser suites were not rerun for this patch; their assets and behavior are unchanged. Independent review and public deployment observations are recorded separately.

## Preserved rules

- Adult, suggestive, blocked and unknown-rated titles remain excluded.
- Rating evidence expires after 30 seconds. Complete-chapter proofs retain their original six-hour expiry, ownership of manga/chapter relationships, failure markers and group opt-outs.
- Only a verified complete chapter qualifies a title. Partial manifests contain no signed page URLs; the direct reader still checks its selected chapter.
- Existing provider budgets, SSRF controls, MIME/signature/size/decode limits, duplicate grouping and account/profile controls remain mandatory.
- No new dependency, SQL migration, private key or environment setting is required. Native installers stay at 3.9.0.

## Deployment and practical limits

The authorized update goes to `aslam0704r-dev/kuro` on `main`, then the existing `kuro-manga` Vercel project. Deployment status and before/after measurements are delivered in separate public evidence files. Reload existing tabs after deployment.

First-time checks for a title can still take longer when upstream images are slow or a complete chapter is large. Source outages and rate limits remain possible. Shared proof reuse benefits titles whose qualifying proof is still valid; it does not admit expired or unreadable content. This patch does not refresh the historical audit of 100 candidate entries or establish a total catalogue count.
