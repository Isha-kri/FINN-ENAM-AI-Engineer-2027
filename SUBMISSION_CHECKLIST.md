# ENAM submission checklist

Checked against the supplied challenge brief on 15 November 2026.

| Deliverable | Status | What to send / remaining step |
|---|---|---|
| Mobile-first working prototype | **Complete as a responsive local web app.** No stable hosted deployment is active. | Attach or link `FINN-local-prototype.zip`. A reviewer can run it locally; `LOCAL_RUN.md` explains same-Wi-Fi phone access. The previous temporary tunnel is offline, so do not submit it as a live demo. |
| GitHub repository | **Complete and public.** | https://github.com/Isha-kri/FINN-ENAM-AI-Engineer-2027 |
| AI build history | **Partially complete.** | `AI_BUILD_HISTORY.md` is an implementation record in the repo. The shared Codex chat URL supplied for this submission is a post-build retrospective, not the original build-time chat export. If ENAM requires the original conversation, create a share link from the actual project build chat and replace or supplement the retrospective link in `SUBMISSION_EMAIL.txt`. |
| Short covering writeup | **Complete.** | `SUBMISSION_EMAIL.txt` is ready to paste into an email. Subject line is set to the requested wording. |

## Verification

- The public GitHub repository exists and its `master` branch was confirmed at commit `e3fea57` before the latest handoff edits.
- Type-check passed, all 11 domain tests passed, and the production build passed for the application changes.
- Local API smoke checks covered the 18-company portfolio response and research-journal create/read/update/delete flow.
- The former Cloudflare preview URL no longer resolves. The Render Blueprint is prepared, but an account owner must approve deployment; it is not a live preview today.
- Browser screenshot automation was unavailable in this Windows session. Do not claim completed visual QA on a physical phone.

## Suggested email attachments

1. `FINN-local-prototype.zip` — runnable source package.
2. `AI_BUILD_HISTORY.md` — factual implementation record.
3. `DEMO_SCRIPT.md` — reviewer walkthrough.

The full repository also includes `SOURCES_AND_LIMITATIONS.md`, `ARCHITECTURE.md`, `LOCAL_RUN.md`, and this checklist.
