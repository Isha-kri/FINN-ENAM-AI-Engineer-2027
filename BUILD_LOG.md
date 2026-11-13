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
