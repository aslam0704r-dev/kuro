# KURO 4.4.1 Vercel routing correction

Date: 15 October 2026, client timezone Asia/Calcutta.

The 4.4.0 source was pushed to the existing **aslam0704r-dev/kuro** repository on **main**, commit **f518cb4c5b9cbca4d7eeb663ce36dcaf6d8dfccf**. Vercel reported successful deployment in the existing **kuro-manga** project. The public readable-count endpoint then returned HTTP 400 **Count accepts no parameters** despite a request without client query fields.

## Correction

- Dynamic API rewrite captures now use the reserved transport name **kuroPath**, avoiding conflict with the public MangaDex **path** parameter.
- The adapter removes **__route** and **kuroPath** before passing the URL to endpoint validation. It can read the original route from Vercel's parsed query when absent from the raw URL.
- Genuine client parameters remain intact. Count requests still reject extra fields; manga/chapter identities, Google code/state, methods, origin checks, content gates and image ticket checks retain their existing validation.
- Original web export, native release 3.9.0, account crypto, avatar policies and strict content policy are preserved.

## Verification

Seven new routing regressions passed. The full Node suite with a dedicated real Redis passed **212 tests, 0 failed, 0 skipped**. The build passed, including 66 referenced resources and native artifact checks.

The 82 browser checks reported in the 4.4.0 results remain historical results for the same unchanged client. They were not rerun as a new full browser suite for this server routing patch. No private keys were requested or exposed. Production account delivery, private Storage/RLS deployment and native device installation are separate from anonymous deployment checks.

The manga audit remains the explicitly partial 100-candidate audit described in **READABLE-CATALOGUE.md**. This routing correction does not establish a full provider count or extend old chapter proofs.
