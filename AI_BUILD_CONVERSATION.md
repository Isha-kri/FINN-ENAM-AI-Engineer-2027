# FINN project collaboration: reconstructed discussion guide

> **Status and use:** This document is a retrospective reconstruction of the FINN project collaboration, assembled from the project brief and repository artifacts. It is not a transcript, chat export, or reliable record of exact wording, message order, or timing. The sections below summarize themes and decisions; they do not recreate speaker-by-speaker dialogue. Use them to discuss the project in a new conversation. If an original chat history is required, obtain it through the platform's export or share feature.

## Project in brief

FINN is a prototype built for the ENAM project challenge. The work developed from the challenge brief into a runnable, mobile-friendly web application with supporting setup, demo, architecture, source, and limitation documents. The repository's implementation and handoff status are recorded in [AI_BUILD_HISTORY.md](AI_BUILD_HISTORY.md), while [LOCAL_RUN.md](LOCAL_RUN.md) explains how to launch it.

## Reconstructed project decisions

These points summarize the choices reflected in the project artifacts. They are not presented as quotations or as a complete record of how each choice was made.

### Make the deliverable usable

The project was shaped as a working local prototype rather than a static concept. Setup scripts and a demo path were included so a reviewer could try the application on their own machine. This made the handoff more concrete, while leaving the reviewer dependent on a supported Node.js version and an initial dependency install.

### Keep research claims grounded

The research experience uses page-indexed primary materials for its worked example and local lexical retrieval. Illustrative Pulse content is labeled as such, and limitations are documented. This favors traceability and honest scope over implying that a live external research or language-model service is powering the prototype.

### Expand the product around distinct tasks

The navigation grew to include Pulse, Portfolio, Research, Watchtower, and Journal. Portfolio search and sector filters support browsing; company views connect to research; and the journal supports personal notes and status tracking. The intent reflected in the implementation is to give each area a practical role instead of adding tabs without a clear use.

### Separate personal notes from evidence

Journal entries are treated as user working notes and kept distinct from source-backed research. That boundary helps prevent an analyst's opinion from being mistaken for a verified company fact.

### Design for a credible handoff

The repository includes run instructions, a demo script, architecture and limitations notes, and a build history. A temporary preview can help with quick review, but its availability depends on the process hosting it; the repository and local package provide more durable access paths.

## Lessons to carry forward

- **A usable prototype needs a clear first-run path.** A reviewer should know what to install, how to launch the app, and what to try first.
- **Show provenance and freshness where claims appear.** Labels and source links help users judge what is evidence, what is illustrative, and how current a result may be.
- **Keep confidence aligned with the implementation.** Local lexical retrieval can support a useful demo, but should not be described as an AI research agent or live data service.
- **Add features to support workflows.** Portfolio-to-research links and a personal journal make the expanded navigation more coherent when each destination supports a specific task.
- **Treat handoff as part of the product.** Setup instructions, known limitations, and an honest build record make the prototype easier to review and maintain.
- **Keep retrospective records distinct from source history.** A reconstruction can explain decisions and lessons, but it cannot substitute for an exported conversation.

## Topics for a new conversation

Use these questions to continue the discussion without relying on reconstructed dialogue:

1. Which FINN workflow should a reviewer try first, and what should they learn from it?
2. Which research claims have primary-source support, and which content is only illustrative?
3. What would be needed to move from local lexical retrieval to a dependable live research workflow?
4. Do the five navigation areas support distinct user tasks, or should any be combined or reprioritized?
5. What evidence would show that the Journal's separation from verified research is clear to users?
6. Which deployment path best fits the next review: local launch, a stable hosted preview, or both?

## Related project records

- [AI_BUILD_HISTORY.md](AI_BUILD_HISTORY.md) — implementation and handoff history.
- [ARCHITECTURE.md](ARCHITECTURE.md) — application structure and technical choices.
- [SOURCES_AND_LIMITATIONS.md](SOURCES_AND_LIMITATIONS.md) — source grounding and known limitations.
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — suggested reviewer walkthrough.
- [LOCAL_RUN.md](LOCAL_RUN.md) — local setup and launch steps.
