# Pro Resume Tailor

Turn a generic CV into a role-specific resume. Paste or upload a resume, paste a job description, and download a text-based, single-column PDF.

The tailor is instructed to rephrase, reorder, and emphasise only what the user supplied. It must not invent employers, dates, metrics, or tools. With no API key, the app still runs end to end in **mock mode**, which reorders the user’s own text and highlights skills that already appear in the job description.

Five tailorings are priced at $9, once. There is no subscription and no trial. Checkout is not connected yet.

## Stack

- Next.js (App Router) and TypeScript
- Tailwind CSS
- Gemini through `@google/genai` (`gemini-3.8-flash` by default, a current free-tier Flash model)
- Optional later switch to Claude through `@anthropic-ai/sdk`
- PDF text via `unpdf`, DOCX text via `mammoth`, ATS PDF via `pdf-lib`

## Setup

Use Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The tailor flow works immediately in mock mode.

To call Gemini, set `GEMINI_API_KEY` in `.env.local`. The key is read on the server only. Do not use a `NEXT_PUBLIC_` prefix.

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-3.8-flash
```

To switch the provider later:

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-sonnet-5-5
```

If the selected provider has no key, or `AI_PROVIDER=mock`, requests stay in mock mode and the tailor page says so.

## What you can do

1. Landing page: tagline, three steps, the no-subscription message, and FAQ.
2. `/tailor`: paste a resume or upload PDF/DOCX, paste a job, tailor, compare before and after, download Letter or A4 PDF.
3. `/pricing`: the $9 pack of 5 tailorings. The button says Coming soon and calls the stub checkout adapter.
4. `/privacy`, `/terms`, and `/refund`: draft pages.
5. `/jobs`: live listings from Remotive, Arbeitnow, Himalayas, and Remote OK. Cards link to the original posting. “Tailor my resume for this job” opens `/tailor` with that description filled in.

Local preview credits (default 5) live in an httpOnly cookie named `prt_credits`. They are not a purchase. Set `LOCAL_CREDITS_START` to change the seeded amount. Clearing the cookie seeds them again.

## Payments and accounts

`PAYMENT_PROVIDER` is `polar` or `paystack`. Both adapters implement the same `PaymentProvider` interface and return `coming_soon`. They do not call Polar or Paystack and they do not need keys.

Credits go through `CreditsRepository` in `src/lib/credits/types.ts`. The only implementation today is the cookie ledger. A later Supabase adapter can replace that body using `credit_balances` and `credit_ledger` once accounts exist. The commented Supabase variables in `.env.example` are not read.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Deploy on Vercel

1. Import the Git repository. Framework preset: Next.js.
2. Add the variables from `.env.example` in Project Settings → Environment Variables. Mark `GEMINI_API_KEY` and `ANTHROPIC_API_KEY` as sensitive. Leave them empty to stay in mock mode.
3. Do not set `runtime = 'edge'`. The AI call and PDF parsing use the default Node.js runtime.
4. Deploy. `npm run build` is the build command Vercel detects.

No `vercel.json` is required for this app.
