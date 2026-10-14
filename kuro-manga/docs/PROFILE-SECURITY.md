# Profile security scope — KURO 3.8.0

The 3.8 UI redesign preserves the 3.7 server and Storage policies. It also clears
the old editor on a verified account switch and separates decoded image cache
entries by profile ID. The ID is a client cache key only; server authorization
continues to derive ownership from the verified session. Picture actions preserve
unsaved name drafts, and timeouts report an uncertain result instead of continuing
the loading animation. Names and filenames remain text-only display values.

The new profile endpoints derive ownership from a server-verified Supabase user
inside the existing encrypted KURO session. They accept no client storage path or
client ID as authorization. Recovery sessions cannot access normal profile routes.
An optional expected-user header sent by the editor rejects stale saves after an
account switch. Browser responses contain display data, never provider tokens.

Names are NFC-normalized, trimmed, limited to 2–60 Unicode characters and reject
control/format characters. Legacy/provider names are safely normalized for display.
Names remain user-controlled display data; they do not convey roles or permissions.
The editor renders values through textContent/value, including markup-looking names.

Avatar input is limited to 1 MiB; the MIME declaration must match PNG/JPEG/WebP
magic bytes. Sharp 0.35.5 decodes the image with strict failure handling, at most
16,777,216 pixels and 4096 pixels per dimension, and rejects multiple frames. It
applies orientation, removes metadata and re-encodes to static WebP at most
512 × 512 pixels, with a five-second processing timeout. The stored result also
must fit the byte limit. Serving private Storage objects repeats validation and
re-encoding so a direct Storage upload cannot bypass the serving checks.

Images live at server-generated random paths under the verified UID in the private
`kuro-avatars` bucket. RLS limits actions to the caller's UID folder; a restrictive
policy enforces the boundary alongside existing permissive policies. Storage
downloads use the user's authenticated Supabase client. The browser requests an
authenticated same-origin KURO route and receives WebP bytes with no-store,
nosniff, same-origin resource policy and a sandbox CSP. No public or signed Storage
URL is exposed. Unknown, malformed or other-user paths in metadata are ignored.

State-changing requests require the exact configured Origin and reject cross-site
Fetch Metadata. JSON requests and binary requests have separate bounded-body rules.
Binary transport uses application/octet-stream plus X-Kuro-Image-Type so Vercel's
already-parsed Buffer and the local streamed body both preserve binary data. File
names from the browser are not used as Storage paths. Shared Redis limits and
serialization cover profile mutations and uploads; IP limits cover reads and writes.

The existing opaque HttpOnly/Secure/SameSite cookies, encrypted provider sessions,
PKCE and account verification flows are retained. The new feature does not put
names, images, session tokens or Storage URLs in browser persistent storage. Blob
preview URLs are revoked on replacement, navigation and sign-out. In-flight
responses are invalidated on account/navigation changes and before mutations.

Replacement updates the reference before cleaning up the old object. Removal
clears the reference before deletion, preserving the current file if the metadata
write fails. An ambiguous replacement result is reconciled with a verified user
read before considering rollback. Only a definite provider rejection permits
rollback of an unreferenced new object. Transport/server failures can represent
an upstream write still in progress, so the new object is retained even if a
follow-up read currently shows the old path. Remote outages can leave unused private files; cleanup warnings and
administrator instructions are documented in PROFILE-SETUP.md. There is no atomic
transaction spanning Supabase Auth and Storage.

This review covers the profile feature and regression checks of the existing
account flows. It does not prove all code in the compiled manga reader is secure,
constitute a penetration test, or verify live deployment configuration. Supabase
Storage RLS relies on the supplied migration being applied to the correct project.

Primary guidance checked while implementing this release:

- [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Sharp input safety options](https://sharp.pixelplumbing.com/api-constructor/)

Vercel's @vercel/node 23.0.1 body parser was inspected locally. Parsed binary-body
behavior is covered by the API tests; an actual Vercel upload still needs the live
check in PROFILE-SETUP.md.
