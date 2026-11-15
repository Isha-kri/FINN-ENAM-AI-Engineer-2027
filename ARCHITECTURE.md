# Architecture

FINN is one local web service with a Vite client and an Express API. SQLite is the durable local store. The product runs without a model key; research is extractive retrieval over downloaded primary documents.

```mermaid
flowchart LR
  U[Investor] --> UI[React + TypeScript]
  UI --> API[Express API]
  API --> DB[(SQLite: prices, filings, rules, alerts, notes, documents, page chunks)]
  API --> NSE[NSE official RSS]
  API --> YF[Yahoo chart history · EOD/delayed]
  API --> IR[Company investor relations PDFs]
  IR --> PDF[PDF.js page extraction]
  PDF --> IDX[Local page-preserving lexical index]
  IDX --> DB
  DB --> RET[Question-term retrieval]
  RET --> CIT[Excerpt + document/page/source URL]
  CIT --> UI
```

## Data flow

1. `POST /api/refresh` reads NSE's public announcements RSS and sequentially requests Yahoo daily history for the 18 configured `.NS` symbols and any additional tickers with saved rules.
2. Company-name matching associates RSS items with the local universe. Stable SHA-256 IDs deduplicate filings. A deterministic keyword taxonomy assigns category and attention tier.
3. Yahoo observations are upserted by ticker and session date. Market thresholds are evaluated only when the newest session is newer than the stored session. Filing-category rules are evaluated when a new RSS filing is inserted. Trigger IDs hash the rule and source event to deduplicate repeats.
4. `POST /api/research/ingest/INFY.NS` fetches verified official annual report, earnings-call transcript, and Q2 FY27 audited results PDFs. PDF.js extracts text per page, splits long pages into overlapping chunks, and stores document metadata, source URL, checksum, local ignored file path, page, and chunk ID.
5. `POST /api/research/ask` ranks indexed chunks by query term frequency and returns excerpts with source URLs and PDF page anchors. `POST /api/research/modules` groups retrieved excerpts into five evidence lenses and labels gaps. `GET /api/research/results/:ticker` parses Revenue, PBT, and PAT rows from the Infosys consolidated Q2 FY27 statement, calculates comparable QoQ/YoY movement, and reports EBITDA as unextracted. `GET /api/research/narrative/:ticker` extracts quantitative guidance from the latest four indexed calls, then compares an outcome only where matching full-year actual evidence exists. `/api/evidence/:id` resolves a stored chunk.
6. `/api/notes` provides local CRUD for a ticker-linked research journal. Notes are stored separately from retrieved company evidence and are never presented as source-backed claims.

## Main tables

- `filings`, `prices`, `alert_rules`, `alert_events`, `refreshes`, and `research_notes` support Pulse, Portfolio, Watchtower, and Journal.
- `documents` stores company, type, period, publication date, source link, downloaded path, checksum, page count, and ingestion status.
- `chunks` stores the extracted text with its document ID, PDF page, ticker, and chunk index.

## Deliberate constraints

- No model provider is wired because evidence retrieval is the useful zero-key baseline here. There is no price-prediction model.
- Pulse supports company search, 24h/3d/7d/custom date windows, attention tier, category filter, and collapsed routine filings. The Portfolio and Pulse views open a company detail overlay with stored EOD freshness, recent filings, and configured document links.
- The PULL document-discovery registry currently contains Infosys FY26 and Q2 FY27 source PDFs. Search input accepts another NSE ticker, but FINN does not pretend to have its documents until verified links are added. The evidence map groups cited excerpts; it is not a completed investment analysis.
- Results extraction is a narrow worked example for Infosys Q2 FY27: Revenue, PBT, and PAT are page-cited; EBITDA is not reliably extracted. The guidance workflow retrieves four quarterly ranges, but only the Q3 FY26 guidance has a completed FY26 actual outcome in the indexed period; FY27 is still in progress. General statement parsing for other issuers, broader multi-quarter outcome pairing, document discovery for arbitrary companies, and professional biographies are not implemented.
- `financialChange` is a tested domain helper for positive/zero/negative baselines; it is not wired to results extraction or displayed in the product.
- Screenshot-based visual QA and browser-driven end-to-end interaction checks could not be completed because the Windows computer-use runtime failed to initialize.
