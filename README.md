# PathCV

A React + TypeScript + Tailwind CV builder with local-only persistence and a browser print-to-PDF workflow.

## Run locally

```bash
npm install
npm run dev
```

Build the production bundle with `npm run build`.

## Routes

- `/` — landing page
- `/builder` — guided CV editor and live A4 preview
- `/templates` — ten original templates, each previewed with the same fictional sample CV
- `/profile` — reusable local career profile and backup controls
- `/my-cvs` — locally saved CV versions and backup controls
- `/cover-letter` — optional matching letter builder
- `/help` and `/privacy` — plain-language help and data handling
- `/resources` and `/resources/:slug` — original career guides and in-depth articles
- `/about` and `/contact` — who we are, and how to reach us

## Data and PDF behavior

The profile, CV snapshots, and letter draft live in this browser's `localStorage`. Export JSON creates a user-controlled backup; importing validates the file and asks before replacing local data. The PDF button opens the browser print dialog; choose “Save as PDF.” Printed text remains selectable, and the same HTML document powers the preview and print layout.

The interface is English-only. User-authored CV content is not translated. No account, cloud sync, sharing, AI writing, ATS scoring, or DOCX export is implemented.
