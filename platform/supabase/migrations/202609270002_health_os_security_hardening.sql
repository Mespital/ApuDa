-- ApuDa Health OS security/performance hardening
-- Mirrors the migration applied to the connected development database.

revoke all on table public.profiles from anon;
revoke all on table public.conditions from anon;
revoke all on table public.treatments from anon;
revoke all on table public.labs from anon;
revoke all on table public.symptom_logs from anon;
revoke all on table public.appointments from anon;
revoke all on table public.consents from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.conditions to authenticated;
grant select, insert, update, delete on table public.treatments to authenticated;
grant select, insert, update, delete on table public.labs to authenticated;
grant select, insert, update, delete on table public.symptom_logs to authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;
grant select, insert, update, delete on table public.consents to authenticated;

create or replace function public.owns_profile(target_profile_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_profile_id
      and p.owner_user_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_profile(uuid) from public;
revoke all on function public.owns_profile(uuid) from anon;
grant execute on function public.owns_profile(uuid) to authenticated;

drop policy if exists "owners can select profiles" on public.profiles;
drop policy if exists "owners can insert profiles" on public.profiles;
drop policy if exists "owners can update profiles" on public.profiles;
drop policy if exists "owners can delete profiles" on public.profiles;

create policy "owners can select profiles"
on public.profiles for select
using (owner_user_id = (select auth.uid()));

create policy "owners can insert profiles"
on public.profiles for insert
with check (owner_user_id = (select auth.uid()));

create policy "owners can update profiles"
on public.profiles for update
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "owners can delete profiles"
on public.profiles for delete
using (owner_user_id = (select auth.uid()));

create index if not exists conditions_profile_id_idx
  on public.conditions(profile_id);
create index if not exists treatments_profile_id_idx
  on public.treatments(profile_id);
create index if not exists treatments_condition_id_idx
  on public.treatments(condition_id);
create index if not exists consents_profile_id_idx
  on public.consents(profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
