# ApuDa Health OS V1 — Preview Release Status

## Objective

Validate the ApuDa core loop without replacing the current public service:

`Record → Understand → Act → Repeat`

Current implementation lives on:

- Git branch: `feature/apuda-health-os-v1`
- Web app: `/platform`
- VPS AI service: `/services/ai`
- Supabase project: ApuDa's Project (development use during this build)

The legacy cancer-screening assets at the repository root remain untouched.

---

## 1. Implemented web product

### ApuDa ID / profile

- Email/password sign-up and login
- Email confirmation callback
- Self/family human profiles
- Active-profile switching
- Profile-scoped Row Level Security
- Health-data consent at onboarding
- Separate optional consent for local OCR/STT AI input
- Separate optional consent for external generative AI
- Consent withdrawal history
- Logout
- Profile data export
- Profile + linked health-record deletion

### Health OS

- My ApuDa dashboard
- Appointment D-day
- Conditions
- Cancer stage / histology / treatment institution / department
- Treatments and treatment cycle
- Medications
- Labs
- Neutral lab trends
- Symptoms with patient-friendly 0–4 severity
- Appointments
- Biomarkers
- Treatment timeline
- Quick record menu

### Visit Preparation

- Recent 14-day symptom summary
- Recent labs
- Treatments
- Active medications
- Biomarkers
- Next appointment
- Deterministic suggested questions
- User-saved questions
- One-page Visit Summary
- Browser Print / PDF-save view

### ApuDa Talk

Two operating modes:

1. `AI_PROVIDER=mock`
   - no external generative-AI transfer,
   - safe deterministic summary based on stored context.

2. `AI_PROVIDER=openai`
   - only activates when API key + model are explicitly configured,
   - requires separate latest `external_ai_processing` consent,
   - sends minimized context only,
   - excludes display name, birth year, original photo and original audio,
   - does not persist Talk messages.

Safety instructions prohibit diagnosis, prescribing, medication stop/dose-change instructions and automatic treatment-efficacy conclusions.

---

## 2. Supabase schema applied

Current Health OS tables:

- `profiles`
- `conditions`
- `treatments`
- `medications`
- `labs`
- `symptom_logs`
- `appointments`
- `biomarkers`
- `consents`
- `visit_questions`

Implemented:

- RLS enabled
- anonymous table access revoked
- owner-scoped policies
- profile-centric indexes
- profile `updated_at` trigger
- generated TypeScript database types

### Security advisor notes

The current advisor still reports:

1. authenticated tables are discoverable in the GraphQL schema because authenticated users have SELECT permission;
   actual row access remains restricted by RLS.
2. the current managed Postgres version has security patches available.

Do not perform a database engine upgrade as part of this feature branch without a maintenance/rollback decision.

Unused-index notices are expected on a new database without production query history.

---

## 3. AI Input service

Architecture:

```text
Next.js authenticated user
        ↓
server-only ApuDa AI proxy
        ↓
per-user HMAC owner token
        ↓
HTTPS
        ↓
FastAPI
        ↓
Redis / RQ
        ↓
one CPU worker
   ┌────┴────┐
 PaddleOCR  faster-whisper
   ↓            ↓
Lab parser   Symptom parser
   └────┬────┘
    user review
        ↓
     Supabase
```

Implemented:

- FastAPI
- Redis + RQ
- one worker
- PaddleOCR Korean
- faster-whisper small/int8
- short-lived job results
- max upload size
- per-user job ownership token
- temporary upload deletion
- no raw health-data application logging by design
- Docker Compose
- VPS deploy script
- Caddy and Nginx reverse-proxy examples
- parser unit tests
- Docker Compose validation CI

### Medical Dictionary seed

Common lab aliases now normalize to canonical IDs, including examples such as:

- Hb / HGB / Hemoglobin / 혈색소 → `LAB_HEMOGLOBIN`
- CEA → `LAB_CEA`
- CA19-9 → `LAB_CA19_9`
- AST / GOT → `LAB_AST`
- ALT / GPT → `LAB_ALT`
- Creatinine → `LAB_CREATININE`
- HbA1c → `LAB_HBA1C`

Both OCR and manual lab entry can converge on canonical codes.

---

## 4. CI validation

GitHub Actions currently checks:

### Platform

- dependency installation
- TypeScript typecheck
- Next.js production build

### AI service

- Python syntax
- parser unit tests
- Docker Compose validation

Keep the PR unmerged if either CI workflow is red.

---

## 5. Remaining external connections before a real private preview

These require access outside the repository/database connector.

### A. Web preview host

The hosting project must point its root directory to:

`platform`

Required environment variables:

```bash
NEXT_PUBLIC_APP_URL=https://<preview-host>

NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>

AI_PROVIDER=mock
# Optional external ApuDa Talk:
# AI_PROVIDER=openai
# OPENAI_API_KEY=<server-only>
# OPENAI_MODEL=<explicit-model>

AI_API_BASE_URL=https://<ai-host>
APUDA_AI_API_KEY=<server-only shared secret>
```

Never expose `APUDA_AI_API_KEY`, `OPENAI_API_KEY` or a Supabase secret/service key as `NEXT_PUBLIC_*`.

### B. Supabase Auth URL

Add:

`https://<preview-host>/auth/callback`

to the project's allowed authentication redirect URLs.

### C. VPS terminal access

Deploy `services/ai` on the authorized VPS:

```bash
cp .env.example .env
# replace APUDA_AI_API_KEY with a long random secret
./deploy-vps.sh
```

Then place Caddy/Nginx in front of the localhost FastAPI endpoint and expose only HTTPS.

---

## 6. Required synthetic-data smoke test

Use synthetic test information only.

1. Sign up.
2. Confirm email if enabled.
3. Create own profile and required consent.
4. Create family profile.
5. Switch between profiles.
6. Add a condition including stage/histology where relevant.
7. Add treatment and cycle.
8. Add medication.
9. Add biomarker.
10. Add manual lab result.
11. Add repeated lab result and verify neutral trend.
12. Add manual symptom.
13. Add appointment and verify D-day.
14. Open Visit Preparation.
15. Add a custom clinician question.
16. Open Visit Summary and print/PDF preview.
17. Export profile JSON.
18. Use mock ApuDa Talk.
19. If VPS connected: photo → OCR → user edit/confirm → save.
20. If VPS connected: voice → STT/parser → user edit/confirm → save.
21. If external Talk provider is configured: verify it is blocked before consent and works after separate consent.
22. Sign out/in and verify persistence.
23. Verify profile switching does not mix records.
24. Verify another account cannot access the first account's rows.

---

## 7. Production cutover gate

Do **not** replace current `apuda.app` until all are true:

- private preview URL exists,
- full synthetic-data smoke test passes,
- actual current production source/deployment path is identified,
- VPS OCR/STT is benchmarked on the real 2-vCPU server,
- privacy/terms/compliance text is reviewed for actual operating data flows,
- backup and rollback plan exists,
- security-patch maintenance decision is made,
- monitoring/error reporting is configured,
- current Human / Care / Pet / Farm public functions have a migration/compatibility plan,
- production domain/DNS cutover is explicitly approved.

---

## Current Definition of Done

### Completed in code/database

- Health OS schema + RLS
- ApuDa ID code
- self/family profiles
- conditions/treatments/medications/labs/symptoms/appointments/biomarkers
- lab trends
- Visit Preparation
- Visit Summary
- user questions
- profile data export/delete
- consent controls
- OCR/STT confirmation UX
- VPS AI service implementation
- ApuDa Talk mock + optional external provider architecture
- CI

### Still blocked on external runtime access

- preview deployment URL
- hosting environment variables
- Supabase Auth preview redirect registration
- actual VPS deployment
- real OCR/STT benchmark
- browser E2E smoke test

Those external-runtime items must be completed before production merge/cutover.
