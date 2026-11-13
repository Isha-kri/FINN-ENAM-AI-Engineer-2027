# Demo script (about 4 minutes)

1. **Pulse — 45 seconds.** Show the 24h / 3d / 7d controls, company filter, high-priority switch, and collapsed routine section. Point out `ILLUSTRATIVE FEED` and each `DEMO` marker: the fallback examples are not represented as exchange filings.
2. **Refresh — 45 seconds.** Press `Refresh sources`. Show the NSE scan count and Yahoo EOD symbol count. Explain that the NSE feed had no recent matches among the chosen names during the captured window; the direct filing links appear when a portfolio row matches. Data is EOD/delayed, never streaming.
3. **Research — 90 seconds.** Select `Research`, keep `INFY.NS`, and ask: “What did management say about revenue growth in Q2?” On the first query FINN downloads/indexes the official FY26 annual report and Q2 FY27 call transcript page by page. Click a page citation to open its PDF page. The answer is retrieved evidence; FINN does not synthesize a conclusion without support.
4. **Watchtower — 60 seconds.** Add a `Daily close move exceeds` rule for `INFY.NS`, then edit its threshold, disable it, and re-enable it. Show the saved rule and the latest Yahoo EOD market rows. A trigger is only recorded after a newer EOD session arrives; no sample trigger is fabricated.

## Reset

To start with a clean local prototype, stop the server and remove `data/finn.sqlite`, `data/finn.sqlite-shm`, `data/finn.sqlite-wal`, and `data/documents/` from this project directory. The next run recreates the database and re-indexes primary documents when asked. (Do not commit the downloaded PDFs.)
