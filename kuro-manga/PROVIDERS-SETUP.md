# KURO 4.4.0 provider admission

Readable titles now require at least one completely checked chapter and confirmed editions are always grouped. The Providers screen shows the recent verified inventory count with its scope. Read [READABLE-CATALOGUE.md](READABLE-CATALOGUE.md); the bundled 100-entry live audit does not establish a count for the entire provider.

Mandatory strict content rules supersede the earlier 4.0/4.1 opt-in behavior. Mature or unverified sources cannot be enabled. See [STRICT-CONTENT.md](STRICT-CONTENT.md) for the full policy and deployment.

| Current registry state | Count |
| --- | --- |
| Eligible positive rating contracts | 2 |
| Restricted because no supported positive rating evidence exists | 1,213 |
| Blocked adult-labelled or explicit sources | 21 |
| Total audited entries | 1,236 |

MangaDex is eligible for explicitly safe titles and canonical related chapters. AniList is eligible for non-adult metadata with complete non-adult tag flags. Other adapter source is preserved for future reviewed integrations but cannot supply KURO discovery, covers or reading under this policy.

Open Settings → All providers. Available controls honor the mandatory rule even with older saved preferences or a failed registry request. Entries with adult-source classification are omitted from the visible directory. Restricted providers have no browse/platform link.

The audit of every registry entry is [CONTENT-PROVIDER-AUDIT.csv](docs/CONTENT-PROVIDER-AUDIT.csv). This is policy eligibility coverage; it does not assert that all websites or chapters were visually inspected. Earlier availability reports remain historical evidence in docs/.

Deploy the complete source with Node22, Other framework, `npm ci --ignore-scripts`, `npm run build`, output `dist`. Retain your existing server-only Supabase, account encryption, Upstash, PUBLIC_ORIGIN and cron settings. No new secret or Supabase migration is required. Existing licensing restrictions and scanlation removal exclusions remain active; MangaDex stays unavailable for a commercial/licensed usage mode.

Active public queries refresh on demand and through the existing visible-tab refresh. The daily authorized Vercel cron refreshes the eligible MangaDex feed; sources outside the rating policy are never crawled by it. Rating evidence caches for at most30seconds; errors have no stale-positive fallback. Cover/page delivery uses no-store and rechecks current approval before cached image bytes are used.

Do not claim that every upstream image has been checked for adult content. Metadata labels can be incorrect. Use the deployment-owned denylist to quarantine mislabelled content, and review it before further admission.
