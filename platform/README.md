# ApuDa Platform — My ApuDa Health OS

The new ApuDa Health OS is developed non-destructively under `/platform`.

The repository root still contains the legacy cancer-screening prototype and CSV assets. Those files are intentionally preserved.

Development branch:

`feature/apuda-health-os-v1`

## Product principle

`Record → Understand → Act → Repeat`

Core promise:

> 내 건강의 흐름을 ApuDa가 기억합니다.

## Implemented in V1 development branch

- Next.js App Router + TypeScript
- mobile-first ApuDa design system
- ApuDa ID email/password authentication
- profile onboarding and explicit health-data consent
- self/family profiles and active-profile switching
- My ApuDa dashboard
- conditions and treatment timeline
- manual and photo-assisted lab records
- manual and voice-assisted symptom records
- medications
- appointments
- visit preparation
- context-aware ApuDa AI summary layer
- Supabase RLS and least-privilege grants
- generated Supabase TypeScript types
- authenticated server proxy to the VPS AI input service
- CI for typecheck, Next.js build, parser tests and Docker Compose validation

## AI-assisted input

The browser never receives the VPS AI secret.

```text
Browser
  ↓ authenticated Next.js /api/ai/*
Next.js server
  ↓ server secret + opaque per-user owner token
ApuDa AI API
  ↓ Redis queue
single CPU worker
  ├─ PaddleOCR
  └─ faster-whisper
  ↓
parsed candidate data
  ↓
user confirmation
  ↓
Supabase health record
```

AI-parsed medical data is not saved until the user reviews and confirms it.

## Medical safety boundary

ApuDa may:

- record and organize health information,
- explain terminology,
- surface trends without treatment-effect conclusions,
- prepare questions for a clinician.

ApuDa must not:

- diagnose a disease,
- prescribe treatment,
- instruct medication discontinuation or dose changes,
- conclude treatment response from one lab or image,
- replace professional or emergency care.

## Development / production boundary

The current branch is ready for preview deployment and end-to-end testing.

The following are intentionally not performed automatically:

- replacing the current apuda.app production site,
- changing production DNS,
- merging into an unverified production source,
- exposing real users to the beta without final privacy/compliance review.

See:

- `SUPABASE_SETUP.md`
- `../docs/APUDA_HEALTH_OS_V1_RELEASE.md`
- `../services/ai/README.md`
