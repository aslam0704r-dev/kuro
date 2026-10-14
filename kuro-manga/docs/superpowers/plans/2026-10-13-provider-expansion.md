# Provider expansion implementation plan

**Goal:** Check every name in the attached 1,254-line list and install connections whose public catalogue, title, chapter list and sample reading images pass bounded checks.

**Architecture:** Preserve the immutable Expo export, authentication, profile and native modules. Extend the existing pre-startup adapter registry with independently implemented public website family parsers and fixed server connection policies. Unverified names remain in the directory with truthful reports; they cannot authorize arbitrary server fetches.

**Execution:** Inline implementation under the user's existing authorization. Audit-context-building delegates read-only unfamiliar source analysis; requesting-code-review delegates a final fresh review.

## Constraints

- Preserve original source IDs, preferences, saved library and reader routes.
- HTTPS, valid certificates, fixed public origins, pinned public DNS, bounded responses and timeouts.
- No execution of source scripts, challenge bypass, subscriptions, private keys or user credentials.
- New sources opt in; metadata and external publisher links do not claim in-app reading.
- Samples establish a selected chapter at a recorded time, never all titles or every page.
- Existing 4.0.0 archive is the recovery baseline; new full archive is 4.1.0.

## Tasks

- [x] Map all requested names with provenance and unresolved names; probe unique public candidates politely, saving evidence.
- [x] Write failing parser/configuration tests for real Madara overrides, MangaThemesia search/pagination, chapter locks and literal manifests; add minimal implementations.
- [x] Exercise each candidate family through search, details, chapters and first/last decoded pages. Admit only passing connections with exact observed origins and per-source evidence.
- [x] Add bounded cache eviction and batched health reads so the larger directory cannot exhaust storage or trigger one remote query per source.
- [x] Merge verified connections and all requested names into the directory, deduplicating confirmed aliases and preserving existing preferences.
- [x] Verify real compiled browser search/title/reader flows, profile/installer preservation, build assets and original bundle hash.
- [x] Produce full ZIP, 1,254-row CSV/JSON check reports, setup steps, test results and checksums.

## Review focus

Wrong-site or parked responses; stale domains and cross-host redirects; path identity collisions; premium or incomplete chapter lists; malformed or hostile image manifests; directory/cache capacity; runtime deadlines; unchanged original profile/account/native paths.
