# Strict content rules implementation plan

> **For agentic workers:** Use the executing-plans skill to implement this plan task by task. The source is an immutable Metro export with maintained companion modules.

**Goal:** Hide and refuse adult, explicit, suggestive and unverified manga throughout KURO, including saved links and device files.

**Architecture:** A mandatory shared policy admits only positive, supported upstream rating evidence. Server metadata, chapter relationships, cover delivery and page tickets enforce that policy. Startup client hooks gate routes and project saved collections without deleting the underlying user records.

**Tech stack:** Node 22, existing public catalogue adapters, React/Metro startup hooks, IndexedDB, existing Redis coordination, Playwright.

**Spec:** User request and explicit answer: hide unverified titles too, including unreviewed device imports.

## Global constraints

- Preserve the original Metro export hash, account/profile behavior and native installers.
- Never accept browser supplied ratings, image URLs or a self certification checkbox as content approval.
- Missing, malformed, inconsistent or unavailable rating evidence means hidden and unreadable.
- No runtime switch, query parameter or user setting disables the policy.
- Preserve hidden saved entries and device files; do not delete them automatically.
- Report provider policy coverage separately from live site or image review. Ratings cannot prove every page is correctly labelled.

## Review focus

- Old caches, direct URLs and forged cover parameters must not reveal unapproved artwork.
- A chapter must belong to an approved manga before at-home/image requests occur.
- Reclassified titles and old tickets must not reuse stale approvals indefinitely.
- Saved-state filtering must not write stale snapshots or erase another tab's bookmarks.
- Unreviewed and modified device files must fail before cover preview or reading.

## Tasks

### 1. Admission model and server enforcement

- [x] Add failing policy and route/service tests for ratings, unknown providers, chapters, covers, proxy and tickets.
- [x] Create `client/content-policy.mjs` with exact supported rating contracts and provider restriction states.
- [x] Create `server/catalogue/content.mjs` for canonical metadata, chapter relationships, safe cover delivery inputs and short approval caching.
- [x] Update service/routes/metadata/tickets and close the legacy proxy. Version catalogue cache keys and ticket MACs.
- [x] Run policy/server tests, preserving parser unit tests independently of admission.

### 2. Startup UI, saved state and device admission

- [x] Create `client/content-runtime.mjs` for route checks, safe image resolution and non-mutating Library/History projections.
- [x] Integrate hooks in `client/catalogue-core.mjs` before Metro starts; keep original export unchanged.
- [x] Require reviewed exact page fingerprints for device imports and recheck stored bytes before preview/reader.
- [x] Restrict provider controls and fallback registry; provide a clear permanent rule notice.
- [x] Run isolated browser cases for direct-link spoofing, cached records, unknown local files, approved files and safe reading.

### 3. Release evidence and packaging

- [x] Build the companion assets and validate the unchanged export/native releases.
- [x] Generate a policy audit for every registry entry and document scope/limitations.
- [x] Run relevant regressions and independent scoped review; resolve substantive findings.
- [x] Deliver 4.3.0 full source ZIP, policy setup, results, checksums and working local preview.
