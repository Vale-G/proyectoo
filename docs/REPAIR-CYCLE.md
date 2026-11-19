# Repair cycle — review candidate

Base: PR #9 (`c2d26a6ddf051d7e29e69d60a6bec6700cae6aee`). No production changes, remote migrations or public registration.

## Changes

- Theme-specific filter surfaces, selected states and focus/error feedback. Single scrolling filter row and inline search on mobile; sticky wizard actions respect safe areas. Existing routes, query filters and server validations retained.
- New customer document `receipt.pdf?kind=cycle` with immutable intake data, initial amounts, public diagnostic message, customer-facing proposed work, current estimate/payments, final tests and delivery. Private diagnosis, provider costs, IMEI, unlock metadata, photos and locations are excluded. Historical intake/delivery/quote formats remain available; only the principal UI links switch to the cycle document.
- A4, A5 and duplicate A5 on landscape A4. Long content flows to additional pages in all formats, without silently clipping page one. New compact documents use native A5 geometry with 9-point body text rather than shrinking an A4 page to unreadable type. Use A4 when a single sheet is preferred; A5 can require more pages. The system does not invent consent or initial values for older orders.
- Administrative 100 × 60 mm label, cut border, workshop name, order, device, issue summary, state and physical location. Its QR points to `/orders/:uuid`; it contains no public tracking token. Existing authenticated route resolves active membership and workshop scope before reading. Customer names/contacts omitted from labels.
- Workshop locations can be created, assigned or cleared from a repair. Physical location is independent of repair state. Unique names per workshop and composite foreign key prevent cross-workshop assignments. Rename/archive management is not included.
- Structured final checks adapt to phones/tablets, computers, consoles and controllers (new receipts distinguish consoles and controllers explicitly; historical combined-category orders retain both sets and require explicit not-applicable reasons rather than guessing from a model name). No preselected result for unsaved tests. Passed/failed/not performed/not applicable plus observations. Nonperformed/nonapplicable requires a reason on the server. Initial checks remain untouched; new final tests without an equivalent initial test explicitly say so.
- Each change uses revision locking and a transaction with an audit event. Previous and next final results are retained in internal history. Delivered orders reject subsequent final-test replacement. Location changes remain possible for physical traceability.
- All new actions use `privateStore`: verified Google identity plus active owner/admin membership. Restricted technician/reception roles remain denied per PR #7; this does not silently broaden their privileges.

## Proposed migration — NOT applied remotely

`drizzle/0005_repair_cycle.sql` adds workshop_locations and nullable repair_orders.location_id / final_tests. No historical backfill, no deletion or guessed tenant assignments. RLS is enabled and direct PUBLIC/anon/authenticated privileges are revoked; app server applies membership checks. Composite `(workshop_id,location_id)` FK adds database-level isolation. Existing data remains compatible because columns are nullable.

Safe procedure after explicit approval:

1. Verify target project identity and Preview environment marker; confirm all public/server/admin credentials point only to the approved QA project. This has not been verified in this delivery.
2. Create a fresh database backup, verify its TOC and restore it into an isolated local database. Record source project and checksum without secrets.
3. Apply migrations 0000–0004 only if absent, in recorded order; inspect actual schema before assuming migration state. Apply 0005 in a transaction. No migration runner here automatically targets Supabase.
4. Verify null defaults, FK rejection across two synthetic workshops, public-role denial, location writes, final-result revisions, legacy orders and document downloads.
5. Deploy this code only against the migrated isolated database. Readiness now refuses a schema without both new columns. Do not point this branch at an unmigrated production database.
6. Rollback application only after checking it tolerates the additive columns. Do not drop new tables/columns or audit history as an automatic rollback.

## Reproduction

`npm ci --ignore-scripts`; `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`; `node tests/http-auth.mjs`; `npm run test:e2e`; `npm run test:design`.

For native contention set OMNIFIX_TEST_DATABASE_URL to a loopback PostgreSQL 17 database named omnifix_test and OMNIFIX_ALLOW_TEST_DATABASE=1. The test helper creates unique disposable child databases; it never consumes DATABASE_URL. CI provides PostgreSQL 17 with no production secrets. PGlite is only a fallback and is not evidence of native concurrency.

Browser auth is a local synthetic Supabase Auth server; it validates the app session/membership handling, not the real Google provider or a deployed Preview. Screenshots contain only synthetic data.

## Pending release gates

- Independent QA and visual review, including physical printing on target printers and phone PDF viewers.
- Explicit approval and isolated environment verification before any remote migration or write.
- Next.js 16.4.3 emits a known security advisory during build. A successful build does not remove this warning; dependency remediation remains a release gate.
- Service terms still identify themselves as a draft pending local legal review. No universal warranty duration is introduced.
- No Vercel Preview created; auto deployment is disabled for this branch to avoid inherited environment credentials.

## Verified evidence (2026-11-19)

| Check | Observed result |
|---|---|
| Lint / TypeScript | Pass, zero lint warnings |
| Unit/integration suite | 29 pass, 0 failures, 0 skipped with native PostgreSQL 17.11 |
| Native contention | Independent backends, single revision winner; state, order-number and final-check concurrency |
| Browser functional suite | Pass: real Next + Chromium + synthetic auth + native PostgreSQL; intake validation, state persistence, reload/relogin, photos/PDF privacy, tracking-token rotation, combined filters and logout |
| Browser design suite | Pass: both themes desktop/mobile, all filter controls ≥4.5:1 computed text contrast; negative control reintroduces white-on-white and must be rejected; staged values retained; locations and final checks survive refresh; server rejects missing reasons and shows accessible error |
| HTTP authentication suite | Pass: PKCE initiation/callback/exchange, secure cookie, code replay rejection and unauthorized account |
| PDF contents | Opened with pdf-lib and extracted with pdftotext; original and current amounts coexist; sensitive sentinels absent; long text preserved on all layouts |
| QR | New A4 customer QR and administrative label decoded from rasterized PDFs; internal label URL has no tracking token |
| Sample | Complete synthetic repair fits 1 A4; A5 uses native 9 pt text with pagination when needed |

Before/after mobile order list:

| Theme | Before (PR #9) | After |
|---|---|---|
| Dark | [Before](orders-evidence/list-dark-mobile.png) | [After](repair-cycle-evidence/list-dark-mobile.png) |
| Light | [Before](orders-evidence/list-light-mobile.png) | [After](repair-cycle-evidence/list-light-mobile.png) |

Additional actual captures: [Dark intake](repair-cycle-evidence/intake-dark-mobile.png), [Light intake](repair-cycle-evidence/intake-light-mobile.png), [Dark saved final checks](repair-cycle-evidence/final-tests-dark-mobile.png), [Light saved final checks](repair-cycle-evidence/final-tests-light-mobile.png).

Documents: [Main A4](repair-cycle-evidence/cycle-a4.pdf), [A5](repair-cycle-evidence/cycle-a5.pdf), [duplicate copies](repair-cycle-evidence/cycle-double.pdf), [admin label PDF](repair-cycle-evidence/admin-label.pdf), [main raster](repair-cycle-evidence/cycle-a4.png), [label raster](repair-cycle-evidence/admin-label.png). These are synthetic fixtures, not real clients. Before/after screenshots are actual app runs, not mockups.

CI for the published commit must repeat verify + design against PostgreSQL 17 before approval. Independent QA should inspect these artifacts and test actual paper printing and mobile PDF viewers. Nothing has been deployed or migrated remotely.
