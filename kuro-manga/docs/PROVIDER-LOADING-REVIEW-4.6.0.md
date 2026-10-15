# KURO 4.6.0 scoped independent review

Reviewed on 15 October 2026 against `a5633b8a08b27846786af5b6673a06252341a2f5` (4.5.0).

Application: `C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga`.

## Result

**No remaining actionable findings in the reviewed scope after the corrections below.** All eight independent reproductions now pass on the current source. This is a bounded code and regression review, not a production performance guarantee or a new provider/content audit.

Inspected the changed catalogue core, listing scheduler, MangaDex HTTP helper, actual Discovery hook replacement, provider-directory UI, generated companion, exported manifest validator, tests, version changes and release documentation. Saved selections remain separate from runtime eligibility and content approval. The server/content-policy modules, account/profile implementation and original Metro export are unchanged by this diff.

## Findings corrected during this review

Every row below was actionable at the time of reproduction and is now resolved. References point to the final source, so they identify the correction rather than the former faulty expression.

| Severity | Finding and exact reproduction | Final correction and independent result |
| --- | --- | --- |
| P2 | Migration overwrote a legacy explicit Off. Start with `sourcePreferences.mangadex.enabled=false` without `selectionVersion`; initialization produced `true`. The corresponding `local.enabled=false` device-import preference was also forced on. | `client/catalogue-core.mjs:121` and `:122` preserve explicit Booleans. Reviewer cases 1 and 2 pass; language/reading preference preservation is also asserted. |
| P2 | Saved selection was allowed into runtime queries despite deployment availability. Select MangaDex with `selectionVersion:1` and set its directory record to `available:false`; `selectEnabledSourceIds` still returned MangaDex. Refreshing a previously available directory entry had the same problem. | Policy-normalized current availability determines `runtimeEligible` at `client/catalogue-core.mjs:116`; both `manager.enabled` (`:145`) and exported selection (`:166`) project it. Reviewer cases 3 and 4 pass while the saved On choice remains intact. |
| P2 | Initial readiness checks ignored HTTP-date Retry-After. Return a 429 from `/readable/check` with a date five minutes ahead; the old path scheduled a one-minute retry. | `client/catalogue-core.mjs:85` shares `retryDate` with metadata/page handling. Reviewer case 5 now preserves the full five-minute window and suppresses an immediate second request. |
| P2 | Temporary interruption became a false unreadable result. Return valid pending page progress, then reject the next page fetch with `TypeError('fetch failed')`; the inner chapter catch exhausted the candidate and cached `ready:false` for 120 seconds. An initial `AbortSignal.timeout` rejection named `TimeoutError` had the same final effect. | Shared temporary-failure classification (`client/catalogue-core.mjs:14`) is used before advancing a candidate (`:101`) and by pending/backoff recovery (`:104`). Reviewer cases 6 and 7 pass: progress stays pending with retry timing and no negative cache entry. Focused repository tests additionally exercise page aborts and non-JSON error bodies. |
| P2 | Concurrent responses shortened a source cooldown. Start two readiness calls; resolve a 429 with Retry-After 300 seconds, then another with 30 seconds. After 31 seconds a third title caused a new network request, despite the first five-minute source window. | Both core HTTP response boundaries use `Math.max` with the existing source deadline (`client/catalogue-core.mjs:43` and `:85`). Reviewer case 8 passes: only the original two network calls occur and the later title inherits the five-minute deadline. |

The runnable independent cases are in `KURO_4.6_REPROS.test.mjs` beside this report. They use stubbed responses and test stores, with no private environment or production access.

## Independent verification

| Check executed by reviewer | Result |
| --- | --- |
| Eight reviewer reproductions after the final fixes | **8 passed, 0 failed, 0 skipped** |
| `listing-queue`, `listing-check`, `provider-selection`, `discovery-progressive`, `catalogue-http` repository tests | **39 passed, 0 failed, 0 skipped** |
| Retained 4.5 adversarial proof/revocation suite on current 4.6 source, using dedicated Redis at port 16479 and isolated test namespaces | **14 passed, 0 failed, 0 skipped** |
| Independent fresh-browser Home and Search controlled cold fixtures on the regenerated companion | Both passed; no page script errors or external network requests |
| Read-only esbuild output comparison using the production catalogue-build options | Current generated companion matches current source byte for byte |
| Original Metro export integrity | Expected SHA-256 unchanged |

The retained 4.5 cases cover upstream proof-field spoofing, mounted negative invalidation, old positive/negative list replay, direct-reader ordering, A/B/A chapter evidence, delayed primary snapshots, expiry/revocation/group restrictions in memory and Redis, and integrity failure with sibling deadlines/slow progress unlock. The focused 4.6 cases cover fairness, two active scheduled steps, shared ownership, unmount cleanup/capacity, hidden pages, complete-manifest identity, independent provider publication/paging/query keys, settings persistence and HTTP cooldowns.

In each independent browser fixture, the first page-batch calls were long A, long B, then short. The short approved title and its cover appeared while both long chapters still returned pending; neither long title nor its cover appeared. The final measured observations were **1,093 ms on Home** and **1,088 ms on Search**, including navigation and the network-idle wait. Fresh remote defaults were exactly MangaDex and AniList. Selecting unsupported Guya saved its choice, kept runtime eligibility false, and retained the short title's existing proof/card.

Browser evidence is in `KURO_4.6_BROWSER_REPRO.py`, `KURO_4.6_BROWSER_RESULT.json`, `KURO_4.6_REVIEW_HOME.png` and `KURO_4.6_REVIEW_SEARCH.png` beside this report. These are controlled, fast synthetic responses; the timings do not predict production latency. The baseline replay comparison and the complete 271-test/56-browser release runs were performed by the implementer and are separate evidence, not reviewer reruns.

Final generated companion SHA-256:

`b5673608eb352ccd1cb3fee3abcc8f22fee0a9bae4261cc54acf016f7baecf56`

Original Metro export SHA-256:

`4ca7ae590a4065290203fe34e743fcb9e08253d93026aeee7a5bf25efd8b4e07`

## Actual limits and preserved scope

- The shared two-worker scheduler governs Home/Search listing readiness. Direct-reader selected-chapter validation and existing Library/history checks retain their prior paths. An already running step can finish after its last watcher leaves; further queued batches and owner notifications stop. This is not a single global network pool.
- Fairness occurs between hosted page batches. Metadata preparation, a slow in-flight hosted batch, complete-chapter validation, rate limits and image-host latency can still delay a cold title. No live bulk network probes or new production latency measurements were performed in this review.
- Progressive provider completion/pagination was independently checked through focused hook tests; the browser cold fixture tests three titles from the admitted reading provider. The review does not claim a live multi-reader test. AniList remains metadata-only, and device imports remain a separate Library capability.
- All 1,236 directory entries can retain a saved selection. This does not establish 1,236 working connectors, admit unknown/adult ratings, create unresolved links, or qualify titles for the readable count. The strict content and complete-chapter gates remain required. The historical partial 100-candidate audit was not repeated or expanded.
- No private environment, credentials, session databases or live authenticated Supabase Storage/RLS were inspected. App source, index, tests and persisted user state were not edited by the reviewer. Only report/reproduction artifacts in this review folder were written.
