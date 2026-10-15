# Catalogue loading performance implementation plan

> **For agentic workers:** Use executing-plans to implement these steps in this existing checkout. Review the scoped diff before the authorized push.

**Goal:** Reduce the wait for home/search manga cards and chapter preparation while preserving mandatory strict content and complete-chapter admission.

**Architecture:** Include fresh shared readability proofs in already approved MangaDex list responses. Consume these proofs in the existing bootstrap instead of issuing one readiness request per title. Validate cold chapters in several small resumable batches within one hosted invocation, with a conservative deadline and the existing two-image concurrency cap.

**Tech stack:** Node 22, existing Redis coordinator, JavaScript bootstrap, Python Playwright. No new dependencies.

**Spec:** User report: home and search/all manga loading areas are very slow. Preserve `STRICT-CONTENT.md` and the at-least-one-complete-chapter qualification in `READABLE-CATALOGUE.md`.

## Global constraints

- Preserve original Metro SHA and existing account/profile/native flows.
- Never show adult, suggestive, unknown-rated, revoked or expired-proof titles.
- Never issue reading tickets for partial or invalid page evidence.
- Keep SSRF, image validation, provider/IP rate budgets and group opt-outs.
- Preserve six-hour proof expiry and thirty-second rating evidence; no stale admission.
- Reuse existing repository and Vercel project. No private credentials requested.

## Review focus

- Fresh content with expired/revoked/group-excluded readability evidence stays unqualified.
- Provider-supplied extra fields cannot manufacture readiness.
- Slow, aborted or corrupt page batches resume safely and never leak tickets.
- Warm and cold results are measured separately; real-network timings remain observations.
- List shortcuts do not skip the direct-reader gate or cause duplicate rows.

## Task 1 — share existing proofs with list responses

- [ ] Add failing service/client regressions for warm list readiness and expiry/revocation.
- [ ] Add bounded atomic inventory multi-read to memory/Redis coordinators and ledger.
- [ ] Attach canonical valid proofs only after strict list-content classification.
- [ ] Consume identity-bound proofs in the existing mapManga bootstrap hook.
- [ ] Run regression and existing policy/readability tests.

Files: `server/catalogue/cache.mjs`, `readable.mjs`, `service.mjs`, `client/catalogue-core.mjs`, `tests/readable-performance.test.mjs`.

## Task 2 — reduce cold validation round trips

- [ ] Add failing regressions for several completed image pairs in one call, bounded stopping, incomplete/corrupt evidence and resumption.
- [ ] Use bounded multi-batch validation while persisting each completed pair; retain two concurrent images and conservative deadline behavior.
- [ ] Preserve a small explicit batch option in fixtures that exercise resumption.
- [ ] Run full Node suite with dedicated Redis and the content/readable/profile/browser suites.

Files: `server/catalogue/readable.mjs`, `service.mjs`, existing readable tests, new performance tests.

## Task 3 — measure, review and deliver

- [ ] Compare controlled request counts and timings plus fresh live home/search observations.
- [ ] Obtain independent scoped review and resolve findings.
- [ ] Build, package full source, preserve original assets, push patch release and verify same Vercel project.
- [ ] Provide measured improvement, limitations and source ZIP without claiming a full provider audit.
