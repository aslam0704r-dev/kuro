# KURO 4.1 test and verification results

Checked on 13 October 2026. Source availability records have their own exact UTC timestamps.

## Automated checks

| Suite | Result | Scope |
|---|---:|---|
| Full Node suite | **151 passed, 0 failed, 0 skipped** | Auth/session/CSRF, private avatar validation and SQL policies, catalogue model, canonical routes, transport/tickets, new parsers, filters, tile reconstruction, cache capacity, shared real Redis and deadlines. |
| Catalogue browser | **12 passed** | Actual compiled runtime, source registration before startup/deep links, directory paging/search/filtering, preferences/library preservation, grouped editions, corrupt-readiness rejection, cached and next-chapter credits, mobile layout. |
| Profile browser | **13 passed** | Name updates, upload/replace/remove, ownership/account switch, safe text, focus, navigation/logout and mobile behavior against a local Supabase fixture. |
| Profile regressions | **3 passed** | Unsaved name preservation, account-specific photo refresh, uncertain-save timeout. |
| Profile motion | **11 passed** | Animated editor, preview/tilt/avatar effects, live name feedback, drag/drop, reduced motion and mobile controls. |
| Compact install notice | **10 passed** | APK/EXE selection/download hashes, small corner layout, focus preservation, dismissal/reentry, polite announcements and reader-route suppression. |
| Native browser behavior | **13 passed** | Real packaged download bytes and integrity, unsupported/failed install offers, iPhone/browser fallback and metadata response deadlines. |
| Install lifecycle | **3 passed** | Reentry after appinstalled, standalone behavior and stalled response body handling. |
| PWA/browser smoke | **12 checks passed** | Assets/fonts, notice/fallback/keyboard focus, prompt handoff, mobile/standalone, offline navigation and Google UI handoff. |
| Full build | **Passed** | Bootstrap generation, exact original export SHA-256, 55 deployed resource references, native artifact hashes/certificate/assetlinks. |

Browser fixtures exclude public source traffic where it is unrelated to the tested UI. Initial old install fixtures waited for networkidle while the added provider routes were doing real network work; nine timed out. Their source-network masks were extended and the full install suite passed. This was a test boundary correction; installation product code was not changed.

The full Node run used a **dedicated local real Redis** at port 16479 with isolated test prefixes. It did not use a production account store. A separate reviewer’s fixture run skipped its two Redis integrations; the 151-test release run did not skip them.

## Public provider checks

- The attachment contains **1,254 unique names**. Current source configuration and provider sites were used to discover addresses; one exact CSV row is retained for each name.
- **1,192 distinct candidate URLs** were checked across discovery iterations. In the final mapping: **807 names** have a reachable response, **391** have a failed request, **52** have no resolved address, **1** returns a challenge, and **3** are parked. These are address observations, not reader certifications.
- **250 website-family reader candidates** were exercised. **102 selected pipelines** passed catalogue, real title search, public chapters, manifest and first/last decoded image checks. Failed query/layout/locked/invalid-image cases remain visible in the evidence.
- The actual KURO server then exercised **101 selected installed server connections**, including canonical reconstruction, first/last decode, authenticated public-page ticket generation and accurate same-origin image serving. **96 passed** after failures were retried once at reduced concurrency. **Akaza Scans, 3asq, Decadence Scans, Nyx Scans and AzoraMoon** timed out in the final run; their earlier raw samples passed. They are marked for retry, not called permanently offline or currently certified readable.
- The directory offers **109 installed reader adapters**, including preserved originals, plus six metadata sources and WEBTOON’s official catalogue. It does not claim all 1,254 names are in-app readers.

`PROVIDER-AUDIT.json` records the exact selected titles/chapters, sample dimensions, MIME, byte counts, errors and timestamps. `PROVIDER-STATUS.csv` contains the per-name check outcomes. Unchecked titles, chapters, editions and future releases were not certified.

The final actual-browser preview opened **Pick Up a Grimoire, Become a Mage, chapter 1** from Asura through the compiled KURO search/title/reader flow. **All 29 canonical page requests returned 200 with valid WebP responses**, source credit was visible, both initially rendered images loaded, and the browser reported zero JavaScript errors. The source directory registered all 116 adapters and the 390-pixel layout had no horizontal overflow. `PROVIDER-PREVIEW-CHECK.json` records this one complete selected chapter; it does not certify other chapters.

## Independent code review and repaired findings

An independent read-only reviewer inspected the new parsers, canonical host configuration, preservation of original IDs and compiled runtime registration. The final review has **no remaining confirmed Critical or Important finding in that reviewed scope**. It is not a security certification of unrelated or live infrastructure.

Five confirmed issues were reproduced and repaired with regressions:

1. API sources ignored existing status/type/genre filters. They now filter the returned page and explain that scope.
2. Refresh could overrun the hosted function before saving its cursor. It now commits each selected wave first, limits the batch and has a 42-second overall deadline.
3. Valid JPEGs could restore to an internal lossless WebP exceeding the external download limit. Restoration now encodes to the serving budget before delivery validation. The original 2200×2200 case serves at 2,824,618 bytes with unchanged dimensions.
4. Ordinary reader requests inherited cancellation from an identical refresh inflight promise. Coalescing now separates cancellation scopes while sharing valid cached data.
5. Expired work also cancelled its Redis lock cleanup. Cleanup now has an independent bounded signal; the controlled repro leaves zero locks.

Tests also enforce source-side premium/future chapter exclusions, exact HTTPS origins, private/reserved-address rejection, safe redirects, exclusion of Cookie/Authorization from public provider requests, MIME/signature/decode limits, signed bounded tile maps, and preservation of non-involutive tile direction.

## Preserved and unverified areas

The original exported Expo bundle and protected authentication/profile/native/Storage files are checked byte-for-byte during packaging. The new code is a startup extension; no absent editable Expo source is claimed to have been rebuilt.

Private account/profile tests used fixtures and local SQL/Redis. No live Supabase policies, real private accounts, cloud redeployment, native physical-device installation, Windows trusted signing or exhaustive remote catalogue was verified. The ZIP includes deployment steps and the existing Storage migration for the user’s project.
