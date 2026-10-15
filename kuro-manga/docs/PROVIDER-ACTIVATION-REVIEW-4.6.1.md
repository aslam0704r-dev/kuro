# KURO 4.6.1 scoped independent review

Reviewed on 16 October 2026 against `ef92f92e55db56154f3c4cb0e0d3fe410f29d048`.

Application: `C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga`.

## Assessment

**Ready to merge within this review's scope: Yes. No remaining actionable findings.** The final implementation follows the user's approved rule, **“On only for usable sources.”** Unsupported legacy selections become Off with an explanation; another reader is enabled only through the recovery action. Existing explicit verified-source Off choices, language/reading preferences and device-import settings survive ordinary migration/hydration.

This assessment covers the shared provider-state decision, core preferences/setters/bulk operations, current runtime projections, directory refresh/control behavior, actual Home/Search wrappers and native Settings card guard, their tests, package version changes and generated companion. Server admission, complete-chapter validation, account/profile/auth and native installer implementations are unchanged by this product diff.

## Strengths

- `dist/provider-state.mjs` supplies the same configured/installed/policy decision to the core, directory and Settings guard. Metadata capability and reading capability have distinct labels. A failed individual chapter request does not permanently disable its configured source.
- Migration and late hydration normalize old On flags while retaining `unavailableSelection`. Directory configuration loss clears activation; a later return of availability does not silently enable the source again. Source-only defaults preserve unrelated settings and languages.
- The Home/Search wrapper uses a separate React component with stable external-store snapshots and leaves the original screen mounted normally when the selected scope has an active reader. A stale source filter receives its own explanation. The explicit Search recovery action preserves the query and selects MangaDex.
- Strict policy is recomputed locally before registry activation decisions. A forged directory `eligible` flag cannot grant an unsupported source a usable reader. Existing server/content and complete-chapter gates remain required.

## Issues

### Critical / Important / Minor remaining

None identified in the final scoped changes.

### Corrected during the review

**P2 — Missing-adapter state was inconsistent between controls and the runtime manager.** The in-progress `provider-selection` regression was independently observed failing: set MangaDex's registry `adapter` to `null`, then `manager.enabled(['mangadex'])` still returned one adapter even though its preference was Off. The earlier runtime set checked policy/configuration without the shared installed-connection decision.

The final code derives both initial and refreshed `runtimeEligible` sets through `providerState(...).canEnable` (`client/catalogue-core.mjs:24` and `:118`). Refresh also checks actual manager registration. The original regression and independent reproduction now pass: source state is unusable, preference is Off, the exported selector excludes it, and `manager.enabled` returns none. No remaining correction is requested.

## Independent verification on the final build

| Check executed by reviewer | Result |
| --- | --- |
| Eight independent migration/hydration/activation/wrapper cases in `KURO_4.6.1_REPROS.test.mjs` | **8 passed, 0 failed, 0 skipped** |
| Repository `provider-selection.test.mjs` and `provider-state.test.mjs`, including all 1,236 entries individually | **24 passed, 0 failed, 0 skipped** |
| Combined final focused execution | **32 passed, 0 failed, 0 skipped** |
| Retained 4.5 adversarial proof, ordering and revocation suite on current source, with dedicated Redis at port 16479 and isolated namespaces | **14 passed, 0 failed, 0 skipped** |
| Independent browser flows using the actual MMKV persistence adapter and final companion | **7 flows passed; no page script errors or external requests** |
| Read-only esbuild comparison with the production catalogue-build options | Generated companion matches final source byte for byte |
| Original Metro export integrity | Expected SHA-256 unchanged |

The independent Node cases exercise Comix-only migration, explicit verified/local Off preservation, language/reading/unrelated setting preservation, late hydration, configuration loss and return, missing adapters, forged registry policy, bulk activation, source-only reset, original-screen preservation, explicit recovery routing, and native-card/metadata/local semantics.

The independent browser flows verify:

1. A real persisted legacy Comix-only state hydrates into Off plus a retained explanation. MangaDex/AniList/local remain Off, with no MangaDex or Comix catalogue request and no title cover.
2. Manage Providers navigation works; Comix's control is disabled and unchecked, with no fabricated Browse link.
3. Native Settings hides unsupported Guya controls and retains MangaDex controls.
4. Clicking the Home recovery action enables only MangaDex and displays a safe title after a complete manifest.
5. A stale Comix Search filter displays **“No reader for this source.”** The explicit **Use MangaDex** action changes the source and preserves `q=Friends`.
6. AniList-only plus local imports is explained as metadata and separate Library content, without activating MangaDex.
7. The notice and navigation remain usable at 390px width without horizontal overflow.

Browser artifacts beside this report: `KURO_4.6.1_BROWSER_REPRO.py`, `KURO_4.6.1_BROWSER_RESULT.json`, `KURO_4.6.1_REVIEW_LEGACY_HOME.png` and `KURO_4.6.1_REVIEW_METADATA_MOBILE.png`. Responses are controlled fixtures. Full release-suite/build/native-asset verification remains separate implementer evidence; the reviewer did not rerun the complete release suite.

Final generated companion SHA-256:

`5db8b4264e7a43b136a120c966ccddc9d2ad85d0c5b3e9e7c8fa7c4a5339a0f9`

Original Metro export SHA-256:

`4ca7ae590a4065290203fe34e743fcb9e08253d93026aeee7a5bf25efd8b4e07`

## Provider audit scope

An independent pass through the current public registry, local policy and activation helper reproduces **1,236 directory entries: 673 external-only, 447 missing connections, 93 unsupported rating contracts, 21 content-blocked, and 2 usable contracts**. The usable contracts are MangaDex reading and AniList metadata. This is a code/configuration classification; it does not establish present provider uptime, working chapters, or a live audit of every website.

The independent browser work used only the local fixture server. No production catalogue probes, private environment, credentials, session databases, or authenticated Supabase Storage/RLS were inspected. The reviewer wrote only reproduction/report artifacts in this review folder and did not edit app source, tests, index, or persisted user data.

## Considered and left outside this change

- **Adding a Comix connection or finding replacement domains:** this update corrects activation and explanation. A new connector would require separate implementation, content-rating support and review; none is claimed here.
- **Making all external/unresolved/rating-blocked entries into readers:** the approved strict admission rules remain requirements. Registry coverage and disabled-control coverage do not establish working reader support.
- **General provider latency, fresh production catalogue totals and a universal content/visual audit:** no new bulk live probes were authorized for this review, and the relevant readiness/backend algorithms are unchanged by this bounded correction.
- **Metadata-only content becoming reading pages or device imports appearing in online Discovery:** those capabilities remain separate. The notice explains metadata and Library imports; this release does not add reading capability to either source type.
- **Fresh native-binary, account/profile or live Supabase RLS audits:** those implementations are outside this product delta. Their existing release checks are owned by the implementer; the retained proof/reader boundary cases above were independently rerun.

## Recommendation

Keep the release explanation tied to usable connection support and the audit's classification scope. The reviewed code and evidence support the approved activation correction without a claim that all directory providers now work or were freshly checked live.
