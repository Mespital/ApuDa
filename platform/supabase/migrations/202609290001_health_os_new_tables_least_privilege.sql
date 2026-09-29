-- Restore least-privilege grants for Health OS tables added after the core grant hardening.
-- Supabase/Postgres default table privileges can include TRUNCATE, REFERENCES and TRIGGER.
-- The web app only requires row-level SELECT/INSERT/UPDATE/DELETE, protected by RLS.

revoke all privileges on table public.biomarkers from authenticated;
revoke all privileges on table public.imaging from authenticated;
revoke all privileges on table public.visit_questions from authenticated;

revoke all privileges on table public.biomarkers from anon;
revoke all privileges on table public.imaging from anon;
revoke all privileges on table public.visit_questions from anon;

grant select, insert, update, delete on table public.biomarkers to authenticated;
grant select, insert, update, delete on table public.imaging to authenticated;
grant select, insert, update, delete on table public.visit_questions to authenticated;
