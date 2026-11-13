# Pro Resume Tailor

Turn a generic CV into a role-specific resume. Paste or upload a resume, paste a job description, and download a text-based, single-column PDF.

The tailor is instructed to rephrase, reorder, and emphasise only what the user supplied. It must not invent employers, dates, metrics, or tools. With no API key, the app still runs end to end in **mock mode**, which reorders the user’s own text and highlights skills that already appear in the job description.

Five tailorings are priced at ₦9,900, once. There is no subscription and no trial. Checkout uses Paystack in NGN.

## Stack

- Next.js (App Router) and TypeScript
- Tailwind CSS
- Grok through the OpenAI SDK pointed at `https://api.x.ai/v1` (`grok-4.3` by default, override with `XAI_MODEL`)
- Optional Claude through `@anthropic-ai/sdk` when `AI_PROVIDER=anthropic`
- Paystack for the one-time ₦9,900 pack
- PDF text via `unpdf`, DOCX text via `mammoth`, ATS PDF via `pdf-lib`

## Setup

Use Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The tailor flow works immediately in mock mode.

To call Grok, set `XAI_API_KEY` in `.env.local`. The key is read on the server only and is sent only to `https://api.x.ai`. Do not use a `NEXT_PUBLIC_` prefix.

```bash
AI_PROVIDER=grok
XAI_API_KEY=your-key
XAI_MODEL=grok-4.3
```

To switch the provider later:

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-sonnet-5-5
```

Grok is the primary provider. If `XAI_API_KEY` is missing, or `AI_PROVIDER=mock`, requests stay in mock mode. The tailor page does not mention that fallback. An `AI_PROVIDER=anthropic` request with no Anthropic key also stays in mock mode.

## What you can do

1. Landing page: tagline, three steps, the no-subscription message, and FAQ.
2. `/tailor`: paste a resume or upload PDF/DOCX, paste a job, tailor, compare before and after, download Letter or A4 PDF.
3. `/pricing`: the ₦9,900 pack of 5 tailorings. The button reads “Get 5 tailorings for ₦9,900”. Signed-in people with Paystack configured go to Paystack. Everyone else goes to signup, and a signed-in person without Paystack keys goes to the dashboard. The page does not mention missing keys.
4. `/signup` and `/login`: email and password. `/dashboard`: the account email, a preview credit balance, and log out.
5. `/privacy`, `/terms`, and `/refund`: draft pages.
6. `/jobs`: live listings from Remotive, Arbeitnow, Himalayas, and Remote OK. Cards link to the original posting. “Tailor my resume for this job” opens `/tailor` with that description filled in. `/jobs` stays public.

When Supabase is not configured, local preview credits (default 5) still live in an httpOnly cookie named `prt_credits`. They are not a purchase. Set `LOCAL_CREDITS_START` to change the seeded amount. Clearing the cookie seeds them again. Once accounts are on, signed-in balances come from `credit_balances` and the cookie is not the ledger.

## Payments and accounts

The pack button charges ₦9,900 (990000 kobo) through Paystack. `PAYSTACK_CURRENCY` defaults to `NGN` and `PRICE_AMOUNT_MINOR` defaults to `990000`. Both `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` have to be set, along with `SUPABASE_SERVICE_ROLE_KEY`, before checkout leaves the site. The secret is used only on the server.

Initialize calls `POST https://api.paystack.co/transaction/initialize` and sends `callback_url` as `NEXT_PUBLIC_SITE_URL` (default `https://proresumetailor.com`) plus `/api/paystack/callback`. Paystack redirects the browser to `GET /api/paystack/callback`, which verifies the transaction and then redirects to `/dashboard?payment=success` or `/dashboard?payment=failed`.

Paystack notifications go to `POST /api/webhooks/paystack`. The route checks the `x-paystack-signature` HMAC-SHA512 of the raw body against `PAYSTACK_SECRET_KEY`. A successful charge grants 5 credits once. `payments.reference` is the Paystack reference, so a retry does not grant again.

Apply `supabase/migrations/20261113003000_credits_payments.sql` after the profile migrations. It creates `credit_balances` and `payments`, turns on RLS so a user can read only their own rows, and keeps the grant, spend, and refund functions in the private schema. The service role key is what the server uses to write them. Do not expose that key to the browser.

Polar remains an unwired stub. It does not run the pack checkout.

## Accounts

Email and password accounts use Supabase Auth through `@supabase/ssr`. Supabase hashes the password. This app stores the session in httpOnly cookies and refreshes it in `src/proxy.ts`. Next.js 16 renamed Middleware to Proxy; the session code is the same job middleware used to do. The publishable anon key is the key the browser session uses. `SUPABASE_SERVICE_ROLE_KEY` stays on the server and is used to record payments and balances.

`/tailor` and `/dashboard` require a logged-in user once the Supabase variables are set. Anyone else is redirected to `/login?next=...` and sent back after login. The landing page, pricing, the legal pages, and `/jobs` stay public. `/api/jobs` stays public too. `/api/tailor` also refuses the request when accounts are on and there is no session.

If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, the build still passes. Signup, login, and verify still render their forms. Submitting them returns a generic retry message. The tailor keeps working. The dashboard shows tailorings left and a signup link. Nothing is hard-locked, and the UI does not mention missing keys.

Passwords must be at least 8 characters. The app also rejects passwords longer than 72 characters, which is the bcrypt limit.

### Supabase dashboard

1. In the Supabase project, open Authentication → URL configuration.
2. Set Site URL to `https://proresumetailor.com`.
3. Add redirect URL `https://proresumetailor.com/auth/callback`. The app sends people back to the host they signed up on, so also allow any preview host you still use.
4. For local development, also allow `http://localhost:3000/auth/callback`.
5. Authentication → Providers: enable Email. Set the minimum password length to 8 so Supabase enforces the same rule.
6. Apply `supabase/migrations/20261113001000_profiles.sql`, then `20261113002000_profile_onboarding.sql`, then `20261113003000_credits_payments.sql`. The first creates `public.profiles`, turns on RLS so a user can read only their own row, and adds a trigger in the private schema that inserts the profile when `auth.users` grows. The credits migration adds the balance and payment tables.
7. Copy the project URL and the publishable anon key into the public variables. Put the service role key in `SUPABASE_SERVICE_ROLE_KEY` only. Never prefix it with `NEXT_PUBLIC_`.
8. In Paystack, set the webhook URL to `https://proresumetailor.com/api/webhooks/paystack`.

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
2. Add the variables from `.env.example` in Project Settings → Environment Variables. Mark `XAI_API_KEY`, `ANTHROPIC_API_KEY`, `PAYSTACK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as sensitive. Leave `XAI_API_KEY` empty to stay in mock mode. Leave the Supabase keys empty to keep accounts off. Leave the Paystack keys empty and the pack button sends people to signup or the dashboard. In the Supabase dashboard, set Site URL to `https://proresumetailor.com` and allow `https://proresumetailor.com/auth/callback`. Set `NEXT_PUBLIC_SITE_URL` to that same origin so the Paystack callback is `https://proresumetailor.com/api/paystack/callback`.
3. Do not set `runtime = 'edge'`. The AI call and PDF parsing use the default Node.js runtime.
4. Deploy. `npm run build` is the build command Vercel detects.

No `vercel.json` is required for this app.
