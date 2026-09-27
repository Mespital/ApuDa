# Supabase Setup for My ApuDa

## Goal

Enable ApuDa ID, profile storage and Row Level Security for the development branch.

## Required environment variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never commit real keys.

## Development setup order

1. Create or connect a Supabase development project.
2. Run:
   `supabase/migrations/202609270001_health_os_core.sql`
3. Enable Email/Password authentication.
4. Configure local redirect URL:
   `http://localhost:3000/auth/callback`
5. Add the preview deployment callback URL when a preview host exists.
6. Put the public URL and anon key in `.env.local`.
7. Run the app and test:
   signup → login → onboarding → /my.

## RLS

The migration enables Row Level Security on:

- profiles
- conditions
- treatments
- labs
- symptom_logs
- appointments
- consents

A signed-in user can only manage rows attached to profiles they own.

## Production warning

Do not apply the development migration to a production database until schema review, backup, consent/privacy review and a rollback plan are complete.
