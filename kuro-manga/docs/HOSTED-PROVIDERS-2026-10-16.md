# Hosted provider recovery

This update keeps KURO on its existing Vercel deployment. It needs no personal
computer, new server subscription, credentials or database migration.

## Repaired behavior

- Provider controls previously stopped initializing after approximately three
  seconds if the main application bundle had not finished downloading. A
  controlled 3.5-second delay reproduced the failure against the previous
  production bridge. The bridge now waits up to 15 seconds and stops waiting as
  soon as the source manager and preferences are ready. The same delayed-bundle
  check passes with this repair.
- Refresh connections fetches the directory directly with a 12-second timeout.
  It no longer waits for catalogue feeds, clears current reading proofs, or
  reports a failed directory request as a successful refresh. Failed requests
  leave the prior directory and source preferences intact.
- The directory starts with usable readers. Searching by name also finds
  unavailable entries while this automatic filter is active. Show all provider
  entries exposes the full directory. Manual availability filters are respected.
- Browse available manga explicitly enables MangaDex and opens its search.
  It does not switch on Comix or label MangaDex results as another provider.
- The server reports connection reasons and counts separately from registry
  entries. A reader without the required signing key is no longer advertised as
  usable. Metadata sources remain distinct from readers.
- The MangaBaka parser now understands v2 string cover URLs and multilingual
  titles, and uses v2 endpoints. This is a parser repair only: MangaBaka remains
  restricted until a supported complete content-rating contract is implemented.

## Current provider limits

Live hosted searches for MangaDex and AniList returned HTTP 200 during this
investigation. The directory still contains 1,236 entries and only one supported
reading provider, MangaDex; AniList supplies metadata. Of the registry entries,
1,120 have no adapter declaration. A declared adapter also needs supported
ratings, canonical chapter relationships and validated page delivery.

Earlier ordinary Comix API/browse checks returned HTTP 403. A new ordinary API
request timed out. Its KURO connector remains missing. MangaBaka v2 details
returned HTTP 200 once, while its search and subsequent requests returned 403.
These observations do not establish working Comix or MangaBaka access from
production. No challenge bypass or external proxy was introduced.

The strict content policy, full-chapter decoding requirement, rate coordination,
image host restrictions and signed reader page delivery remain in force.

## Verification

- Node 22.23.3 with dedicated Redis: 301 passed, zero failed or skipped.
- Production build passed export integrity, referenced asset and native release
  byte checks.
- Controlled delayed-start comparison: previous bridge failed; repaired bridge
  passed.
- Browser suites: provider loading 15, source activation 10, strict content 16,
  qualification 6 and warm/invalid-proof behavior 4: 51 checks passed. Cover
  assertions wait for image rendering; invalid-proof assertions wait for the
  actual qualification result instead of treating network idleness as proof.

These checks verify the implementation and controlled reader flow. They are not
an all-provider live availability or every-chapter audit.
