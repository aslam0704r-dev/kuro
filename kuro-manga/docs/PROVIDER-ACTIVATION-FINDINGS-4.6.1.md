# KURO provider activation findings

Checked against the current 4.6.0 source and live website on 15 October 2026.

## Reproduced user report

In an isolated guest browser, all sources were switched off and Comix was selected. Its selection was saved, but the actual active-source list was empty, there was no Comix adapter in the source manager, and Home displayed no manga. No Comix catalogue request was made. The page did not explain this beside the empty Home results.

Comix currently has `adapter:null`, `website:null`, `mode:unresolved` in KURO's registry. Both published domains, `https://comix.to/` and `https://comix.ws/`, returned HTTP 403 to KURO's normal server transport during this check. A public search listing confirms the second domain is published as an alternative, but cached search visibility does not establish current server access. No anti-bot challenge was bypassed.

## Every-entry integration audit

Each of the 1,236 entries was tested as the sole saved remote selection using KURO's actual catalogue core, source manager and current content policy, and compared with its server directory availability.

| Outcome | Entries |
| --- | ---: |
| Runtime enabled | 2: MangaDex reading and AniList metadata |
| Connector code exists, but the strict positive rating contract is missing | 93 |
| Blocked as adult/content-restricted sources | 21 |
| External platform entries without a KURO reader | 673 |
| Missing connector and confirmed current address | 447 |
| Total | 1,236 |

The same saved-selection/actual-activation mismatch therefore affects 1,234 entries. Selecting one does not give KURO an adapter, bypass the mandatory content checks, or provide a verified chapter. The earlier release's switches preserved preferences, which did not meet the user's expectation that an On source supplies manga.

## Required correction

1. Use one shared source capability decision for the directory, settings, Home and Search. Show active reading, metadata-only, external-only, missing connector, unsupported rating and temporary access failure distinctly.
2. Explain the exact selected-source problem beside empty Home/Search results, with links to the affected source settings and usable reading sources. Avoid showing a generic reload action for a source that has no reader.
3. Make active switches correspond to supported, configured runtime connections. Preserve stored user choices without representing unavailable sources as active readers.
4. Repair actual connectors where public access and positive content-rating evidence can be established. Full chapter validation, safe image serving and identity binding must also be supported before a provider becomes a usable reader.
5. Keep adult, suggestive and unknown-rating content blocked. Add regressions for Comix-only, every sole-source choice, metadata-only selection, external-only selection, temporary provider outages and normal verified reading.

Connecting additional reading providers requires source-specific catalogue, canonical title/rating, chapter relationship, image-host and proof contracts. Comix currently lacks this integration and rejects server access; a switch-only change cannot supply its manga.

## Evidence and limits

- `KURO-PROVIDER-ACTIVATION-AUDIT.json`: every-entry results and fresh Comix HTTP observations.
- `KURO-PROVIDER-ACTIVATION-AUDIT.csv`: one row per directory entry.
- `KURO-COMIX-ONLY-BEFORE.json` and PNG: live isolated-browser reproduction.

This is a complete integration-state audit of all directory entries. It is not a fresh HTTP availability audit of all 789 websites, or a complete chapter/content audit of their catalogues. No app implementation or deployment has been changed during this investigation.
