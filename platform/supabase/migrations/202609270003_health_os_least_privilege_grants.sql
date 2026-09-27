-- Least-privilege grants for ApuDa Health OS.
-- Removes Supabase default broad authenticated grants such as TRUNCATE/TRIGGER/REFERENCES
-- and keeps only row-level DML required by the app.

revoke all privileges on table public.profiles from authenticated;
revoke all privileges on table public.conditions from authenticated;
revoke all privileges on table public.treatments from authenticated;
revoke all privileges on table public.labs from authenticated;
revoke all privileges on table public.symptom_logs from authenticated;
revoke all privileges on table public.appointments from authenticated;
revoke all privileges on table public.consents from authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.conditions to authenticated;
grant select, insert, update, delete on table public.treatments to authenticated;
grant select, insert, update, delete on table public.labs to authenticated;
grant select, insert, update, delete on table public.symptom_logs to authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;
grant select, insert, update, delete on table public.consents to authenticated;
