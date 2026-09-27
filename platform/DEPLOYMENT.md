# ApuDa Health OS Deployment

## Recommended deployment model

Deploy the new Next.js app as a preview first. Do not replace the current public `apuda.app` until the preview passes end-to-end testing.

### Project root

Set the hosting project's root directory to:

`platform`

### Required environment variables

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# or legacy fallback:
NEXT_PUBLIC_SUPABASE_ANON_KEY=

AI_API_BASE_URL=
APUDA_AI_API_KEY=
```

Optional:

```bash
SUPABASE_SECRET_KEY=
AI_PROVIDER=mock
OPENAI_API_KEY=
```

Do not expose `APUDA_AI_API_KEY`, `SUPABASE_SECRET_KEY` or `OPENAI_API_KEY` to browser-prefixed variables.

## Supabase Auth URLs

Configure the deployment URL as an allowed redirect URL.

Examples:

```text
https://<preview-host>/auth/callback
https://<future-production-host>/auth/callback
```

The sign-up flow already sends new users to:

`/auth/callback?next=/onboarding`

## Preview smoke test

Complete this flow before any production cutover:

1. Create ApuDa ID.
2. Complete email confirmation if enabled.
3. Create a health profile and health-data consent record.
4. Add a family profile.
5. Switch between profiles.
6. Add a condition.
7. Add a treatment.
8. Add a medication.
9. Add a lab result manually.
10. Add a symptom manually.
11. Add an appointment.
12. Confirm dashboard values update.
13. Open Visit Preparation and verify the 14-day summary.
14. Upload a lab-result photo after the VPS AI service is connected.
15. Confirm OCR results are editable and are not stored until confirmation.
16. Record a short Korean symptom voice note.
17. Confirm STT/parsed symptoms are editable and are not stored until confirmation.
18. Sign out and sign back in.
19. Verify one account cannot access another account's profile rows.
20. Test mobile layout.

## Production cutover gate

Do not point the main `apuda.app` domain at this app until:

- CI is green.
- Preview smoke test passes.
- Supabase database backup/rollback plan is documented.
- Privacy notice and final legal policy are reviewed for the actual operating jurisdiction and data flows.
- Postgres security updates are applied through Supabase when available/approved.
- VPS AI service is reachable only through HTTPS reverse proxy.
- Redis is not publicly exposed.
- App and VPS share the same server-only AI API secret.
- Raw health uploads are deleted after processing.
- No sensitive health data is present in logs.
