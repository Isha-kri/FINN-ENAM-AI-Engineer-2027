# Demo script (about 4 minutes)

1. **Pulse — 40 seconds.** Show the daily briefing, 24h / 3d / 7d / custom date controls, company and filing-category filters, high-priority switch, and collapsed routine section. Point out `ILLUSTRATIVE FEED` and `DEMO` markers: fallback examples are not exchange filings.
2. **Portfolio — 40 seconds.** Search or filter the 18-company universe by sector. Open a company brief to inspect stored EOD freshness, recent filings, and configured research links; hand off to Deep Research.
3. **Research journal — 35 seconds.** Create a local note tagged Thesis, Catalyst, Risk, or Question, then edit its status. Explain that personal notes are kept separate from source-backed company evidence.
4. **Refresh and Watchtower — 55 seconds.** Press `Refresh sources` to show NSE scan and Yahoo EOD coverage. Add an EOD move/volume rule or filing-category rule for a ticker or the portfolio. EOD data is never streaming; market triggers need a newer session.
5. **Deep Research — 100 seconds.** Select `Research`, keep `INFY.NS`, and ask about Q2 growth. Use `Build evidence map` for cited business, financial, narrative, positive, and risk passages. `Compare guidance with outcomes` shows four indexed call ranges and the Q3 FY26 range against the later 3.1% FY26 result. `Extract latest results` shows Revenue, PBT, PAT, QoQ/YoY, and the EBITDA extraction gap with PDF page evidence.

## Reset

To start with a clean local prototype, stop the server and remove `data/finn.sqlite`, `data/finn.sqlite-shm`, `data/finn.sqlite-wal`, and `data/documents/` from this project directory. The next run recreates the database and re-indexes primary documents when asked. (Do not commit the downloaded PDFs.)
