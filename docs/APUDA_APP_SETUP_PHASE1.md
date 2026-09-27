# ApuDa App Setup — Phase 1

## Current live-service audit

The live ApuDa service already presents itself as **PATIENT CARE OS** and connects the Human, Care, Pet and Farm lines.

Observed current behavior:

- Main ApuDa site exists.
- ApuDa.care exists.
- ApuDa.pet exists.
- ApuDa.farm exists.
- Current public pages emphasize no-login usage.
- Care/Pet currently rely heavily on device-local flows.
- Farm is currently focused on livestock-disease information and reporting support.

The connected GitHub account currently exposes only `Mespital/ApuDa`, and that repository is the legacy cancer-screening prototype rather than a confirmed copy of the current production site.

Therefore Phase 1 must be non-destructive.

## Decision

Create a new platform scaffold inside the existing repository on a feature branch while leaving all legacy files untouched.

Branch:

`feature/apuda-health-os-v1`

Directory:

`/platform`

## Strategic target

ApuDa should evolve from a collection of useful public tools into a profile-based continuity layer:

```text
Content / Public Tool
        ↓
     ApuDa ID
        ↓
      Profile
        ↓
Record → Understand → Act → Repeat
        ↓
   Visit Preparation
        ↓
      Repeat Use
```

## Phase 2

Do not begin production migration until one of the following is available:

1. the actual production source repository,
2. a current production source archive,
3. or explicit confirmation that the new `/platform` app should become the replacement production source.

Until then:

- no DNS changes,
- no production deploy,
- no production DB migration,
- no deletion of existing Human/Care/Pet/Farm pages.

## First product modules

1. ApuDa ID / Auth
2. Human Profile
3. Family Profile switching
4. Treatment Timeline
5. Lab Records + Trend
6. Symptom Records
7. Appointments
8. Photo / Voice record input
9. Visit Preparation
10. ApuDa Talk context

## Design direction

Friendly + Smart + Trustworthy.

The app should feel like a consumer health companion, not an EMR/admin dashboard.

Primary principles:

- mobile first,
- 44px+ touch targets,
- 15–16px+ body text,
- plain Korean labels,
- minimal jargon,
- no fear-based medical UI,
- no automatic treatment-efficacy conclusions,
- no diagnosis or medication-change instructions.

## Safety

ApuDa organizes and explains user-provided records and prepares users for professional care. It does not replace diagnosis, prescribing or emergency care.
