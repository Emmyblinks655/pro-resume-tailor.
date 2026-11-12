-- Name and role collected after email verification.
-- Apply after 20261113001000_profiles.sql.
-- authenticated may update only full_name and headline, and only on their own row.
-- email, id, and created_at stay read-only for that role.

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists headline text;

alter table public.profiles drop constraint if exists profiles_full_name_len;
alter table public.profiles add constraint profiles_full_name_len
  check (full_name is null or char_length(btrim(full_name)) between 1 and 80);

alter table public.profiles drop constraint if exists profiles_headline_len;
alter table public.profiles add constraint profiles_headline_len
  check (headline is null or char_length(btrim(headline)) between 1 and 120);

comment on column public.profiles.full_name is
  'Display name collected on /onboarding. Null until the user saves it.';
comment on column public.profiles.headline is
  'Optional role or title, such as Frontend developer or Freelance designer.';

revoke update on table public.profiles from public, anon, authenticated;
grant update (full_name, headline) on table public.profiles to authenticated;

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
