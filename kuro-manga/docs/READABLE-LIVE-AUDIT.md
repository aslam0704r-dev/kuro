# KURO 4.4.0 live readable audit

## Exact verified count

**72 unique readable titles** in this explicitly limited audit. Every qualified title has one complete chapter whose actual image bytes passed MIME/signature, size, dimensions and full decoding. This is **not a full-provider total**.

| Measure | Result |
| --- | ---: |
| Candidate entries checked | 100 |
| Qualified complete chapters / editions | 72 |
| Unique readable title groups | 72 |
| Duplicate editions grouped in this sample | 0 |
| Pages fetched and decoded | 2134 |
| Excluded or unverified candidates | 28 |
| Content-restricted before page access | 1 |
| No eligible English chapter offered | 26 |
| Provider-reported candidate entries | 41337 |

## Scope and time

- Provider: MangaDex; positive safe rating, strict tags/text rules, English on-provider chapters.
- Candidates: first 100 entries in creation-date order, with server canonical metadata rechecks. Not a random/statistically representative sample.
- First completed proof: 14 October 2026 at 8:15:36 pm IST.
- Last completed proof: 14 October 2026 at 8:26:11 pm IST.
- Inventory count recomputed: 14 October 2026 at 11:24:10 pm IST.
- Qualification window: six hours from each proof's oldest page check; expired/revoked proofs leave the shared count.
- Complete provider sweep: **not performed**. The 41,337 candidate entries are not all validated unique readable titles.
- Private device comics: excluded from the remote count and remain local to their browser/device.

Public evidence is in data/readable-audit.json: each qualified title/chapter ID, page count, check time and per-page SHA256/MIME/dimensions. docs/READABLE-AUDIT-CHECKPOINT.json preserves the full partial-sweep results and cursor for a later resume. No private auth tokens or signing keys were used for this check.

Source: [MangaDex public API](https://api.mangadex.org/manga?limit=1&contentRating%5B%5D=safe&hasAvailableChapters=true&availableTranslatedLanguage%5B%5D=en); its candidate total was directly read during this audit.

Availability can change. This audit validates technical delivery for one chapter per qualified title, not every chapter or the accuracy of every publisher content rating. Human visual review of all external pages and live KURO deployment are not claimed.
