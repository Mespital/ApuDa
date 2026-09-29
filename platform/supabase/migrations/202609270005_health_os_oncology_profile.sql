alter table public.conditions
  add column if not exists stage text,
  add column if not exists histology text,
  add column if not exists hospital_name text,
  add column if not exists department text;

create table if not exists public.biomarkers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  condition_id uuid references public.conditions(id) on delete set null,
  canonical_code text,
  name text not null,
  result_text text,
  result_numeric numeric,
  unit text,
  tested_on date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists biomarkers_profile_tested_idx
  on public.biomarkers(profile_id, tested_on desc);
create index if not exists biomarkers_condition_id_idx
  on public.biomarkers(condition_id);

alter table public.biomarkers enable row level security;
revoke all on table public.biomarkers from anon;
grant select, insert, update, delete on table public.biomarkers to authenticated;

create policy "owners manage biomarkers"
on public.biomarkers for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));
