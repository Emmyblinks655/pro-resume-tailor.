-- LinkedIn OpenID Connect connections.
-- The Next.js server writes with the service role. Access tokens are AES-256-GCM
-- ciphertext produced in the app (TOKEN_ENCRYPTION_KEY). This table is not for browser clients.
-- Apply this in the Supabase SQL editor, or with `supabase db push`, before setting
-- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Without those variables the app uses an
-- encrypted httpOnly cookie instead.

create table public.linkedin_connections (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  member_id text not null,
  display_name text,
  email text,
  picture_url text,
  token_ciphertext text not null,
  token_expires_at timestamptz,
  scopes text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint linkedin_connections_session_id_len check (char_length(session_id) between 32 and 64),
  constraint linkedin_connections_member_id_len check (char_length(member_id) between 1 and 256),
  constraint linkedin_connections_display_name_len check (display_name is null or char_length(display_name) <= 200),
  constraint linkedin_connections_email_len check (email is null or char_length(email) <= 320),
  constraint linkedin_connections_picture_url_len check (picture_url is null or char_length(picture_url) <= 2000),
  constraint linkedin_connections_scopes_len check (char_length(scopes) between 1 and 200),
  constraint linkedin_connections_token_ciphertext_shape check (
    char_length(token_ciphertext) between 8 and 8000
    and token_ciphertext like 'v1.%'
  )
);

comment on table public.linkedin_connections is
  'Server-only LinkedIn OIDC connection. token_ciphertext is AES-256-GCM, never a plaintext access token.';

comment on column public.linkedin_connections.token_ciphertext is
  'AES-256-GCM payload (v1) of the access token and optional refresh token. Do not store plaintext.';

comment on column public.linkedin_connections.session_id is
  'App browser session id from the httpOnly prt_sid cookie. Not a Supabase auth user id.';

alter table public.linkedin_connections enable row level security;

revoke all on table public.linkedin_connections from public, anon, authenticated;
grant select, insert, update, delete on table public.linkedin_connections to service_role;

-- Deny Data API roles even if a grant is added later. service_role bypasses RLS.
create policy linkedin_connections_deny_anon
  on public.linkedin_connections
  as restrictive
  for all
  to anon
  using (false)
  with check (false);

create policy linkedin_connections_deny_authenticated
  on public.linkedin_connections
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);

create index linkedin_connections_member_id_idx on public.linkedin_connections (member_id);
