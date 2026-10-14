# KURO 4.4 routing follow-up review

Reviewed the local follow-up in `C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga` against commit `f518cb4`. Scope was limited to `api/kuro.mjs`, `vercel.json`, and `tests/vercel-routing.test.mjs`.

**Result:** No actionable concern found in the scoped changes.

- `api/kuro.mjs:14` preserves the existing raw `__route` behavior and uses the parsed `req.query.__route` only as a string fallback. The existing requirement that a routed path start with `/` is preserved.
- `api/kuro.mjs:20` removes the two reserved routing fields, `__route` and `kuroPath`, while retaining the public MangaDex `path` and Google callback `code`/`state` fields.
- The dynamic catalogue/profile/auth rewrite patterns retain their scopes, with the capture renamed consistently to `kuroPath`. The separate catalogue-refresh, profile-base, proxy, and static fallback routes retain their existing definitions.
- Dispatch order, response security headers, method/body handling, and the downstream authentication/content checks are preserved by this adapter change.
- The normalized count-route tests show that the routing fields are removed, while an unexpected public field (`extra=1`) remains present and receives the existing `400` response.

Independently ran `tests/vercel-routing.test.mjs` with the bundled Node 22 runtime: **7 passed, 0 failed**. The cases cover a raw rewritten route, parsed-route fallback, MangaDex path preservation, Google callback parameter preservation, rejection of an unexpected public query, successful count dispatch, and consistent rewrite capture names.

This was a read-only implementation review using local tests. No private environment files or keys were accessed, and no implementation file was changed. The reviewer did not independently deploy the patch or verify the anonymous production endpoint after this follow-up.
