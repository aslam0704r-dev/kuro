# Email login and verified readable catalogue

The user requests removal of phone number login, removal of duplicate and unreadable manga, and an exact unique readable count. The user chose **at least one complete chapter checked** as the qualification rule. Preserve the existing email password, email verification/recovery, Google, profile, native install, device import and strict adult-content restrictions.

## Authentication

Remove the SMS tab and phone input before the compiled account UI starts. Reject phone/SMS requests in the managed server and invalidate old SMS challenges. Session establishment and continued access require a provider-verified email. Existing accounts/data are preserved; a phone-only account needs a verified email linked in Supabase. Public account responses no longer disclose phone numbers.

## Readability and identity

A complete remote chapter qualifies only after every page in its server-derived manifest passes MIME/signature, size, dimension and full image decoding checks. The first/last page sample is insufficient. Bounded batches with server-owned progress let long chapters finish across hosted requests. Partial, failed and metadata-only results never qualify. The reader waits for this same complete validation. Try alternative chapters if an individual chapter fails.

Collection views always enforce readability, including when a previous optional Ready to read preference is off. Trusted provider identifiers and edition relationships group duplicates. Distinct sequels/parts and contradictory identities remain separate. Device imports keep their existing complete, exact-file review rule and remain private to their device.

## Count and audit honesty

An exact verified-inventory count means distinct title groups with a server-recorded complete chapter proof, within a stated check window. Never substitute a provider's candidate total. Count shared persisted inventory across server processes, prune expired/revoked entries, and expose coverage/check timestamps. A resumable public-data auditor can walk candidate metadata and check complete chapters; store its evidence and progress. A partial sweep must be labelled partial, with checked/qualified/failed/pending coverage. Do not claim the entire provider was audited until that sweep finishes. No private keys, live deployment, or Supabase settings changes are assumed.

## Acceptance evidence

Tests cover rejected phone requests and stale challenges, email/Google preservation, a corrupted middle page, batch completion without premature tickets, concurrent/shared counts, duplicate editions, separate sequel identities, mandatory collection filtering, reviewed local files, and phone-free UI. Deliver a complete source ZIP with deployment/setup instructions and current audit results.
