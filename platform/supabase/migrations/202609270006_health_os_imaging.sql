create table if not exists public.imaging (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  condition_id uuid references public.conditions(id) on delete set null,
  modality text not null,
  body_part text,
  study_date date not null,
  summary text,
  response_category text
    check (response_category is null or response_category in ('CR','PR','SD','PD','NE')),
  source text not null default 'manual',
  confirmed_by_user boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists imaging_profile_study_date_idx
  on public.imaging(profile_id, study_date desc);
create index if not exists imaging_condition_id_idx
  on public.imaging(condition_id);

alter table public.imaging enable row level security;
revoke all on table public.imaging from anon;
grant select, insert, update, delete on table public.imaging to authenticated;

create policy "owners manage imaging"
on public.imaging for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));
