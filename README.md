# FINN — Financial Investment Agent

FINN is a mobile-first investor signal desk with two clear modes: **Pulse** for portfolio changes and EOD alerts, and **Deep Research** for page-cited excerpts from primary company documents. The prototype is deliberately honest about coverage: the initial Pulse cards are illustrative fixtures, while refreshable filings/prices and the Infosys document library are real sources.

**Submission repository:** [github.com/Isha-kri/FINN-ENAM-AI-Engineer-2027](https://github.com/Isha-kri/FINN-ENAM-AI-Engineer-2027). No hosted demo is available yet; run locally using the steps below.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Isha-kri/FINN-ENAM-AI-Engineer-2027)

The Render Blueprint uses the free web-service tier for a review demo. It sleeps after inactivity, and its SQLite database and indexed PDFs are ephemeral and may reset on restart or redeploy. This deployment is for evaluation, not durable storage. Render requires you to sign in, connect the GitHub repository, review the Blueprint, and approve deployment.

## Run on your own computer

For an evaluator who wants to run FINN locally, download [FINN-local-prototype.zip](FINN-local-prototype.zip) or clone this repo. On Windows, double-click `start-finn.bat`; on macOS/Linux, run `./start-finn.sh`. Both build and start FINN at <http://localhost:8000>. Docker users can run `docker compose up --build`. See [LOCAL_RUN.md](LOCAL_RUN.md) for setup details and phone-on-same-Wi-Fi access.

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

- **Pulse:** 18-company NSE universe, 24h / 3d / 7d / custom date filter, company search, category and high-priority filters, routine collapse, an on-demand NSE RSS refresh, direct filing links, and clear sample labels when the current feed has no matching portfolio filing.
- **Company detail:** select a ticker from a Pulse filing to inspect its latest stored EOD close and freshness, recent matching filings, configured research documents, and a link into Deep Research.
- **EOD data:** refresh fetches daily Yahoo chart history, stores observations in SQLite, and labels values EOD / delayed. The source is a third-party convenience feed, not an exchange feed or a live quote.
- **Watchtower:** create, edit, enable/disable, and remove close-move, volume, or filing-category rules. Rules and deduplicated triggers persist in SQLite. Filing rules can target a ticker or the whole portfolio. Move rules compare adjusted closes. Volume uses the prior 20 sessions and excludes the current session. Market triggers are evaluated on a later EOD session; filing triggers are raised when a new matching filing is ingested.
- **Deep Research:** accepts NSE symbols. Infosys is the worked example; the initial ad-hoc examples Cipla, Coal India, Trent, and BPCL now have configured primary-source links shown in a ticker-specific source library. FINN downloads configured PDFs on the first research question, keeps page boundaries, stores checksums and document metadata, and uses local lexical retrieval. Ask results and a guided five-lens evidence map link excerpts to original PDF pages. The map is extractive evidence, not generated conclusions; no LLM is involved.
- **Results extraction:** the official Infosys Q2 FY27 audited statement is indexed as a primary source. FINN extracts consolidated Revenue, PBT, and PAT with Q2/QoQ/YoY values and page evidence; EBITDA remains explicitly “not reliably extracted” because the statement has no explicit EBITDA row.
- **Guidance vs. outcomes:** FINN retrieves quantitative revenue guidance from the latest four indexed Infosys calls and links each excerpt to its transcript page. It finds the FY26 3%–3.5% guidance and compares it with the later reported 3.1% constant-currency FY26 outcome. FY27 outcome rows remain “not found” because the financial year is still in progress.
- **Mobile layout:** bottom navigation and single-column research/watch screens; desktop uses a side rail and source panel.

## Data and trust boundaries

- Pulse fixtures are synthetic examples, visibly marked `DEMO`; they are not actual filings. They fall back into view if a source refresh finds no portfolio matches.
- The NSE feed may contain no recent items for the selected 18 names. The refresh panel reports the number scanned and new portfolio matches. Filing classification is deterministic keyword matching and priority means attention, not expected return.
- Yahoo historical prices are EOD/delayed. Latest stored session and fetched-at time are shown. Yahoo can change or restrict its public chart endpoint.
- Deep Research ingests only configured primary PDFs: nine Infosys documents plus initial source records for Cipla, Coal India, Trent, and BPCL. Coverage for other symbols is not automatic; FINN reports when links are not configured. The additional issuer PDFs are linked and ingestible, but the broader guidance, five-lens narrative, and financial-statement parser have only been verified on Infosys. It does not search news or broker research.
- `data/finn.sqlite` and `data/documents/` are local, ignored by Git, and are recreated as the app is used. Downloaded company PDFs are not committed.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md). The app is React + TypeScript + Vite, with a local Express API and SQLite (`better-sqlite3`). PDF page extraction uses `pdfjs-dist`.

## Checks performed

- `npm test` — 11 domain tests passed (ticker normalization, classification tiers, IST timestamps, filing dedup IDs, close-move edge cases, 20-session volume baseline, window boundaries, threshold boundaries, financial comparison and statement extraction edge cases, and filing rule matching).
- `npm run check` — passed.
- `npm run build` — passed.
- Research-library smoke: `/api/research/documents/:ticker` returned 9 Infosys, 2 Cipla, and 1 each for Coal India, Trent, and BPCL; an unknown symbol returned an explicit unsupported state.
- Source smoke: official NSE RSS XML read; Yahoo chart returned daily history for 18/18 configured symbols.
- Infosys smoke: nine official primary documents indexed (annual report, four transcripts, and four quarterly results). The research, results, and narrative APIs returned page citations; the Q2 FY27 audited statement returned Revenue, PBT, PAT, and an honest EBITDA extraction gap.
- Browser screenshot automation could not initialize in this Windows session, so mobile/desktop screenshot QA and end-to-end interaction checks are not claimed as complete.

See [BUILD_LOG.md](BUILD_LOG.md), [SOURCES_AND_LIMITATIONS.md](SOURCES_AND_LIMITATIONS.md), and [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for details.
