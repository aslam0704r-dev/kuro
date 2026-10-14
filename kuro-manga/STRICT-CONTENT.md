# KURO 4.4.0 — strict content rules

This release also requires one complete checked chapter per visible remote title, always groups confirmed editions, and removes phone login. See [READABLE-CATALOGUE.md](READABLE-CATALOGUE.md) for the exact count's partial-audit scope, complete-page validation and deployment.

Adult, hentai, explicit, erotica, suggestive and unverified manga are hidden and refused throughout the current KURO web app. The user explicitly selected **hide unverified titles too**, including unreviewed device files. The rule is mandatory and has no user opt out.

## What can appear

| Source | Required evidence | Scope |
| --- | --- | --- |
| MangaDex | Exact `contentRating: "safe"`, valid manga identity and complete readable tag labels; restricted sexual/adult tags and descriptions are rejected. | Discovery, covers, details, chapters and reading. A chapter must belong to this approved manga. |
| AniList | Exact Boolean `isAdult: false`, manga type, valid identity, explicit non-adult tag flags and valid tag/genre labels; adult/ecchi/sexual labels are rejected. | Metadata and approved cover only. AniList supplies no reading pages. |
| Reviewed device files | Exact SHA-256 of every page, in a deployment-owned review entry, verified again on the bytes that will display. | Device Library and the existing reader. |
| Other providers or unknown evidence | No admission. | Restricted or blocked before upstream catalogue/reading requests. |

The registry audit covers **1,236** entries: **2 eligible, 1,213 restricted, 21 blocked**. It records policy eligibility for every entry. It does not claim that every website was contacted or every remote manga/page was visually reviewed. Earlier 4.0/4.1 availability audits remain in `docs/` as historical evidence; their reader counts do not describe this release's enabled sources.

The supported AniList fields are documented in its [Media reference](https://docs.anilist.co/reference/object/media), [tag reference](https://docs.anilist.co/reference/object/mediatag) and [query reference](https://docs.anilist.co/reference/query). AniList also explains the limits of its adult classification in its [API considerations](https://docs.anilist.co/guide/considerations). KURO adds stricter tag checks and rejects unknown values.

## Enforcement

- MangaDex list queries force `safe`; caller supplied mature rating parameters are removed. Returned rows still undergo classification.
- Detail and reader routes wait for canonical server approval before mounting the original screen. URL titles, covers, ratings and claimed manga/chapter relationships cannot authorize content.
- Chapters, feed rows, at-home requests and page manifests check the canonical manga relationship. External chapter redirects are excluded.
- Cover delivery derives its URL from approved upstream metadata. Arbitrary browser cover/image URLs are refused.
- Page tickets use a new MAC namespace and include the content policy version and canonical manga ID. Old tickets are invalid. A ticket is checked against current rating evidence again before an image cache is used.
- Positive rating evidence lasts at most **30 seconds**, with no stale-success fallback after errors. Active detail/reader routes recheck on that interval and on return to the tab. Failed checks hide/refuse content.
- Cover/page HTTP responses use `no-store`. Existing size, MIME/signature, decode, DNS/redirect and rate-limit checks continue to apply.
- The older arbitrary provider proxy is closed. Production and local CSP restrict manga images and provider API calls to the same-origin gateway.
- Startup refuses to load the immutable app export when the mandatory content bootstrap is missing.
- Saved Library/history views use canonical approved metadata. Hidden records are preserved in storage; the safety projection does not write a filtered snapshot over the user's data.
- Unverified provider controls are disabled. Old preferences, bulk enable and offline directory fallbacks cannot enable them.

File validation establishes that an image decodes correctly. Audience admission uses rating evidence or a reviewed byte fingerprint. The automated rule cannot establish that a provider labelled every cover or chapter correctly. A universal visual audit of all external pages has not been performed. Quarantine suspected mislabelled titles immediately and review them before permitting further access.

## Device imports and review

The included `tests/fixtures/safe-device-demo.cbz` is the original **A Quiet World** KURO demo. All three pages were inspected in full on 2026-10-14. They contain text and geometric mountains, with no people, nudity or sexual material. Its exact page fingerprints are in `client/local/reviewed-content.mjs`. The normal and reversed page orders are approved; renamed archives with the same exact pages share the appropriate identity.

Other files are refused before their cover preview and are not saved. Existing unreviewed imports remain on the device and are hidden from Library/history and the reader. They are not uploaded to Supabase. Keep original device files; clearing browser storage can erase KURO copies.

For an owner-reviewed device comic:

1. Review **every page** and verify its age/content suitability. Review the exact extracted/rendered bytes, including PDF-rendered output, rather than a filename, synopsis or archive extension.
2. Add the ordered SHA-256 page hashes, title, review date and review note to `client/local/reviewed-content.mjs`. Only the deployment owner changes this source file; there is no end-user approval checkbox or API.
3. Build and redeploy the complete source. Run the device and content regression checks with the new approved sample.
4. Import that exact file/page set in KURO. Any modification or extra/unreviewed page is refused.

The existing comic/archive/PDF/image parsers and their size limits remain included. Each resulting book must also pass content admission. A supported file extension alone does not grant approval.

## Quarantine a mislabelled public title

Edit `client/content-denylist.mjs` and add its canonical identity to `blockedMangaIds`, `blockedChapterIds`, or `blockedProviderIds`. Examples of identity formats are `mangadex-<UUID>`, `anilist-<number>` and `mangadex:<chapter-UUID>`. These lists only deny content and cannot relax the rating requirements.

Build and redeploy the whole source, then reload open clients. The server checks the denylist before admitting canonical metadata and page delivery; cached catalogue rows and client approvals also consult it. Existing account/session encryption keys stay unchanged.

## Deploy this update

1. Extract `kuro-full-source-4.4.0.zip` into a clean project folder. Keep `package.json`, `vercel.json`, `api/`, `server/`, `client/`, `scripts/`, `data/` and `dist/` together.
2. Use Node **22.x**. Run `npm ci --ignore-scripts`, then `npm run build`.
3. Deploy the complete project to the existing KURO Vercel project. The framework remains Other and output directory remains `dist`.
4. Retain the existing server-side Supabase URL/publishable key, account encryption key, Upstash connection, `PUBLIC_ORIGIN` and cron configuration from `VERCEL-DEPLOY.md`. Use the permitted provider license mode already configured; commercial/licensed mode keeps MangaDex disabled under its existing policy. No new private key is needed for this update.
5. This feature adds **no Supabase migration or new Storage policy**. Existing profile/private-avatar SQL remains included. Apply it only if the earlier profile setup is still outstanding; see `PROFILE-SETUP.md`.
6. Redeploy and reload existing open tabs/apps so they load the new bootstrap and UI. Do not clear device storage to update the app.
7. Check `/providers`, an approved MangaDex title, an unverified direct URL, Library/history and the reviewed device demo. Check your own live login/profile separately after deployment.

The included 3.9.0 APK and Windows installer still open `https://kuro-manga.vercel.app/`; they receive this web behavior after the website is deployed. This work did not rebuild or install native binaries.

The original editable React/Expo source was not provided. The original Metro export stays byte-for-byte unchanged; maintained companion modules implement these rules before it starts.

## Local checks

Run `npm test` for Node checks. Supply `TEST_REDIS_URL` for the shared Redis fixtures so those tests are not skipped. Browser fixtures are isolated and use positive/negative synthetic metadata, the reviewed demo, and local Supabase account/storage fixtures. They do not certify the public deployment or live Supabase policies.

See `docs/CONTENT-TEST-RESULTS.md`, `docs/CONTENT-REVIEW.md`, and the complete provider policy audit in `docs/CONTENT-PROVIDER-AUDIT.json` / `.csv`.
