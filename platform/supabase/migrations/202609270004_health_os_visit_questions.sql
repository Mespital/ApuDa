create table if not exists public.visit_questions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  status text not null default 'open'
    check (status in ('open','answered','archived')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create index if not exists visit_questions_profile_status_created_idx
  on public.visit_questions(profile_id, status, created_at desc);

alter table public.visit_questions enable row level security;
revoke all on table public.visit_questions from anon;
grant select, insert, update, delete on table public.visit_questions to authenticated;

create policy "owners manage visit questions"
on public.visit_questions for all
using (public.owns_profile(profile_id))
with check (public.owns_profile(profile_id));
