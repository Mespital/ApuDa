-- ApuDa Health OS core schema
-- Phase 2: profile-centric data model with Row Level Security.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  profile_type text not null default 'human'
    check (profile_type in ('human', 'pet', 'livestock')),
  relationship_to_user text not null default 'self',
  birth_year integer,
  sex_at_birth text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_owner_user_id_idx
  on public.profiles(owner_user_id);

create table if not exists public.conditions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  code text,
  diagnosed_on date,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  condition_id uuid references public.conditions(id) on delete set null,
  treatment_type text not null,
  name text not null,
  cycle_label text,
  started_on date,
  ended_on date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  canonical_code text,
  test_name text not null,
  value_numeric numeric,
  value_text text,
  unit text,
  reference_range text,
  measured_at timestamptz not null,
  source text not null default 'manual',
  confirmed_by_user boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists labs_profile_measured_at_idx
  on public.labs(profile_id, measured_at desc);

create table if not exists public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  symptom_code text,
  symptom_name text not null,
  severity smallint check (severity between 0 and 4),
  count_value integer,
  note text,
  recorded_at timestamptz not null default now(),
  source text not null default 'manual',
  confirmed_by_user boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists symptom_logs_profile_recorded_at_idx
  on public.symptom_logs(profile_id, recorded_at desc);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  appointment_type text not null,
  title text not null,
  hospital_name text,
  department text,
  scheduled_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists appointments_profile_scheduled_at_idx
  on public.appointments(profile_id, scheduled_at);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  version text not null,
  granted boolean not null,
  granted_at timestamptz not null default now()
);

create or replace function public.owns_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_profile_id
      and p.owner_user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.conditions enable row level security;
alter table public.treatments enable row level security;
alter table public.labs enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.consents enable row level security;

create policy "owners can select profiles"
on public.profiles for select
using (owner_user_id = auth.uid());

create policy "owners can insert profiles"
on public.profiles for insert
with check (owner_user_id = auth.uid());

create policy "owners can update profiles"
on public.profiles for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "owners can delete profiles"
on public.profiles for delete
using (owner_user_id = auth.uid());

create policy "owners manage conditions"
on public.conditions for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));

create policy "owners manage treatments"
on public.treatments for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));

create policy "owners manage labs"
on public.labs for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));

create policy "owners manage symptoms"
on public.symptom_logs for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));

create policy "owners manage appointments"
on public.appointments for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));

create policy "owners manage consents"
on public.consents for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));
