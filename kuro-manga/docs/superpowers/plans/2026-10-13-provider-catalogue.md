# KURO Provider Catalogue Implementation Plan

> **For agentic workers:** execute locally with the existing architecture dossier, test-first changes and one independent final review.

**Goal:** Extend the existing reader with verified providers, an honest directory for all 190 requested names, image integrity checks, safe edition grouping and automatic refresh.

**Architecture:** A browser companion adapts the immutable Expo export's writable source boundaries. A separate server catalogue service performs provider requests, validation, caching, rate coordination and protected refresh without touching private accounts.

**Tech Stack:** Node 22, HTTPS/DNS, Sharp 0.35.5, Cheerio 1.2.0, existing Supabase and Redis, browser ES modules, existing Metro/Expo runtime.

**Spec:** `docs/superpowers/specs/2026-10-13-provider-catalogue-design.md`

## Global constraints

- Preserve the original compiled bundle SHA256 `4ca7ae590a4065290203fe34e743fcb9e08253d93026aeee7a5bf25efd8b4e07`.
- Preserve source-specific library/history IDs, private avatar policies and 3.9.0 native installers.
- Never execute upstream JavaScript or forward provider login credentials.
- Keep metadata-only and external platforms out of readable feeds.
- Test and record the scope of live checks; never claim all remote titles were tested.

## Review focus

- A public provider page can contain an attacker-controlled URL; reject non-provider URLs and private-address redirects at fetch and serving boundaries.
- Same name can refer to a different season or author; keep those identities separate.
- Expired readiness data after a provider outage must not display a stale success indefinitely.
- A long-running reader can outlive a short page ticket; use a bounded day-long ticket and keep authorization independent of private account sessions.
- Thousands of source enables must not cause unbounded public-source requests; rate/budget limits, supported adapter controls and bounded feed checks apply.

## Task 1: Registry and deduplication

Files: `dist/provider-registry.json`, `dist/catalogue-model.mjs`, `tests/catalogue-model.test.mjs`.
Interfaces: `groupSeries(items) -> {primary, editions}[]`; `uniqueChapters(items) -> chapters[]`; `canonicalProvider(name,registry) -> provider|undefined`.

- [ ] Write assertions for all 190 names, three aliases, Unicode names, separate parts/authors and conflicting IDs.
- [ ] Run `node --test tests/catalogue-model.test.mjs`; missing module must fail.
- [ ] Implement the static audited registry and pure grouping functions. Shared stable IDs precede conservative title/author fallback. Preserve every edition in returned groups.
- [ ] Run tests and archive baseline comparisons for review.

## Task 2: Bounded provider transport and page integrity

Files: `server/catalogue/transport.mjs`, `images.mjs`, `tickets.mjs`, `tests/catalogue-security.test.mjs`.
Interfaces: `fetchPublic(url,policy,options) -> {body,status,headers,url}`; `validateImage(buffer,type) -> {mime,width,height}`; `createTickets(key).issue/verify`.

- [ ] Test public/private IPv4, exact-origin policy, HTTPS only, redirects, response/deadline limits, HTML disguised as images, truncation, huge pixels, SVG, duplicate pages and ticket tampering.
- [ ] Run the security test file and observe missing implementation failures.
- [ ] Implement pinned DNS HTTPS requests, no cookie forwarding, bounded Sharp decode, HMAC page tickets and structured errors.
- [ ] Run the security tests, including transport against an injected HTTPS boundary and real Sharp inputs.

## Task 3: Cache, budgets and provider adapters

Files: `server/catalogue/cache.mjs`, `adapters/*.mjs`, `service.mjs`, `tests/catalogue-adapters.test.mjs`, `tests/catalogue-cache.test.mjs`.
Interfaces: `adapter.call(action,parameters) -> DTO`; `cache.getOrLoad(key,ttl,task) -> {value,checkedAt,stale}`; `service.call(provider,action,parameters) -> result`.

- [ ] Capture bounded public fixtures from primary sites and test actual parsing, IDs, pagination, numeric chapters, timestamps and author/group credit.
- [ ] Test real Redis atomic cache, budgets, lock release and negative backoff.
- [ ] Implement Guya, Dynasty, verified Madara and four metadata adapters; configure per-provider origins and image hosts from actual fixtures.
- [ ] Run tests and bounded live compatibility checks; classify every error without inventing results.

## Task 4: Routes and deployment refresh

Files: `server/catalogue/routes.mjs`, `server/index.mjs`, `api/kuro.mjs`, `vercel.json`, `tests/catalogue-routes.test.mjs`.
Interfaces: `catalogueRoute(req,res,url) -> boolean`; same-origin `POST /api/catalogue/manifest`; `GET /api/catalogue/page?ticket=...`; `GET /api/catalogue/provider/:id/:action`; protected `GET /api/catalogue/refresh`.

- [ ] Test methods, CSRF, limits, bad IDs/tickets, provider gating, error privacy and missing/wrong/correct cron bearer secrets.
- [ ] Run route tests before integrating handlers.
- [ ] Add route wiring, independent shared catalogue namespace and Hobby-compatible daily cron.
- [ ] Run all server tests and preserve account/security headers.

## Task 5: Browser bridge and directory

Files: `dist/catalogue-bridge.js`, `dist/provider-directory.js/css`, `dist/index.html`, `.21st/design.json`, browser tests.
Interfaces: register adapter objects in `__r(789).sourceManager`; wrap `1706.validIdentity`, `1389.checkReadability/cachedReadability`, `790.uniqueChapters`, `794.groupEditions`, `870.mergePages`, `1342.homeSections`; use `__r(784).useSettingsStore` and `__r(1596).queryClient`.

- [ ] Write browser tests using real compiled modules and controlled network fixtures for new search/detail/reader, directory filters/preferences, retry states, preserved history, hidden-tab refresh, focus, accessibility and mobile layout.
- [ ] Observe failures before adding companion scripts.
- [ ] Implement capability checks, actual shared-reader adapters, validated manifests, safe identity wrapper and targeted refresh. Add a directory beside existing source settings; no fake inactive adapters.
- [ ] Run browser tests and inspect desktop/mobile local preview.

## Task 6: Review, regression and complete delivery

Files: setup/provider status/test evidence docs, release manifest, complete source ZIP.

- [ ] Run all Node, account/PWA/install and new browser suites, with dedicated Redis tests.
- [ ] Independently review changed source and boundaries; test regressions for material findings and fix them.
- [ ] Generate the provider status CSV/Markdown, actual test counts, live sample report and setup/configuration with primary documentation links.
- [ ] Build, inspect complete ZIP membership/CRC/public assets, check original bundle/native hashes and exclude keys, accounts, databases and caches.
- [ ] Leave a functioning local preview and deliver only concrete evidence-backed claims.
