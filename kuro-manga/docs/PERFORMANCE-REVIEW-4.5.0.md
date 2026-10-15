# KURO 4.5.0 performance review

**Result: scoped clean review. No outstanding actionable findings or review blocker for the authorized push.**

Reviewed on 15 October 2026 against base `8fc86d312282b9dded83f39697f379110c893635` in `C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga`. This is an independent review of the catalogue performance patch and its corrections, not a new review of every provider or the complete application.

## Scope and final behavior

- Reviewed all six changed runtime source modules: `client/catalogue-core.mjs` and `server/catalogue/{cache,content,deadline,readable,service}.mjs`, their affected callers, focused tests, generated companion changes, version metadata and performance documentation. The existing strict-content and complete-chapter requirements were the governing invariants.
- Approved MangaDex list rows receive only canonical, unexpired, complete proofs from the shared ledger. `getMany` uses the same expiry, failure-marker, identity and group restrictions as other ledger reads. Redis returns the inventory revision and bucket values in one primary Lua operation: [cache.mjs:44](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/server/catalogue/cache.mjs:44), [readable.mjs:27](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/server/catalogue/readable.mjs:27).
- The client requires current strict rating approval, an identity-bound complete proof and its expiry. List, direct readiness checks and reader completion share revision markers, including negative observations. Mounted collections use the authoritative readiness cache: [catalogue-core.mjs:43](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/client/catalogue-core.mjs:43), [catalogue-core.mjs:73](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/client/catalogue-core.mjs:73), [catalogue-core.mjs:122](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/client/catalogue-core.mjs:122).
- Validation retains two concurrent images, saves every completed pair, processes at most 16 pages per call, and stops starting further pairs after four seconds. Pending responses contain no reader tickets. Ordinary hosted cancellation retains prior progress; definitive failures register bounded revocation before progress-lock release: [readable.mjs:37](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/server/catalogue/readable.mjs:37), [service.mjs:196](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/server/catalogue/service.mjs:196), [deadline.mjs:5](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/server/catalogue/deadline.mjs:5).
- Smaller chapters are tried for initial title qualification using a copied candidate list. Reader order and the direct reader's selected-chapter gate remain intact. Provider/IP budgets, URL restrictions, decoding, group opt-outs, duplicate grouping, licensing and ticket checks remain in force.
- Package and lockfile versions consistently read 4.5.0 without dependency changes. The final ignore additions cover only Python bytecode artifacts (`__pycache__/` and `*.pyc`); existing private-data and test-state exclusions remain present.

## Issues resolved during review

| Issue | Correction and recheck |
| --- | --- |
| A single-title metadata response could relay a provider-supplied `kuroReadability` field, which the new mapper trusted. | `content.seed` strips all three reserved readability fields before any canonical response. Only the list service attaches trusted evidence. The independent service-to-mapper forgery case passes. [content.mjs:24](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/server/catalogue/content.mjs:24) |
| A mounted collection retained its own old ready entry after the global cache was cleared; older in-flight work could also restore invalidated state. | Removed the duplicate hook cache and added per-check invalidation records. The mounted-state and old-request regressions pass. |
| Hosted cancellation reset completed progress; a corrupt page paired with a stalled sibling could instead escape revocation. A slow lock release could postpone cleanup registration until after the response. | Cancellation retains completed pairs. Pairs fail promptly, and the validator registers integrity cleanup at failure detection, before asynchronous unlock. Independent corruption, ticket-refusal and delayed-unlock cases pass with memory and real Redis. |
| Cached negative lists erased newer proofs; cached positives could restore a revoked card. Request timestamps alone misordered actual observations when Redis reads or responses were delayed. | Atomic shared revisions accompany positive and null list results, direct checks and completed manifests. The client retains negative revision markers. Both cache-replay directions and delayed-before/after-read service cases pass. |
| Reader completion did not update the same snapshot marker; the older-chapter no-write path returned revision zero and could make a valid chapter appear obsolete. | Reader completion records its revision. Retaining a newer title-counting proof now returns the current atomic revision. The exact A-complete, B-newer-counting-proof, A-ticket-serves, A-reader-opens case passes. [readable.mjs:17](C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga/server/catalogue/readable.mjs:17) |

No issue in this table remains open in the reviewed source.

## Independent execution

Final runs used the bundled Node 22 runtime and the dedicated local Redis at `redis://127.0.0.1:16479`, with isolated random fixture namespaces:

| Run | Result |
| --- | --- |
| `catalogue-deadline`, `readable-performance`, `readable-client` and `readable` test files | **36 passed, 0 failed, 0 skipped** |
| Reviewer-only service/client/Redis reproductions | **14 passed, 0 failed, 0 skipped** |
| In-memory generation of the browser companion, with `write:false` | Exact byte match with the delivered `dist/catalogue-core.js` |
| Original Metro SHA-256 | Preserved: `4ca7ae590a4065290203fe34e743fcb9e08253d93026aeee7a5bf25efd8b4e07` |

Reviewer fixtures are saved in [KURO_4.5_PERFORMANCE_REPROS.test.mjs](C:/Users/Aslam/Documents/Codex/2026-10-12/referenced-chatgpt-conversation-this-is-an-2/work/readable-review/KURO_4.5_PERFORMANCE_REPROS.test.mjs). They include real image-byte validation and signed-ticket refusal, stale-body replay, both inventory-delay directions, the mounted collection, reader consistency, empty snapshots, group restrictions, expiry and revocation. The slow-unlock variants add a controlled delay at the lock-rejection boundary. The snapshot-ordering service-delay fixtures use the memory coordinator; the atomic Redis read itself was separately exercised against real Redis, including simulated stale ordinary reads.

Re-run the four repository files with `TEST_REDIS_URL` set to the dedicated local fixture. Run the reviewer file with `REVIEW_REDIS_URL` set to that fixture. The reproduction file contains only public synthetic metadata, generated image bytes and fixture credentials.

## Performance evidence and actual limits

- The controlled 12-page validator case completes in one invocation, versus six invocations at two pages per call. All pages are required, and the fixture observes at most two concurrent image checks. Warm canonical list evidence skips per-title readiness and chapter calls in the client test. This establishes reduced work and request counts; it is not a measured production latency guarantee.
- The implementer separately reports **232/232 full Node tests**, **46 browser checks**, and a passing build with **66 resource/native checks**. Those broader suites and browser timings were not independently repeated by this reviewer. The generated companion and original Metro were independently checked as described above.
- No new production deployment, authenticated live session or public before/after performance measurement was performed by this reviewer. The reported pre-fix live timings and controlled browser timings are implementer evidence. Cold titles, slow image hosts, rate limits and outages can still take longer.
- Proof reuse retains the six-hour complete-chapter window and current rating requirement; it does not establish current availability for every remote chapter. The earlier audit remains a historical **partial sweep of 100 candidate entries**. This patch neither renews that audit nor establishes a whole-provider readable count.
- No implementation or index was mutated. No private environment file, user session database or credential was inspected. The reviewer wrote only this report and its standalone fixture file in the primary workspace. Deployment and packaging remain with the implementer.
