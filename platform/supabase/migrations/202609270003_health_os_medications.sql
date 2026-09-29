create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  condition_id uuid references public.conditions(id) on delete set null,
  name text not null,
  dose_text text,
  route text,
  frequency_text text,
  started_on date,
  ended_on date,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists medications_profile_id_idx
  on public.medications(profile_id);
create index if not exists medications_condition_id_idx
  on public.medications(condition_id);

alter table public.medications enable row level security;

revoke all on table public.medications from anon;
grant select, insert, update, delete on table public.medications to authenticated;

create policy "owners manage medications"
on public.medications for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));
