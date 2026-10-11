# KURO — Premium Cinema update (based on restored 3.6)

## Chapter-opening split

The actual chapter number is typeset across the centre seam of two ink-coloured panels.
After a 380 ms hold, the panels slide apart over 900 ms, with a small opposing horizontal
shift in the split typography. The overlay removes itself after 1.35 seconds.
Decimal numbers such as **30.1** and **30.15** are preserved, not rounded.

Pages fetch and mount through the existing reader path underneath the overlay. This
is not a loading gate and does not wait for all images to download. The entrance
starts when the chapter manifest is available. Skip button and Escape dismiss it;
reduced motion omits it. Timers, animation and keyboard listener clean up. No page
geometry, zoom, prefetch, cache, direction or history logic changed.

## Premium presentation

- New editorial Home selection: three real source-artwork cards with staggered layout,
  animated section entrance, genre labels and working detail navigation.
- Framed desktop hero, restrained cover perspective and hover settle.
- Card lift/tilt and cover reveal rotation; editorial image push-in on hover/focus.
- Existing route shutters shortened from 1,150 to 720 ms with less content zoom.
- Warmer, more opaque reader controls; rounded settings and empty-state surfaces.
- Keyboard focus rings and reduced-motion overrides. No new dependencies or WebGL.
- This does not restore the previously rolled-back 4.x design.

## Verification

- TypeScript and source rules pass: 199 checked files, no explicit any, files under 250 lines.
- Unit tests: 30 passing, including decimal chapter labels.
- New premium browser suite: 17 assertions, zero captured JavaScript errors.
- Verified both animated panels, actual translation, underlying mounted reader, automatic
  removal, button skip, Escape, reduced motion, real image decode and editorial navigation.
- Responsive Home/editorial checks at 320, 390 and 768 px without horizontal overflow.
- Existing live-source reader suite passes: MangaKatana/MangaPill page decode, chapter
  filtering, RTL advance, reading-position restoration and responsive layout.
- Existing cinema33 suite passes: five featured cuts, page scrub/step, RTL keyboard,
  desktop/mobile reader resize and control geometry.
- Web and Android Hermes exports succeed. Physical-device installation and FPS/battery
  profiling are not performed; no signed APK is included. Actual email/SMS/Google
  activation still requires your existing provider configuration.

Run `node scripts/premium-e2e.mjs` with `TEST_URL` pointing to the server.
Screenshots and browser verification JSON are under `docs/screenshots/premium37`.

## Protected scope

93 archived backend/auth/data/navigation/route files compared byte-for-byte with 3.6: unchanged.
ReaderScreen has only a presentation-prop change passing the real chapter number into ChapterCue.

## Changed existing files

- `global.css`
- `src/screens/HomeScreen.tsx`
- `src/screens/ReaderScreen.tsx`
- `src/screens/home/SpotlightScene.tsx`
- `src/screens/settings/SettingsRows.tsx`
- `src/components/CoverReveal.tsx`
- `src/components/MotionScreen.tsx`
- `src/components/MangaCard.tsx`
- `src/components/PosterArtwork.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/reader/ChapterCue.tsx`
- `src/components/reader/ReaderOverlay.styles.ts`

## Added code / tests

- `src/components/premium/premium.css`
- `src/components/premium/EditorialSelection.tsx`
- `src/components/reader/chapterLabel.ts`
- `scripts/premium-e2e.mjs`
- `scripts/chapter-label.spec.ts`
