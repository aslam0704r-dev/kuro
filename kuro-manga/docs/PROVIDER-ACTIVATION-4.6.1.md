# KURO 4.6.1 — provider activation correction

Client date: 16 October 2026. Base commit: `ef92f92e55db56154f3c4cb0e0d3fe410f29d048`.

## The reported problem

Version 4.6.0 saved an On choice for every directory entry, including entries with no working KURO connection. A Comix-only selection therefore showed On in settings while the runtime had no reader to run. The generic empty Home/Search screen did not explain that mismatch.

The user approved reserving On for usable sources. This correction applies that rule throughout the existing app; it does not introduce a new Comix reader.

## Behaviour

- A shared activation decision checks for an installed adapter, supported content policy, actual client registration and deployment availability. Temporary errors on an individual chapter do not permanently disable a configured source.
- The directory, older Settings cards, single-source setter, bulk setter, source-only defaults and runtime selectors use that decision. Unavailable directory switches stay disabled and explain why. Metadata is clearly labelled as information without reading pages.
- Preference version 2 changes old unavailable On flags to Off and retains a reason. Explicit Off choices, source languages, unrelated reader preferences, saved library entries and account data are preserved. A subsequently repaired connection stays Off until chosen by the user.
- Home and Search reuse the original app's empty-state component when there is no active online reader. They offer **Turn on MangaDex** and **Manage providers**. An old source-filtered Search link offers **Use MangaDex** and changes its source only when clicked; the search text is retained.
- A usable reading selection renders the existing Home/Search screens. Device imports continue to use Library. External-only entries can offer a safe platform link independently of their unavailable KURO switch.
- The mandatory adult, suggestive and unrated-content exclusions, canonical title/chapter checks, deduplication and complete-chapter qualification remain unchanged. Source selection cannot grant content or page authorization.

## Audit of all 1,236 directory entries

Each entry was requested On as the sole remote selection using the actual settings/core/source-manager code and compared with the current server directory. This checks integration and activation, not the live readability of every provider or title.

| Integration result | Entries |
| --- | ---: |
| Usable with current policy/configuration: MangaDex reading and AniList metadata | 2 |
| Connector code exists, but lacks the supported positive content-rating contract | 93 |
| Blocked by adult-source rules | 21 |
| External platforms without a KURO reading connection | 673 |
| Missing connector or confirmed address in the installed directory | 447 |
| Total | 1,236 |

After the correction, **zero** saved On choices lacked an active runtime connection in this audit. Connector code exists for 116 entries, of which 109 are reader-capable code; those inventory figures do not mean 116 approved working connections. See the [after audit JSON](PROVIDER-ACTIVATION-AUDIT-4.6.1.json) and [one row per entry](PROVIDER-ACTIVATION-AUDIT-4.6.1.csv).

### Comix

Comix has no installed KURO adapter. Ordinary public server requests to `https://comix.to/` and `https://comix.ws/` received upstream HTTP 403/access restrictions during the investigation. The original [before audit](PROVIDER-ACTIVATION-BEFORE-4.6.1.json) records those transport observations; see also [the investigation findings](PROVIDER-ACTIVATION-FINDINGS-4.6.1.md). The after audit does not repeat those external requests. No browser-challenge bypass, upstream script execution, or assumption that a missing rating means safe was added.

## Setup and deployment

1. Update the **existing** GitHub repository and Vercel project with this complete source. Preserve existing server-only environment settings. Use Node 22.x, `npm ci --ignore-scripts`, `npm run build`, output directory `dist` and the included `vercel.json`.
2. No new environment variable, private key, Supabase migration, bucket or storage policy is needed for this correction. Existing profile SQL and setup remain included in [PROFILE-SETUP.md](../PROFILE-SETUP.md). Existing Android/Windows wrappers remain included and load the deployed website.
3. Reload an existing browser or native app after deployment. Do not clear device storage: the app migrates source flags and preserves saved data.
4. If all readers were intentionally Off, select **Turn on MangaDex** or use **Manage providers → Use verified defaults**. AniList alone cannot provide reading pages. Existing licensing/commercial-usage restrictions still determine whether MangaDex can be activated.

## Verification scope and limits

The release evidence records the final local automated, browser, build and independent review results. The browser suites use controlled account/storage/provider fixtures, including safe titles with complete chapter proofs; they do not demonstrate that every upstream manga is readable. All 1,236 integration choices were checked, but all 789 listed websites were not crawled and no complete provider/title sweep was performed.

Live post-deployment checks are recorded separately in the accompanying deployment receipt. This update does not claim a new exact global manga count, universal upstream availability, live authenticated Supabase/RLS verification or installation on every native operating system. The previous 100-candidate/72-qualified audit remains historical, with its stated partial scope.

## Final local results

- Automated Node suite: **286 passed, 0 failed, 0 skipped**, including a dedicated real Redis fixture.
- Browser suites: **66 passed, 0 failed**, across provider activation/loading, content, readability, profile and email login.
- The same ten activation browser cases were replayed against the original 4.6.0 core/directory assets: nine failed on the expected behaviour and one keyboard/persistence preservation case already passed. All ten pass on the corrected build.
- Production build, original-export integrity, APK/EXE release-byte validation and whitespace checks passed. Native installers were not reinstalled on an operating system for this update.
- Independent scoped review found no remaining actionable issue: eight independent Node cases, 24 focused repository cases, 14 retained proof/ordering/Redis regressions and seven browser flows passed. These overlap the main tests and are not added to the release totals.
- Full results and limitations: [machine-readable evidence](PROVIDER-ACTIVATION-EVIDENCE-4.6.1.json) and [independent review](PROVIDER-ACTIVATION-REVIEW-4.6.1.md).
