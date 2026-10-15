# KURO 4.6.0 — source choices and progressive loading

Release date: 15 October 2026. Base commit: `a5633b8a08b27846786af5b6673a06252341a2f5` (4.5.0).

## Requested behavior

The user asked for faster home/search listings, verified providers enabled by default, and additional providers disabled by default with switches in Settings. The user approved optional source selection. The earlier adult/hentai and unrated-title exclusions remain in force; source selection does not grant content approval.

## Settings

Open **Settings → All 1,236 providers**. Every directory entry has a saved selection switch, including sources whose connection or ratings are not supported yet. Search and category/availability filters help find entries; **Selected sources** shows saved choices. **Use verified defaults** restores only the source defaults, preserving other settings. Choices are stored on this device using KURO's existing settings store.

- Fresh installations enable MangaDex (safe reading) and AniList (non-adult metadata), subject to deployment configuration. Device imports keep their separate local source.
- Existing explicit Off choices for verified sources survive the upgrade. Old automatic defaults for additional sources are migrated to Off once; subsequent explicit choices survive reload, refresh and offline registry fallback.
- Selecting an unsupported source saves the choice and explains why approved results cannot currently load. External platforms can provide a Visit link; unresolved entries have no fabricated reader or link. Adult-classified sources remain subject to content blocking and have no outbound platform link in KURO.
- Actual runtime IDs include only installed, content-eligible and configured sources. External/unresolved choices cannot crash Home/Discovery by reaching a missing connector. Selecting one does not invalidate unrelated verified cards or create unnecessary source requests.

| Registry property | Count/scope |
| --- | --- |
| Directory entries with saved selection switches | 1,236 |
| Entries with connector code | 116 |
| Reader-capable connector code | 109 |
| External platform links | 673 |
| Unresolved entries | 447 |
| Supported positive rating contracts | 2: MangaDex reading; AniList metadata |

Connector code and an enabled switch do not prove current availability. This release does not add 1,236 working readers or repeat the historical provider audit.

## Loading changes

1. Home/search collections share a two-worker listing queue. A job validates at most one hosted page batch per turn; a still-pending chapter moves behind other titles. Duplicate watchers share the same in-flight step. Removing the last watcher prevents further batches and releases queue capacity. Hidden pages start no new listing work.
2. A short chapter can qualify during its first turn, immediately after metadata preparation. The queue does not prepare every title's metadata before allowing an easy chapter to complete. Smaller chapters remain the first candidates.
3. Search/Discovery queries each provider/page independently. Completed results are merged while slower queries continue. Existing cursor signatures, edition grouping, filters and the 25-page per-source bound remain. Query keys isolate changed searches and source filters. Home already used independent feed queries and retains that behavior.
4. The legacy MangaDex HTTP helper deduplicates concurrent GETs, caps response caching at ten seconds and the rating evidence's expiry, and honors numeric/HTTP-date Retry-After without immediate retries. Page and readiness requests share its source cooldown. A throttled listing stays pending and releases the worker.
5. Existing complete-chapter proofs, expiry and atomic inventory revision ordering remain authoritative. A partial manifest, another chapter's manifest or a corrupt page cannot qualify a card. Direct-reader selected-chapter validation and existing Library/history full checks retain their earlier behavior; the two-worker listing limit is not a claim about every request in the whole application.

No dependency, server environment variable, private key, database migration, Storage policy or native installer rebuild is required. Existing Supabase/private avatar SQL and deployment configuration remain in the full source.

## Verification and limits

New test cases were run failing before their implementations. The original 4.5.0 bootstrap was also replayed against the same controlled three-title cold fixture: two long pending chapters blocked the short title beyond the six-second assertion on both Home and Search. The patched browser shows the short title while both long chapters remain pending. These fixtures have fast synthetic responses; their sub-second timings are not production speed guarantees.

Provider selection, fresh/reset defaults, persistence, missing connectors, blocked admission, shared queue concurrency/lifecycle, metadata/page backoff, progressive query results, paging and query-key isolation have focused regressions. Existing policy/readability/reader/profile/email tests are rerun. Exact final counts and independent review evidence are recorded in `PROVIDER-LOADING-EVIDENCE-4.6.0.json` and `PROVIDER-LOADING-REVIEW-4.6.0.md`.

The end-to-end streaming browser experiment that assumed device imports appeared in Discovery was discarded: the existing local adapter deliberately exposes imports in Library and returns an empty discovery catalogue. This feature remains unchanged. Progressive provider completion has direct hook regression coverage; the production policy currently admits only one remote reading provider. A universal multi-reader live result is not claimed.

Cold titles and slow image hosts can still require multiple turns. Source budgets, outages and complete-chapter/content checks remain mandatory. Public deployment status and fresh production observations are recorded separately after the authorized push. This release does not renew the historical 100-candidate audit, verify all provider titles, or test live authenticated Supabase Storage/RLS.

## Final local results

- Automated Node checks: **271 passed, 0 failed, 0 skipped**, with the dedicated real Redis test instance.
- Browser checks: **56 passed, 0 failed** across provider selection/loading, content, readability, profile and email suites.
- Production build, immutable original-export hash, native release asset validation and whitespace checks passed.
- The preview server and dedicated Redis fixture were restarted after the tool interruption; the final results above come from complete fresh reruns. Earlier connection-refused fixture attempts are not counted as product results.
