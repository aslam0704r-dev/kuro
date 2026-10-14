# KURO 4.4 scoped source review

Baseline: `outputs/kuro-full-source-4.3.0.zip`. The review covered the changed managed authentication, chapter validation, shared inventory, identity grouping, collection/reader guards, and audit paths. No Git history exists for this comparison. Reproductions use controlled public-format data and isolated review checkpoints; no private configuration or deployment was accessed.

## Review result

No actionable findings remain in the reviewed source scope after the focused repairs and rechecks. This is a scoped source review with controlled runtime evidence, not verification of a live deployment or the entire upstream catalogue.

### Resolved [P1]: A newer proof for another chapter rejected freshly verified reader tickets

**Original cause:** Before the last repair, `servePage()` checked a chapter failure against the single per-title inventory row, requiring that row's `chapterId` to match the ticket. `server/catalogue/readable.mjs:17` preserves whichever title proof has the newest oldest-page `checkedAt`. Those rules disagreed when two chapters finished in overlapping batches.

**Preserved reproduction:** From the parent workspace, run:

```powershell
& '.\work\tools\node-v22.23.3-win-x64\node.exe' '.\work\readable-review\recheck-alternate-proof-reader.mjs'
```

The workspace-only independent reproduction above is a review receipt. Equivalent executable regressions are included in the packaged source:

```powershell
node --test tests/readable.test.mjs tests/readable-client.test.mjs tests/readable-audit.test.mjs tests/content-service.test.mjs tests/catalogue-model.test.mjs
```

1. Fully validate chapter A (three pages), then make a page fail and observe its proof revoked.
2. Repair A and validate its first two pages at time `400002`; the result is pending.
3. Fully validate chapter B of the same manga at time `401003`.
4. Finish A's third page. A correctly returns `verified:true`, `validatedPages:3`, `pageCount:3`, with `checkedAt:400002`.
5. Before the repair, requesting a freshly issued A page ticket failed with status `409` and `This chapter requires a fresh complete check`, because the inventory still selected B.

The original result prevented A from displaying despite its fresh complete proof, and retries reused the same completed progress. The final reproduction now confirms that A's page serves successfully while B remains the title's selected counting proof.

**Implemented repair and final evidence:** `server/catalogue/tickets.mjs:11` authenticates each chapter's proof check time and caps ticket expiry to its proof window; `server/catalogue/service.mjs:155` compares that signed check time with title/chapter invalidation time, independently of the counting row. The same reproduction also confirms that an old revoked ticket is rejected (`409`), a tampered proof time is rejected (`403`), and a ticket past its complete-proof expiry is rejected (`403`). The canonical content gate still runs before page delivery.

## Focused recheck evidence

The earlier cold-start seed/progress resurrection, edition bridge grouping, stale browser expiry, known canonical rating revocation, caller-supplied unrelated chapter revocation, interruption checkpoint, 504 checkpoint, and chapter-specific alternative audit cases were repaired during review. Source inspection and isolated checks confirmed:

- Proof expiry causes a new server check and removes browser readiness.
- Canonical rating rejection removes the inventory entry, while an unrelated chapter request preserves it.
- With valid upstream responses taking eight seconds each, cold chapter setup returns pending with no pages/count at `20,010 ms`; the next request resumes to a complete proof/count in `16,022 ms`.
- Interrupted and 504-failed titles remain pending with `checkedCandidates:0`, then qualify on resume.
- A chapter-specific 403 tries the next valid chapter; canonical parent rejection remains blocked.

The saved live audit is a partial candidate sweep: 100 candidates checked from a provider-reported candidate total of 41,337. Its saved 72-title inventory is evidence for that stated check window, not a completed audit of the provider.

Final recheck ran successfully on the current source using the bundled Node 22 runtime. The reviewer made changes only to the report and isolated reproduction files under `work/readable-review`; no implementation changes or private environment access were required. The review's independent reproductions used the memory coordinator and controlled upstream replies. Redis Lua/coordinator changes were inspected; the separate real-Redis regression results were supplied by the implementer and were not independently rerun as part of this final recheck.

## Final deployment-count amendment

The final count changes were inspected in `server/catalogue/readable.mjs:10`, `server/catalogue/service.mjs:118`, `server/catalogue/service.mjs:119`, and the canonical group recording at `server/catalogue/service.mjs:195`.

A setup edge case discovered during this check was repaired: a missing page-ticket key initially allowed a seed to report `readingConfigured:true` and `ready:true`, while the page endpoint failed with `503`. The current count/configuration gate includes ticket availability and the existing usage rule; the readiness shortcut also requires a configured ticket service.

The independent `work/readable-review/recheck-reading-configuration.mjs` assertions now pass for all seven controlled cases:

| Case | Unique count | Reading configured | Readiness |
| --- | ---: | --- | --- |
| Normal deployment | 1 | true | ready |
| Commercial usage restriction | 0 | false | rejected, 503 |
| Missing page-ticket key | 0 | false | rejected, 503 |
| Matched group opt-out | 0 | true | not ready |
| Old seed with unknown group provenance and configured opt-out | 0 | true | not ready |
| Known group outside the opt-out list | 1 | true | ready |
| Canonically known chapter with no scanlation group | 1 | true | ready |

No further actionable issue was found in this amendment. The source-review, deployment, Redis, and partial-audit scope limitations above still apply.
