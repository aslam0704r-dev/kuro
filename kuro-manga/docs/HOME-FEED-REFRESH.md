# Home feed and cover corrections

## Display
- Replaced cropped, full-width editorial banners with contained portrait-cover cards.
- Source labels, titles and actual chapter metadata sit alongside the cover, not over it.
- Two columns on wide desktops; one compact column on smaller screens.
- Removed editorial artwork zoom that could crop the cover again.
- Home brand header now has its own layout space, rather than overlaying section headings.
- Shared manga cards also use contained cover artwork. Known MangaDex/WeebCentral original
  transforms remain; MangaRead WordPress thumbnail suffixes now resolve to the verified
  original-image path, with the supplied thumbnail as fallback. No artificial HD/upscaling.

## Feed selection
- Home no longer reuses the same small trending list for spotlight, editorial and shelves.
- Popularity and latest-update feeds load independently per enabled, capable source.
- Up to 24 records per source/feed are considered; slow source responses do not block others.
- Existing bounded chapter/page-manifest verification remains required before display.
- Source rankings are interleaved in their own order; different sources' scores are not
  treated as comparable, and nothing is randomly shuffled or manually hard-coded.
- Placement order: five popular spotlight picks, six distinct latest-update cards,
  up to sixteen other popular titles, then up to sixteen more updates.
- Edition/title aliases are grouped only for Home placement. Long near-identical title
  variants are additionally suppressed for visual variety; this is NOT a catalogue merge.
  Search, edition identities and saved reading history remain separate.
- Continue-reading and explicitly selected mood results are excluded from other placements.
- Missing latest-chapter numbers remain unspecified rather than invented. Latest-update
  order is supplied by each source; there is no claim of a real-time global chart or a
  verified new-series publication date. Partial feed failures are disclosed on Home.

## Verification
- Strict TypeScript and source rules: 202 files checked.
- 35 unit tests pass, including source interleaving, cross-section deduplication,
  long title variants, continue-reading exclusion and known cover URL transformations.
- 19 Home browser checks pass; 24 distinct Home picks were present in the captured run
  while availability checks were still ongoing. This is a test snapshot, not a guaranteed
  count or a global catalogue total.
- All six update-card covers use contain; displayed widths are capped at 128 CSS pixels.
- The two tested MangaRead originals decoded at 1000 and 1280 pixels wide instead of 110.
- Desktop and 320/390/700 layouts tested: no horizontal overflow or header/card overlap.
- Updated-series detail navigation and See all -> Latest search verified.
- Premium chapter-split/skip/reduced-motion suite and existing live-source reader suite pass.
- Web and Android Hermes exports pass. Physical Android installation/FPS profiling remain untested.
- Backend/auth/store/route/reader-component files match the previous premium archive.

Evidence: `docs/screenshots/home-refresh/verification.json` and screenshots beside it.
Run `node scripts/home-refresh-e2e.mjs`, optionally with `TEST_URL`.

## Changed files
- `src/screens/HomeScreen.tsx`
- `src/components/MangaCard.tsx`
- `src/utils/coverQuality.ts`
- `src/components/premium/premium.css`
- `src/components/premium/EditorialSelection.tsx`
- `scripts/premium-e2e.mjs`

## Added files
- `src/components/CoverArtwork.tsx`
- `src/screens/home/homeSections.ts`
- `src/screens/home/useHomeCatalogue.ts`
- `scripts/home-refresh-e2e.mjs`
- `scripts/home-sections.spec.ts`
- `scripts/cover-quality.spec.ts`
