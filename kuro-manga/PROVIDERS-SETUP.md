# KURO 4.6.0 provider choices

Open **Settings → All 1,236 providers** to save individual source choices. Verified sources start enabled on a fresh installation; additional sources start disabled. Existing explicit Off choices are preserved. **Use verified defaults** restores source selections without resetting other preferences. Choices stay on the current device.

All directory entries can be selected, including external/unresolved entries. Selection is separate from a working KURO connection and content admission: entries without a usable connection or supported ratings explain why their titles cannot appear. The runtime uses only installed, eligible, configured sources. Adult, suggestive and unrated titles remain hidden. See [the 4.6 loading/settings report](docs/PROVIDER-LOADING-4.6.0.md).

Readable titles now require at least one completely checked chapter and confirmed editions are always grouped. The Providers screen shows the recent verified inventory count with its scope. Read [READABLE-CATALOGUE.md](READABLE-CATALOGUE.md); the bundled 100-entry live audit does not establish a count for the entire provider.

Mandatory strict content rules still govern actual metadata, covers and pages. Enabling a saved source choice cannot bypass them. See [STRICT-CONTENT.md](STRICT-CONTENT.md) for the full policy and deployment.

| Current registry state | Count |
| --- | --- |
| Eligible positive rating contracts | 2 |
| Restricted because no supported positive rating evidence exists | 1,213 |
| Blocked adult-labelled or explicit sources | 21 |
| Total audited entries | 1,236 |

MangaDex is eligible for explicitly safe titles and canonical related chapters. AniList is eligible for non-adult metadata with complete non-adult tag flags. Other adapter source is preserved for future reviewed integrations but cannot supply KURO discovery, covers or reading under this policy.

Open Settings → All 1,236 providers. Every entry has a saved choice; adult-source classification stays visibly blocked and supplies no content or platform link. Reading and metadata links appear only for selected, eligible connections. Selected external platform entries provide safe HTTPS platform links; unresolved entries provide none. Offline fallbacks cannot grant content approval.

The audit of every registry entry is [CONTENT-PROVIDER-AUDIT.csv](docs/CONTENT-PROVIDER-AUDIT.csv). This is policy eligibility coverage; it does not assert that all websites or chapters were visually inspected. Earlier availability reports remain historical evidence in docs/.

Deploy the complete source with Node22, Other framework, `npm ci --ignore-scripts`, `npm run build`, output `dist`. Retain your existing server-only Supabase, account encryption, Upstash, PUBLIC_ORIGIN and cron settings. No new secret or Supabase migration is required. Existing licensing restrictions and scanlation removal exclusions remain active; MangaDex stays unavailable for a commercial/licensed usage mode.

Active public queries refresh on demand and through the existing visible-tab refresh. The daily authorized Vercel cron refreshes the eligible MangaDex feed; sources outside the rating policy are never crawled by it. Rating evidence caches for at most30seconds; errors have no stale-positive fallback. Cover/page delivery uses no-store and rechecks current approval before cached image bytes are used.

Do not claim that every upstream image has been checked for adult content. Metadata labels can be incorrect. Use the deployment-owned denylist to quarantine mislabelled content, and review it before further admission.
