# KURO 3.8 profile studio

The profile editor uses KURO's existing CinemaDisplay font and ink/amber palette.
Desktop shows a live reader-card preview beside the editing controls. Mobile stacks
the preview above the controls in a scrollable dialog with a sticky close header.

## Motion and interaction

- The dialog assembles with a short scale/reveal sequence and split poster panels.
- Avatar accents orbit slowly, with subtle aura and particle motion while open.
- A fine desktop pointer drives a bounded three-dimensional preview tilt. Touch
  screens keep a stable card, and opening on mobile focuses the close control so
  the keyboard does not cover the editor immediately.
- Picture changes fade into the preview; the avatar still uses the authenticated
  private image route. An unsaved file remains a preview until Upload picture.
- Buttons have hover/press/ripple feedback. Saving reflects the actual request;
  there is no invented percentage or simulated server progress.
- Confirmed saves produce a brief avatar flare and status confirmation. Errors and
  uncertain results use explicit messages, with loading effects stopped.
- Typing previews the display name and character count. Saving/removing a picture
  preserves that draft, and the draft is persisted only by Save name.

Animations primarily use transforms and opacity. The design adds no external
animation dependency, font request or public image URL. Opening/closing effects
are finite; continuous CSS effects are scoped to an open dialog. Tracked Web
Animations, pointer frames and transient effect timers are cancelled when the
editor is cleared. Reduced-motion preferences disable effects both at startup
and when the preference changes while editing.

## Account privacy and preserved behavior

The Supabase server/API, upload validation, session handling and Storage migration
are unchanged from 3.7.0. A verified account change clears the old editor and reloads
the existing compiled account screen. Private image URLs separate cache entries
by verified profile ID; this query value is not used as server authorization.
Names and filenames are rendered as text. The existing generation guards prevent
stale responses from overwriting a save or a new account state.

## Local checks

The motion suite verifies that animated transforms actually advance, pointer tilt
responds, drag/drop saves through the real local API, mobile controls remain
reachable, and reduced-motion editing remains functional. Additional regressions
cover another-tab account switching with two different pictures, draft preservation
across picture changes and request-timeout feedback.

Headless Chromium tests and screenshots use controlled local accounts, a local
Auth/Storage fixture and the real Supabase SDK. A WebM recording is included as a
visual preview. Physical phone frame rate, Safari/Firefox rendering and the user's
live deployment were not measured. Apply the normal deployment checks in
PROFILE-SETUP.md after uploading the new package.
