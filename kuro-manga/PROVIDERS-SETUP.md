# KURO 4.6.1 provider choices

Open **Settings → All 1,236 providers**. Only installed, content-eligible and configured connections can be switched **On**. Unavailable switches are disabled and explain the missing requirement. MangaDex reading and AniList metadata start On in fresh settings when deployment configuration allows them. Existing explicit Off choices are preserved. **Use verified defaults** restores usable verified source selections without resetting other preferences or language choices. Choices stay on the current device.

The same rule applies to individual switches, bulk actions, saved-setting migration, runtime source IDs, directory refresh and the older Settings cards. Old unavailable On choices become Off, retaining an explanation. Home/Search show a source-specific explanation and an explicit MangaDex recovery action when there is no selected online reader. Metadata-only selection does not supply chapters. Device imports remain available in Library when enabled. Adult, suggestive and unrated titles remain hidden. See [the 4.6.1 report](docs/PROVIDER-ACTIVATION-4.6.1.md).

Readable titles now require at least one completely checked chapter and confirmed editions are always grouped. The Providers screen shows the recent verified inventory count with its scope. Read [READABLE-CATALOGUE.md](READABLE-CATALOGUE.md); the bundled 100-entry live audit does not establish a count for the entire provider.

Mandatory strict content rules still govern actual metadata, covers and pages. Enabling a saved source choice cannot bypass them. See [STRICT-CONTENT.md](STRICT-CONTENT.md) for the full policy and deployment.

| Current registry state | Count |
| --- | --- |
| Eligible positive rating contracts | 2 |
| Restricted because no supported positive rating evidence exists | 1,213 |
| Blocked adult-labelled or explicit sources | 21 |
| Total audited entries | 1,236 |

MangaDex is eligible for explicitly safe titles and canonical related chapters. AniList is eligible for non-adult metadata with complete non-adult tag flags. Other adapter source is preserved for future reviewed integrations but cannot supply KURO discovery, covers or reading under this policy.

Open Settings → All 1,236 providers. Reading links appear only for active reader connections. Metadata connections are labelled as information sources. External-only platforms can have a safe HTTPS **Visit platform** link while their KURO switch remains unavailable. Unresolved entries have no fabricated browse link. Adult-source classification stays visibly blocked and supplies no content or platform link. Offline fallbacks cannot grant content approval. Comix has no installed KURO connector; normal server requests to its site and API returned access restrictions during this investigation. It cannot be activated by changing its switch.

The audit of every registry entry is [CONTENT-PROVIDER-AUDIT.csv](docs/CONTENT-PROVIDER-AUDIT.csv). This is policy eligibility coverage; it does not assert that all websites or chapters were visually inspected. Earlier availability reports remain historical evidence in docs/.

Deploy the complete source with Node22, Other framework, `npm ci --ignore-scripts`, `npm run build`, output `dist`. Retain your existing server-only Supabase, account encryption, Upstash, PUBLIC_ORIGIN and cron settings. No new secret or Supabase migration is required. Existing licensing restrictions and scanlation removal exclusions remain active; MangaDex stays unavailable for a commercial/licensed usage mode.

Active public queries refresh on demand and through the existing visible-tab refresh. The daily authorized Vercel cron refreshes the eligible MangaDex feed; sources outside the rating policy are never crawled by it. Rating evidence caches for at most30seconds; errors have no stale-positive fallback. Cover/page delivery uses no-store and rechecks current approval before cached image bytes are used.

Do not claim that every upstream image has been checked for adult content. Metadata labels can be incorrect. Use the deployment-owned denylist to quarantine mislabelled content, and review it before further admission.
