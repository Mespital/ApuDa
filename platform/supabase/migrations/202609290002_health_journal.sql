-- Health journal entries for lightweight daily reflection.
-- Free-text entries remain profile-owned health data and are protected by RLS.

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  tags text[] not null default '{}',
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_profile_recorded_idx
  on public.journal_entries (profile_id, recorded_at desc);

alter table public.journal_entries enable row level security;

drop policy if exists "journal_entries_select_owned" on public.journal_entries;
drop policy if exists "journal_entries_insert_owned" on public.journal_entries;
drop policy if exists "journal_entries_update_owned" on public.journal_entries;
drop policy if exists "journal_entries_delete_owned" on public.journal_entries;

create policy "journal_entries_select_owned"
  on public.journal_entries
  for select
  to authenticated
  using (public.owns_profile(profile_id));

create policy "journal_entries_insert_owned"
  on public.journal_entries
  for insert
  to authenticated
  with check (public.owns_profile(profile_id));

create policy "journal_entries_update_owned"
  on public.journal_entries
  for update
  to authenticated
  using (public.owns_profile(profile_id))
  with check (public.owns_profile(profile_id));

create policy "journal_entries_delete_owned"
  on public.journal_entries
  for delete
  to authenticated
  using (public.owns_profile(profile_id));

revoke all privileges on table public.journal_entries from anon;
revoke all privileges on table public.journal_entries from authenticated;
grant select, insert, update, delete on table public.journal_entries to authenticated;
