# Build log

## 14 November 2026

- Read the master prompt and both brief PDFs. The brief favors a focused mobile-first signal desk; the reference file supplied the announcement taxonomy and financial definitions.
- Inspected the empty project directory and available runtimes. Node 24/npm 11 and Git were available; the `python` command resolved only to the Microsoft Store alias, so the app uses TypeScript/Node rather than the preferred Python stack.
- Created React + TypeScript + Vite client, Express API, SQLite persistence, and dark editorial instrument styling. Added three destinations: Pulse, Research, Watchtower.
- Verified the official NSE RSS endpoint and Yahoo chart endpoint with direct HTTP GET. Implemented sequential refresh, SQLite price cache, RSS deduplication, keyword classification, and close-move / 20-session volume rules.
- First RSS smoke returned 22 rows; an initial `LT` symbol substring match produced false portfolio associations. Replaced ticker-substring matching with company-name matching and removed those ten local test rows. A follow-up smoke scanned 22 rows, stored 0 portfolio matches, and refreshed 18/18 Yahoo symbols; the demo feed remains clearly marked as illustrative.
- Found current official Infosys FY26 annual-report and Q2 FY27 earnings-call PDF URLs. Direct GET succeeded for both. Added PDF.js page extraction, checksums, SQLite document/page chunks, lexical query retrieval, and source-page citations. First ingestion indexed 383 and 25 pages. Follow-up API query returned cited excerpts from the indexed documents.
- Added persisted alert-rule creation, editing, enable/disable/delete, trigger deduplication, and market snapshot APIs/UI. Trigger evaluation uses a newly arrived session only.
- Added seven Node domain tests for ticker normalization, classification tiers, IST timestamp parsing, stable IDs, EOD movement edge cases, volume baselines, and window boundaries.
- `npm test` (7 passed), `npm run check`, and `npm run build` passed. API smoke verified alert create/update/delete, 18 stored Yahoo symbols, both indexed primary PDFs, and evidence lookup by citation ID. Live refresh scanned 22 NSE rows with 0 portfolio-name matches and refreshed 18/18 Yahoo symbols.
- Browser host for screenshot/interaction QA was unavailable, so no screenshot-based mobile/desktop visual verification is claimed.
- Downloaded source PDFs and SQLite state are local-only and ignored by Git. No secrets were read or written; no email was sent; no deployment or remote push was attempted.

## 15 November 2026

- Rechecked the working tree: the app and handoff pack were already present; preserved the existing implementation and local repository.
- Added a Pulse filing-category filter and expanded pure domain coverage for alert threshold boundaries and safe financial comparison behavior when the prior value is zero or negative.
- `npm.cmd test` passed (9 tests), `npm.cmd run check` passed, and `npm.cmd run build` passed. The first sandboxed test/build attempt failed due Windows profile lookup and workspace access restrictions; rerunning with approved elevated execution succeeded.
- Attempted the available computer-use browser inspection for mobile/desktop QA. The runtime failed to initialize because it could not create its kernel assets; visual and end-to-end browser QA remain unverified.
- Confirmed remaining challenge gaps in the architecture/handoff: results filing extraction, structured research analysis, four-quarter narrative-vs-numbers, arbitrary company document discovery, category-based filing alerts, and custom date range are not implemented. No successful deployment or repository push is claimed.
- Implemented filing-category alert rules: SQLite schema migration, ticker or all-portfolio scope, selected category matching, filing-event deduplication, trigger explanations containing the source link, and Watchtower rule configuration.
- Added a domain test for ticker/category matching and verified the filing rule API end to end against the local server (create, read, delete). The test rule was removed after verification.
- Updated the product and source limitations to distinguish implemented filing alerts from remaining results extraction and structured research work.
- Added a custom date range to Pulse and exposed filing-category, individual ticker, and all-portfolio selectors in Watchtower. Updated the handoff docs to match.
- Final validation after these changes: 10 tests passed, TypeScript check passed, Vite production build passed, and `git diff --check` found no whitespace errors.
- Added a guided five-lens evidence map endpoint and Research view. It retrieves page-cited excerpts for business, financials, management narrative, positive evidence, and risks; empty lenses say the evidence was not found instead of producing unsupported conclusions. Local API smoke returned 5 modules, 2 indexed primary documents, and 15 cited excerpts across 407 indexed pages.
- After the evidence map was added, `npm test` (10 passed), `npm run check`, `npm run build`, and the Infosys evidence-map API smoke all passed.
- Added the official Infosys Q2 FY27 audited results PDF to the primary-source registry and indexed all 20 pages. `GET /api/research/results/INFY.NS` now extracts consolidated Revenue ₹49,244 crore, PBT ₹11,063 crore, and PAT ₹7,838 crore from PDF page 12; it calculates QoQ and YoY changes from the same table and returns EBITDA as not reliably extracted. The API smoke confirmed the extracted rows and comparatives; a query bug was fixed before the successful run.
- Added a generic JSON error response so unhandled route errors do not expose stack traces. Subsequent full test/build validation passed.
- Added Q1 FY27, Q4 FY26, and Q3 FY26 official Infosys results and transcript PDFs. The local index now contains nine primary Infosys documents (four earnings calls and four quarterly audited results plus the FY26 annual report).
- Added a four-quarter guidance/outcome workflow. It classifies and cites explicit revenue growth guidance from Q3 FY26 through Q2 FY27, then pairs Q3 FY26's 3%–3.5% FY26 range with the later 3.1% constant-currency FY26 result. FY27 rows correctly say the comparable outcome is not yet found. The API smoke confirmed all four transcript rows and the single comparable full-year result.

## Final completion pass � 15 November 2026

- Added official source records for the four required ad-hoc research examples and replaced the static Infosys-only source aside with a ticker-aware document library and explicit unsupported/offline states. The UI displays company names for the configured examples and document availability at a glance.
- Research-library API smoke returned the expected document counts: Infosys 9, Cipla 2, Coal India 1, Trent 1, BPCL 1, and an explicit unsupported response for an unknown ticker.
- Final project checks: `npm.cmd run check` passed; `npm.cmd test` passed all 11 domain tests; `npm.cmd run build` passed. The first sandboxed test/build attempt was blocked by Windows profile/workspace access, and the same commands passed with approved elevated execution.
- Remaining scope is documented: arbitrary NSE document discovery and editable universe, non-Infosys result/narrative parsing, and browser screenshot/e2e QA are not complete. The app and core backend workflows are implemented, but those requirements prevent calling the challenge fully complete.

- Added a Pulse company detail overlay reachable from filing tickers, showing stored EOD freshness, recent filings, research document availability, and a Deep Research handoff. Final typecheck, all 11 tests, and production build passed after this addition.
