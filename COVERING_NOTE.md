# Covering email draft

**To:** assessment@enam.com  
**Subject:** IIT Delhi – AI Engineer - 2027

Hello ENAM team,

I built FINN as a mobile-first signal desk with a portfolio pulse, configurable EOD alerts, and a source-grounded research view. The prototype reads official NSE announcements RSS and Yahoo daily history and indexes verified Infosys annual and quarterly primary documents page by page, and it indexes Infosys’s FY26 annual report and Q2 FY27 earnings-call transcript page by page. Research results show short retrieved excerpts with links to the cited PDF pages.

I kept the product deliberately small and honest about its boundaries: the Pulse fallback examples are marked illustrative; Yahoo data is labeled EOD/delayed; and FINN does not invent a result, filing, or research conclusion when it cannot cite a primary source. The local zero-key research mode uses lexical retrieval rather than a stock-price model or an LLM. SQLite holds filings, price history, alert rules, trigger events, document metadata, and page chunks on the machine running the app.

I implemented category-based filing alerts alongside close-move and volume rules. The Infosys Q2 FY27 statement now demonstrates page-cited Revenue, PBT, and PAT extraction with QoQ/YoY comparisons. EBITDA remains unextracted; general parsing for other issuers, broader multi-company document discovery, and four-quarter narrative-vs-numbers analysis remain next steps. Those need careful page evidence and basis/unit validation before they should be shown as conclusions. The next step would be a stronger filing provider plus visual QA on real mobile devices.

Run the local prototype with `npm install` and `npm run dev`; open http://localhost:5173. The source repository is https://github.com/Isha-kri/FINN-ENAM-AI-Engineer-2027. The prototype is not deployed yet; run it locally with `npm install` and `npm run dev` at http://localhost:5173. The AI build history index is in the repository; the full conversation export/share link should be added before sending. This email is a draft only.

Regards,  
FINN build challenge submission
