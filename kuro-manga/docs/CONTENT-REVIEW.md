# KURO 4.3.0 independent content-rule review

Date: 2026-10-14. Reviewed against the delivered 4.2.0 source. Review was read-only, used isolated local fixtures, and did not inspect private environment values, signing material or actual user databases.

## Findings resolved

| Finding | Change | Regression evidence |
| --- | --- | --- |
| The original export could start if the strict bootstrap failed. | `dist/startup.js` starts Metro only after the mandatory companion boundary loads; otherwise it shows an unavailable screen. | Browser blocks catalogue-core.js and confirms the old export does not initialize. |
| Empty/whitespace tag labels counted as verified data. | Both classifiers reject empty tag/genre labels. | Policy tests exercise empty, whitespace and missing labels. |
| Device reader verified one storage snapshot and displayed another. | Exact display blobs are rehashed and their book identity is confirmed before URL creation. | Browser swaps the second page snapshot and expects rejection. |
| Moderation denylist edits could leave a short-lived cached list row visible. | Current denylist is checked when returning cached server rows and in client current/remember/verify/queue paths. | Reviewer confirmed source and built-asset changes; canonical image/check routes also enforce the denylist. |

The title regression also found that filename cleanup truncated edited titles containing slashes/closing markup. Edited display titles now use a separate text cleanup; they remain literal text, and adult-label checks still apply.

## Final assessment

The reviewer reported **no outstanding substantive issue in the reviewed admission paths** after the fixes. It specifically checked canonical chapter-to-manga relationships, rating checks before image-cache delivery, old ticket invalidation, proxy closure, provider opt-out attempts, non-mutating saved-state projections and exact local fingerprints.

The reviewer independently passed the focused policy/device/import checks and confirmed the original Metro export's SHA-256:

`4ca7ae590a4065290203fe34e743fcb9e08253d93026aeee7a5bf25efd8b4e07`

This was an implementation review. It did not assess the correctness of all upstream labels, visually inspect remote chapter pages, install native binaries, deploy to Vercel or verify live Supabase policies. Those limits also apply to the release claims.
