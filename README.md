# PathCV

A React + TypeScript + Tailwind CV builder with local-only persistence and a browser print-to-PDF workflow.

The header toggle switches between light and dark themes. The choice is saved in `localStorage`; first-time visitors follow their OS preference. CV and cover-letter documents always preview and print on white paper in either theme.

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
- `/terms` — plain-words terms of use

## Data and PDF behavior

The profile, CV snapshots, and letter draft live in this browser's `localStorage`. Export JSON creates a user-controlled backup; importing validates the file and asks before replacing local data. The PDF button opens the browser print dialog; choose “Save as PDF.” Printed text remains selectable, and the same HTML document powers the preview and print layout.

The interface is English-only. User-authored CV content is not translated. No synced account, cloud CV library, public sharing, ATS scoring, or DOCX export is implemented.

## Premium AI CV generator

`/ai-cv` supports drafting from career notes, revising an imported PDF/DOCX/text CV, and matching a CV to a job description. The output is a normal PathCV draft, editable with all ten templates, section controls, live preview, and print-to-PDF. DOCX is supported for import, not export. Suggested skills and gaps appear separately from the CV. Users should review all AI content for accuracy.

The feature is **off by default**: the sample editor and free manual builder work with no secrets. To enable checkout and generation:

1. Use Node 22+ and provision a PostgreSQL database. Copy `.env.example` to `.env` for local development. For deployment, configure these variables as **server-only** environment variables, never `VITE_*` variables. Set `PREMIUM_APP_URL` to the exact public origin and generate a stable `PREMIUM_SESSION_SECRET` of at least 32 characters (e.g. `openssl rand -hex 32`). Rotating this secret signs users out of their existing browser wallets.
2. Initialize PostgreSQL with `npm run premium:admin -- migrate`, using the target environment’s `DATABASE_URL`. Configure a pooled database connection for serverless deployments. With Vercel, the Node function is `api/premium.mjs`; Vite serves the same handler in development.
3. Configure Stripe and OpenAI test credentials and a model supporting Chat Completions JSON mode. Register a Stripe webhook at `https://YOUR_ORIGIN/api/premium?action=webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, and `charge.refunded`. For localhost, forward these events with the Stripe CLI and use its webhook signing secret. Test success/cancel/failure and verify the credit history before switching to live credentials. Use a separate database for test and live to prevent test credits being carried over. Checkout shows eligible payment methods from your Stripe Dashboard settings; enable the methods you want there. Checkouts can be resumed through the browser’s payment history, and processing payments only unlock a credit once confirmed. Existing Stripe installations should add the `checkout.session.async_payment_failed` event before enabling delayed payment methods.
4. The default base price is 100 US cents, one payment per CV. `PREMIUM_CURRENCIES` enables local fixed prices based on indicative conversion factors (not a live exchange-rate feed). Enable only currencies supported by your Stripe merchant account and verify minimum charges, settlement fees, and any taxes for your business. Stripe merchant availability depends on the business’s country; accepting a currency such as PKR does not imply Stripe merchant onboarding is available there. If your business cannot open a Stripe account, a different checkout provider is required.
5. Set a daily job to run `npm run premium:admin -- purge-results` to delete temporary generation recovery text older than 24 hours. The API stops serving recovery results after 24 hours even if cleanup is delayed. Use provider budget alerts and configure hosting-level rate limits for the premium endpoint (separately from the signed webhook) before public launch.

Credits and payments are tied to a signed HttpOnly browser cookie, not a synced account. Local JSON backups can restore CV documents but do not restore a wallet. One credit covers a new CV and up to eight AI text revisions. Manual editing and repeat downloads remain free. Failed generations restore the credit; duplicate Stripe events or generation requests do not add or use extra credits. Financial refunds for unused credits are an admin action, separate from failed-generation credit restoration.

### Admin commands

From a trusted environment with database access (and the Stripe key for refunds):

| Command after `npm run premium:admin --` | Purpose |
| --- | --- |
| `price 100` | Set the USD base price in cents |
| `wallets` / `payments` / `generations` | Review wallets, transactions, or generation metadata |
| `expenses` | Review token counts and estimated model costs when pricing rates are configured |
| `grant WALLET COUNT` / `revoke WALLET COUNT` | Manage promotional credits |
| `refund PAYMENT_ID` | Request a Stripe refund for a paid, unused credit |
| `purge-results` | Remove expired recovery copies |

`npm test` covers the premium API with an embedded PostgreSQL engine and test doubles for paid providers. No live charges or AI calls are made by the tests.
