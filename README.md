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
4. `/settings`: LinkedIn connection status and Disconnect. `/settings/linkedin` is the consent screen shown before any redirect.
5. `/privacy`, `/terms`, and `/refund`: draft pages.

Local preview credits (default 5) live in an httpOnly cookie named `prt_credits`. They are not a purchase. Set `LOCAL_CREDITS_START` to change the seeded amount. Clearing the cookie seeds them again.

## Payments and accounts

`PAYMENT_PROVIDER` is `polar` or `paystack`. Both adapters implement the same `PaymentProvider` interface and return `coming_soon`. They do not call Polar or Paystack and they do not need keys.

Credits go through `CreditsRepository` in `src/lib/credits/types.ts`. The only implementation today is the cookie ledger. A later Supabase adapter can replace that body using `credit_balances` and `credit_ledger` once accounts exist. Those credit tables are not created here.

## LinkedIn sign-in

This is Sign In with LinkedIn using OpenID Connect. The scopes are `openid`, `profile`, and `email`. That product returns the member’s name, email, profile photo, and member ID (the OpenID `sub`). It does not return work history, endorsements, or network data. The consent screen says that before the browser is sent to LinkedIn. The scope list lives in `src/lib/linkedin/scopes.ts`. Add a scope there only after LinkedIn approves the product, and update the consent copy in the same change.

The button says **LinkedIn connect not configured yet** when `LINKEDIN_CLIENT_ID` or `LINKEDIN_CLIENT_SECRET` is missing. It does not throw. If those are set but `TOKEN_ENCRYPTION_KEY` is missing or not 32 bytes, the button says **Token encryption is not configured yet** and sign-in stays off.

### LinkedIn developer app

1. Open [LinkedIn Developer Apps](https://www.linkedin.com/developers/apps) and create an app.
2. On the Products tab, add **Sign In with LinkedIn using OpenID Connect**. Do not request partner products for work history or connections. This app cannot read them.
3. On the Auth tab, add this authorized redirect URL:

   `https://pro-resume-tailor.vercel.app/api/auth/linkedin/callback`

4. Copy the client ID and client secret into `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`. Both are server-only.
5. For local development, also register `http://localhost:3000/api/auth/linkedin/callback` and set `LINKEDIN_REDIRECT_URI` to that exact URL.
6. Generate a storage key and set it as `TOKEN_ENCRYPTION_KEY`:

   ```bash
   openssl rand -base64 32
   ```

### What the sign-in does

1. `/settings/linkedin` lists what is read and what is not. Continuing is a POST, so a prefetch cannot start the redirect.
2. The server stores `state`, `nonce`, and a PKCE verifier in an encrypted httpOnly cookie, then redirects to LinkedIn.
3. The callback checks `state`, exchanges the code on the server, verifies the ID token signature against LinkedIn’s JWKS, and checks issuer, audience, expiry, and `nonce`.
4. Profile fields are taken from the userinfo response. Only name, email, photo, and member ID are kept.
5. The access token (and a refresh token, if LinkedIn returns one) is encrypted with AES-256-GCM and stored. The page never receives the token. Nothing is written to `localStorage`.

PKCE is on by default. LinkedIn has rejected `code_challenge` together with the `openid` scope for some apps, with the error `Open ID permission is not supported for PKCE flows`. If that happens, set `LINKEDIN_PKCE=0`. State and nonce checks stay on.

Disconnect is on `/settings`. It deletes the stored profile and token, then POSTs the token to `https://www.linkedin.com/oauth/v2/revoke`. LinkedIn’s public docs do not promise that endpoint for every app. If revocation is rejected or the endpoint is missing, the local data is still deleted and the page says so. The member can also remove the app under LinkedIn Settings → Data privacy → Permitted services.

### Where the connection is stored

`LinkedInConnectionStore` has two implementations:

- **Supabase**, when `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` are both set. Apply `supabase/migrations/20261112233000_linkedin_connections.sql` first. The table has RLS enabled. `anon` and `authenticated` have no grants and explicit deny policies. The server uses the service role, which bypasses RLS. The token column holds ciphertext, not the raw token. The anon key is not read.
- **Encrypted cookie**, when those Supabase variables are absent. The whole connection record sits in the httpOnly cookie `prt_li_conn`, encrypted with the same key. This is the path that works before Supabase is wired up.

`prt_sid` is a separate httpOnly session id used as the Supabase row key. It is not a LinkedIn token.

The migration file is in the repo. Applying it to the Supabase project is a separate step. Until `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set on the server, the running app does not call Supabase.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Deploy on Vercel

1. Import the Git repository. Framework preset: Next.js.
2. Add the variables from `.env.example` in Project Settings → Environment Variables. Mark `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `LINKEDIN_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as sensitive. Leave the AI keys empty to stay in mock mode. Leave the LinkedIn keys empty to keep connect disabled. The redirect URL registered on the LinkedIn app must be `https://pro-resume-tailor.vercel.app/api/auth/linkedin/callback`.
3. Do not set `runtime = 'edge'`. The AI call and PDF parsing use the default Node.js runtime.
4. Deploy. `npm run build` is the build command Vercel detects.

No `vercel.json` is required for this app.
