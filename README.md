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
4. `/signup` and `/login`: email and password. `/dashboard`: the account email, a preview credit balance, and log out.
5. `/privacy`, `/terms`, and `/refund`: draft pages.
6. `/jobs`: live listings from Remotive, Arbeitnow, Himalayas, and Remote OK. Cards link to the original posting. “Tailor my resume for this job” opens `/tailor` with that description filled in. `/jobs` stays public.

Local preview credits (default 5) live in an httpOnly cookie named `prt_credits`. They are not a purchase. Set `LOCAL_CREDITS_START` to change the seeded amount. Clearing the cookie seeds them again.

## Payments and accounts

`PAYMENT_PROVIDER` is `polar` or `paystack`. Both adapters implement the same `PaymentProvider` interface and return `coming_soon`. They do not call Polar or Paystack and they do not need keys.

Credits go through `CreditsRepository` in `src/lib/credits/types.ts`. The live implementation is still the cookie ledger. When someone is logged in, the ledger subject id is their Supabase auth user id. Checkout is still a stub. `credit_balances` and `credit_ledger` are not created.

## Accounts

Email and password accounts use Supabase Auth through `@supabase/ssr`. Supabase hashes the password. This app stores the session in httpOnly cookies and refreshes it in `src/proxy.ts`. Next.js 16 renamed Middleware to Proxy; the session code is the same job middleware used to do. The publishable anon key is the only Supabase key the app reads. The service role key is not used.

`/tailor` and `/dashboard` require a logged-in user once the Supabase variables are set. Anyone else is redirected to `/login?next=...` and sent back after login. The landing page, pricing, the legal pages, and `/jobs` stay public. `/api/jobs` stays public too. `/api/tailor` also refuses the request when accounts are on and there is no session.

If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, the build still passes. Signup, login, the tailor, and the dashboard show **Accounts aren't configured yet**. The tailor keeps working. Nothing is hard-locked.

Passwords must be at least 8 characters. The app also rejects passwords longer than 72 characters, which is the bcrypt limit.

### Supabase dashboard

1. In the Supabase project, open Authentication → URL configuration.
2. Set Site URL to `https://proresumetailor.com`.
3. Add redirect URL `https://proresumetailor.com/auth/callback`. The app sends people back to the host they signed up on, so also allow any preview host you still use.
4. For local development, also allow `http://localhost:3000/auth/callback`.
5. Authentication → Providers: enable Email. Set the minimum password length to 8 so Supabase enforces the same rule.
6. Apply `supabase/migrations/20261113001000_profiles.sql`. It creates `public.profiles`, turns on RLS so a user can read only their own row, and adds a trigger in the private schema that inserts the profile when `auth.users` grows.
7. Copy the project URL and the publishable anon key into the variables above. Do not put the service role key in the app.

The profiles table does not store a password. Disconnecting an account is log out, which clears the session cookie.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Deploy on Vercel

1. Import the Git repository. Framework preset: Next.js.
2. Add the variables from `.env.example` in Project Settings → Environment Variables. Mark `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as sensitive. Leave the AI keys empty to stay in mock mode. Leave the Supabase keys empty to keep accounts off. In the Supabase dashboard, set Site URL to `https://proresumetailor.com` and allow `https://proresumetailor.com/auth/callback`. Redirects in the app stay on the request host.
3. Do not set `runtime = 'edge'`. The AI call and PDF parsing use the default Node.js runtime.
4. Deploy. `npm run build` is the build command Vercel detects.

No `vercel.json` is required for this app.
