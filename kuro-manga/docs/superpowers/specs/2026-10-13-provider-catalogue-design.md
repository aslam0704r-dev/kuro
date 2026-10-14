# KURO provider expansion

## Intent and authorization

The user requested all 190 provider names in their list, readable manga/manhwa, protection against corrupt chapters, no duplicate listings, and automatic release discovery. This implementation continues the latest complete 3.9.1 source. The explicit request authorizes local implementation, public compatibility probes and tests. It does not authorize deployment, contacting providers, accepting new provider contracts, purchasing subscriptions, or bypassing access controls.

## Source facts

The package has editable Node/Vercel server source and an exported Expo web bundle, without its original editable React source. The existing sourceManager is a mutable singleton, with nine adapters. Its provider, identity, pagination, edition and image contracts were traced in `work/provider-analysis/CONTRACTS.md`. A companion module can register adapters and wrap writable boundaries without changing the compiled bundle. Existing account, library, history, reader motion, private avatar service and APK/EXE installers must survive intact.

## Provider directory

Preserve every requested name and category. Canonical aliases are Manga Baka/MangaBaka, MangaGeko/Mgeko and Blue Solo/BlueSolo; other similarly named domains remain separate unless independently confirmed. MangaBaka belongs to metadata rather than a reading platform. Record the checked address, timestamp, HTTP result and compatibility separately; a reachable homepage is not proof that chapters work. Never link a parked or ambiguous domain as an authenticated provider.

The directory has searchable, category and availability filters, concise statuses, source preferences for actual installed adapters, attribution and safe external links. Services with subscription, region, publisher or account restrictions open their own platform. Unknown addresses remain unlinked and unavailable. They must not have fabricated catalogue results, chapters or a Read button. The existing Settings source controls include actual installed adapters only.

## Readable adapters and metadata

Reuse the nine original adapters. Add a public Guya API adapter, a Dynasty adapter, and a Madara HTML family for sites whose public structures are verified. Each is independently probed for feed, search, details, chapter list, manifest and decoded sample pages. Supported selectors and per-provider origins are explicit. A failed test changes availability; no CAPTCHA solver, paid-content unlock, provider-cookie forwarding or script evaluation is permitted.

Add AniList, Jikan, Shikimori and MangaBaka metadata adapters with real pagination, stable IDs and attribution. MyAnimeList remains an official metadata link until its documented API client configuration is supplied. Existing Kitsu and MangaUpdates remain. Metadata cannot generate reading pages or synthetic release dates. MangaBaka remains disabled until `CATALOG_USAGE=noncommercial` or the deployment confirms applicable licensed use. AniList caching is bounded and ephemeral and must not become a harvested database or backup service.

## Integrity and authorization boundaries

Fetch only HTTPS from exact configured provider origins and explicitly verified image hosts. Pin public DNS results for every request and redirect. Deny credentials, nonstandard ports, private/reserved addresses, oversized bodies, slow streams and unexpected content. Do not disable certificate checks. Catalogue endpoints never forward account cookies, tokens or arbitrary user headers.

The legacy-adapter manifest endpoint accepts a bounded, same-origin JSON request and only known provider page origins. It validates page order, URLs, count and duplicates and decodes the first and last pages before reporting readiness. It issues tamper-resistant page tickets. Every page loaded through the page service checks MIME, file signature, size, dimensions and full decoding before serving. Sample readiness checks cannot prove the untouched pages; errors must remain visible and retryable. A changed, missing or corrupt upstream page is rejected rather than represented as a successful blank page.

Preserve encrypted Supabase sessions and private profile storage. Public catalogue caches use a separate namespace, exclude user account data, have TTL/capacity limits, and never persist manga image files. Production rate limits and provider request budgets use atomic shared Redis counters/locks. If shared rate coordination is unavailable, new remote reads fail clearly instead of overwhelming providers.

## Duplicate handling

Deduplicate identical source IDs and identical chapter IDs. Group cross-provider editions only from shared verified metadata IDs, or a matching Unicode title with matching author when neither side carries contradictory verified IDs. Preserve language, part, season, remake, sequel and volume distinctions. Return edition alternatives without deleting their source-specific identities or reading progress. Home and search must use the same grouping rules. Unknown matches are kept distinct. Repeated page URLs are removed, with original order retained.

## Updates

While the app is visible, periodically clear only public source caches/readiness and invalidate actual `home-ranked-v1`, `discovery-v2`, details and chapter-list queries. Refresh on returning to the app and reconnecting, with a minimum interval and no refresh while hidden. Provider caches and backoff remain authoritative; HTTP 429 honors Retry-After. One slow or failing source does not block successful providers.

Add protected server refresh for implemented feeds. Vercel Hobby-compatible daily cron plus ordinary cache-expiry reads provides background refresh; an external scheduler or appropriate Vercel plan may invoke it more frequently. Require a private `CRON_SECRET`, compare it safely, and never embed it in the browser. Releases appear after the upstream publishes them and KURO's next successful supported refresh, not instantly across every listed service.

## Evidence and delivery

Test registry coverage/aliases, edition boundaries, unsafe URL/DNS/redirects, corrupt/oversized images, tampered tickets, provider pagination/parsing, Redis limits/cache/backoff, CSRF and cron authentication, browser settings/search/reader/refresh, and existing account/install regressions. Probe all supplied names to a verified or unresolved result, and every implemented adapter with bounded real samples. Record failures as failures. Deliver the complete source ZIP, provider audit, exact setup/configuration, reproducible tests, sample scope, hashes and a working local preview. No live deployment or all-title verification is claimed.
