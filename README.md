# FINN — Financial Investment Agent

FINN is a mobile-first investor signal desk with two clear modes: **Pulse** for portfolio changes and EOD alerts, and **Deep Research** for page-cited excerpts from primary company documents. The prototype is deliberately honest about coverage: the initial Pulse cards are illustrative fixtures, while refreshable filings/prices and the Infosys document library are real sources.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ (tested with Node 24) and npm. The API and UI run locally; no account, API key, or external service is needed to start.

```powershell
npm install
npm run dev
```

Open <http://localhost:5173>. `npm run dev` starts the Vite client and the local API on port 8000. The first `Refresh sources` call reads the official NSE announcement RSS feed and Yahoo chart history for the configured portfolio. Refresh is on demand; no background job runs.

For a single local production-style server:

```powershell
npm run build
npm start
```

Open <http://localhost:8000>. `PORT` can select another API port. See [.env.example](.env.example) for optional setting names; no LLM key is required or currently used.

## What works

- **Pulse:** 18-company NSE universe, 24h / 3d / 7d filter, company search, high-priority filter, routine collapse, an on-demand NSE RSS refresh, direct filing links, and clear sample labels when the current feed has no matching portfolio filing.
- **EOD data:** refresh fetches daily Yahoo chart history, stores observations in SQLite, and labels values EOD / delayed. The source is a third-party convenience feed, not an exchange feed or a live quote.
- **Watchtower:** create, edit, enable/disable, and remove close-move or volume rules. Rules and deduplicated triggers persist in SQLite. Move rules compare adjusted closes. Volume uses the prior 20 sessions and excludes the current session. A trigger is evaluated only when a later EOD session arrives for that symbol.
- **Deep Research:** accepts NSE symbols. Infosys is the worked example: FINN downloads the official FY26 annual report and Q2 FY27 earnings-call transcript, keeps page boundaries, stores checksums and document metadata, and uses local lexical retrieval. Retrieved excerpts link to the original PDF page. No LLM is involved; unsupported facts are not synthesized.
- **Mobile layout:** bottom navigation and single-column research/watch screens; desktop uses a side rail and source panel.

## Data and trust boundaries

- Pulse fixtures are synthetic examples, visibly marked `DEMO`; they are not actual filings. They fall back into view if a source refresh finds no portfolio matches.
- The NSE feed may contain no recent items for the selected 18 names. The refresh panel reports the number scanned and new portfolio matches. Filing classification is deterministic keyword matching and priority means attention, not expected return.
- Yahoo historical prices are EOD/delayed. Latest stored session and fetched-at time are shown. Yahoo can change or restrict its public chart endpoint.
- Deep Research ingests primary Infosys company PDFs only. For other tickers, FINN reports that verified primary documents have not been configured. It does not search news or broker research.
- `data/finn.sqlite` and `data/documents/` are local, ignored by Git, and are recreated as the app is used. Downloaded company PDFs are not committed.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md). The app is React + TypeScript + Vite, with a local Express API and SQLite (`better-sqlite3`). PDF page extraction uses `pdfjs-dist`.

## Checks performed

- `npm test` — 7 domain tests passed (ticker normalization, classification tiers, IST timestamps, filing dedup IDs, close-move edge cases, 20-session volume baseline, and window boundaries).
- `npm run check` — passed.
- `npm run build` — passed.
- Source smoke: official NSE RSS XML read; Yahoo chart returned daily history for 18/18 configured symbols.
- Infosys smoke: annual report (383 PDF pages) and earnings-call transcript (25 PDF pages) downloaded and indexed; a research question returned page citations from the primary documents.
- Browser screenshot automation was unavailable in this session, so mobile/desktop visual QA is not claimed as complete. Frontend interaction checks are still manual work.

See [BUILD_LOG.md](BUILD_LOG.md), [SOURCES_AND_LIMITATIONS.md](SOURCES_AND_LIMITATIONS.md), and [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for details.
