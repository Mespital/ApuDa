# ApuDa Health OS V1 — Preview Release Checklist

## Release objective

Ship a private preview of My ApuDa that validates the full loop:

`Record → Understand → Act → Repeat`

without changing the existing apuda.app production service.

## 1. Web preview

Recommended project root:

`platform`

Required web environment variables:

```bash
NEXT_PUBLIC_APP_URL=https://<preview-host>
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_PROVIDER=mock
AI_API_BASE_URL=https://<ai-host>
APUDA_AI_API_KEY=<server-only shared secret>
```

Use either the publishable key or the legacy anon key according to the Supabase project.

Never expose `APUDA_AI_API_KEY` as a `NEXT_PUBLIC_*` variable.

## 2. Supabase Auth

Add:

`https://<preview-host>/auth/callback`

to allowed redirect URLs.

Test:

```text
signup
→ confirmation
→ callback
→ onboarding
→ consent
→ profile
→ My ApuDa
```

## 3. VPS AI service

On the VPS, deploy from:

`services/ai`

Initial operating profile:

- one Redis service,
- one FastAPI API,
- one RQ worker,
- worker concurrency 1,
- Whisper small/int8,
- CPU threads 2,
- PaddleOCR Korean,
- API bound locally and exposed only through HTTPS reverse proxy when required.

Use:

```bash
cp .env.example .env
# set a long random APUDA_AI_API_KEY
./deploy-vps.sh
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Expected:

`status=ok` and Redis queue healthy.

## 4. End-to-end smoke test

Use a test account with synthetic data only.

Test sequence:

1. create own profile,
2. create family profile,
3. switch profiles and verify isolation,
4. add condition,
5. add treatment,
6. add manual lab,
7. upload sample lab image → OCR → edit → confirm → save,
8. add manual symptom,
9. record Korean voice symptom → STT → edit → confirm → save,
10. add medication,
11. add appointment,
12. open Visit Preparation,
13. open ApuDa AI summary,
14. logout/login,
15. verify records persist,
16. verify another account cannot access the first account's profile/data.

## 5. Security checks

- anonymous health-table access denied,
- RLS enabled,
- authenticated grants limited to SELECT/INSERT/UPDATE/DELETE,
- AI secret not present in browser source,
- cross-user AI job polling returns not found,
- raw photo/audio removed after processing,
- no raw health information in application logs.

## 6. Performance baseline

Before increasing worker concurrency, record:

- OCR processing time,
- STT time for 5/15/30 second clips,
- peak CPU,
- peak RAM,
- queue wait time.

On the current 2-vCPU VPS, keep one worker until measurements justify a change.

## 7. Production gate

Do not replace current apuda.app until all are true:

- private preview smoke test passes,
- actual production source/deployment is identified,
- final privacy/terms/compliance review is completed,
- backup/rollback plan exists,
- monitoring/error reporting exists,
- production domain and DNS cutover are explicitly approved.

## Definition of Done for V1 preview

- GitHub CI green
- Supabase schema/RLS applied
- authentication works
- profile/family switching works
- manual health records work
- OCR/STT confirmation flows work
- Visit Preparation works
- ApuDa AI context summary works
- preview URL available
- VPS AI service healthy and reachable
- smoke test passed with synthetic data
