# Supabase Setup for My ApuDa

## Current connected development project

The connected Supabase project is the ApuDa development database in Seoul region.

Current Health OS migrations are already applied there. The repository keeps reproducible SQL under:

`platform/supabase/migrations/`

Migration order:

1. `202609270001_health_os_core.sql`
2. `202609270002_health_os_security_hardening.sql`
3. `202609270003_health_os_medications.sql`
4. `202609270004_health_os_least_privilege_grants.sql`

## Environment variables

Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
```

Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when the project exposes a publishable key. The current project may use the legacy anon key, in which case set `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead.

Do not set both unless there is a deliberate migration plan. Never commit actual keys.

`SUPABASE_SECRET_KEY` is server-only and is not required by the current browser CRUD flows.

## Auth

The app currently supports Email/Password authentication.

Required callback pattern:

```text
http://localhost:3000/auth/callback
https://<preview-host>/auth/callback
https://<production-host>/auth/callback
```

Add only real preview/production URLs after those deployments exist.

## Health OS tables

- profiles
- conditions
- treatments
- medications
- labs
- symptom_logs
- appointments
- consents

## Access control

Row Level Security is enabled on health-data tables.

A signed-in user can only access data belonging to a profile owned by their own account. Anonymous table access is revoked.

The authenticated role is intentionally limited to:

- SELECT
- INSERT
- UPDATE
- DELETE

Broad privileges such as TRUNCATE, TRIGGER and REFERENCES are not required by the app and are removed by the least-privilege migration.

## Consent

Profile onboarding records explicit health-data processing consent in `consents`.

Current beta consent version:

`health-data-2026-09-27-v1`

This is a product/engineering consent record, not a substitute for final jurisdiction-specific legal review before public production launch.

## Local smoke test

```text
signup
→ email confirmation if enabled
→ onboarding
→ health-data consent
→ create profile
→ /my
→ add lab
→ add symptom
→ add condition/treatment
→ add medication
→ add appointment
→ visit preparation
→ profile switch
```

Photo OCR and voice STT additionally require the ApuDa AI Input Service.

## Production warning

Do not point the new platform at a production domain or production user population until:

1. preview deployment passes smoke tests,
2. Auth callback URLs are verified,
3. privacy/legal text is finalized for the operating jurisdiction,
4. backup and rollback procedures are documented,
5. the actual apuda.app production source/deployment path is confirmed.
