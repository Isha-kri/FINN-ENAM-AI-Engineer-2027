# Covering email draft

**To:** assessment@enam.com  
**Subject:** IIT Delhi – AI Engineer - 2027

Hello ENAM team,

I built FINN as a mobile-first signal desk with a portfolio pulse, configurable EOD alerts, and a source-grounded research view. The prototype reads official NSE announcements RSS and Yahoo daily history, and it indexes Infosys’s FY26 annual report and Q2 FY27 earnings-call transcript page by page. Research results show short retrieved excerpts with links to the cited PDF pages.

I kept the product deliberately small and honest about its boundaries: the Pulse fallback examples are marked illustrative; Yahoo data is labeled EOD/delayed; and FINN does not invent a result, filing, or research conclusion when it cannot cite a primary source. The local zero-key research mode uses lexical retrieval rather than a stock-price model or an LLM. SQLite holds filings, price history, alert rules, trigger events, document metadata, and page chunks on the machine running the app.

I left category-specific filing rules, statement-table extraction with QoQ/YoY comparisons, broader multi-company document discovery, and synthesized narrative-vs-numbers analysis for the next iteration. Those need careful page evidence and basis/unit validation before they should be shown as conclusions. The next step would be a stronger filing provider plus automated tests and visual QA on real mobile devices.

Run the local prototype with `npm install` and `npm run dev`; open http://localhost:5173. The source repository is the project folder supplied with this submission. No deployment URL or public repository was created, and this email is a draft only.

Regards,  
FINN build challenge submission
