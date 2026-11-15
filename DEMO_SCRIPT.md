# Demo script (about 4 minutes)

1. **Pulse — 45 seconds.** Show the 24h / 3d / 7d / custom date controls, company and filing-category filters, high-priority switch, and collapsed routine section. Point out `ILLUSTRATIVE FEED` and `DEMO` markers: the fallback examples are not exchange filings.
2. **Refresh — 45 seconds.** Press `Refresh sources`. Show the NSE scan count and Yahoo EOD symbol count. Explain that the NSE feed had no recent matches among the chosen names during the captured window; the direct filing links appear when a portfolio row matches. Data is EOD/delayed, never streaming.
3. **Research — 100 seconds.** Select `Research`, keep `INFY.NS`, and ask about Q2 growth. Use `Build evidence map` for cited business, financial, narrative, positive, and risk passages. `Compare guidance with outcomes` shows four indexed call ranges and the Q3 FY26 range against the later 3.1% FY26 result. `Extract latest results` shows Revenue, PBT, PAT, QoQ/YoY, and EBITDA's not reliably extracted status with PDF page evidence.
4. **Watchtower — 60 seconds.** Add and edit an EOD move/volume rule or a filing-category rule for one ticker or the whole portfolio. Show the latest Yahoo EOD rows and rule states. Market triggers need a newer EOD session; filing triggers are created when a matching source filing is first ingested.

## Reset

To start with a clean local prototype, stop the server and remove `data/finn.sqlite`, `data/finn.sqlite-shm`, `data/finn.sqlite-wal`, and `data/documents/` from this project directory. The next run recreates the database and re-indexes primary documents when asked. (Do not commit the downloaded PDFs.)
