# PathCV

A React + TypeScript + Tailwind CV builder with local draft storage, browser print-to-PDF, and a server-backed ATS checker.

The header toggle switches between light and dark themes. The choice is saved in `localStorage`; first-time visitors follow their OS preference. CV and cover-letter documents always preview and print on white paper in either theme.

## Run locally

Use Node.js 22.

```bash
npm ci
npm run dev
```

Build the production bundle with `npm run build`; run the ATS tests with `npm test`. Vite mounts the same API handler in development and local preview. On Vercel it runs as a Node function at `/api/ats`. A purely static host won’t run the checker.

## Routes

- `/` — landing page
- `/ats-checker` — PDF/DOCX and saved-draft scoring, optional job matching, and local score snapshots
- `/builder` — guided CV editor and live A4 preview
- `/templates` — ten original templates, each previewed with the same fictional sample CV
- `/profile` — reusable local career profile and backup controls
- `/my-cvs` — locally saved CV versions and backup controls
- `/cover-letter` — optional matching letter builder
- `/help` and `/privacy` — plain-language help and data handling
- `/resources` and `/resources/:slug` — original career guides and in-depth articles
- `/about` and `/contact` — who we are, and how to reach us
- `/terms` — plain-words terms of use

## Data and PDF behavior

The profile, CV snapshots, and letter draft live in this browser's `localStorage`. Export JSON creates a user-controlled backup; importing validates the file and asks before replacing local data. The PDF button opens the browser print dialog; choose “Save as PDF.” Printed text remains selectable, and the same HTML document powers the preview and print layout.

The interface and ATS rubric are English-first. User-authored CV content is not translated. There are no accounts, cloud sync, hosted CV sharing, or DOCX export.

## ATS checker deployment and privacy

- **Free, no credentials required:** upload an actual PDF or DOCX, or use a saved draft’s text. The server validates signatures, parses bounded document/text content, and reports the individual category points. The 75-point general rubric is normalized to 100. When a supplied job description yields scorable terms, the 25-point matching category brings the denominator to 100. If it yields no usable terms, that category is marked unavailable, not silently scored as zero. Grammar, keywords, and layout checks are heuristics, not a real employer’s ATS. PDF structural signals depend on detectable tags/spacing; OCR is not supported.
- **Upload cap:** ordinary requests accept up to 4 MiB. To support the full 5 MiB on Vercel (whose function request cap is 4.5 MB), configure `ATS_REDIS_URL` and `ATS_REDIS_TOKEN` for an HTTPS Redis REST endpoint (Upstash-compatible, supports `EVAL` and `GETDEL`), plus a separate random `ATS_UPLOAD_SECRET` of 32+ characters. Over 4 MiB, the browser sends two separate requests. The first part is stored as authenticated, encrypted chunks for at most 120 seconds and consumed with `GETDEL`; the second is parsed with the reconstructed file. Neither the file nor its upload ticket is put in a URL. Redis also enables distributed rate limiting; without it, limits are best-effort per function instance. Add platform-level limits for production traffic.
- **Premium:** the repository has no active checkout, identity service, or verified payment ledger. Premium is locked by default. To exercise the Premium editor, detailed report, recheck, and ATS print-to-PDF in a private environment, set a unique random `ATS_ACCESS_SECRET` (32+ characters) and issue a short-lived code from a trusted shell with `node scripts/ats-access.mjs 1` (expiry in hours). Pass the same secret via the CLI environment, not an argument. A code is a reusable bearer credential until expiry; distribute only to trusted testers and rotate the secret to invalidate codes and sessions. This is not a payment flow. For commercial use, wire a verified, revocable entitlement into the API instead of distributing test codes.
- **Optional AI:** with verified Premium access and server-only `OPENAI_API_KEY`, the user can explicitly send the shown text and job details to OpenAI for suggested wording. `ATS_OPENAI_MODEL` is optional. Suggestions must be reviewed and can be edited or discarded. Validation rejects added numerical claims; it cannot verify all non-numeric facts. AI never sets the ATS score. Keep separate secrets, provider projects, and Redis instances for Preview and Production. See `.env.example`; never use a `VITE_` prefix for secrets. No database migrations are needed.
- **Retention:** responses are not cached. Ordinary analysis does not store CV or JD content on the server. Make sure hosting/provider logging excludes bodies, cookies, and OpenAI requests. The explicit “Save score” action stores the snapshot name and category scores only on that device; snapshots are not included in standard CV backups. The Premium editor does not overwrite the original file or builder draft. Print-to-PDF uses a single column and selectable text, not DOCX.
