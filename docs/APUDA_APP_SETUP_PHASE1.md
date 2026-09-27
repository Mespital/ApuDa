# ApuDa App Setup — Health OS V1 Status

## Repository decision

The connected `Mespital/ApuDa` repository is not treated as a confirmed copy of the current apuda.app production source.

Therefore all Health OS work remains isolated on:

`feature/apuda-health-os-v1`

New web platform:

`/platform`

CPU AI input service:

`/services/ai`

Legacy root assets remain untouched.

## V1 implementation status

Completed in the development branch:

- ApuDa ID / Auth
- health-data consent
- Human + Family Profile
- profile switching
- dashboard
- conditions
- treatment timeline
- lab records
- photo OCR confirmation flow
- symptom records
- Korean voice STT confirmation flow
- medications
- appointments
- visit preparation
- context-aware ApuDa AI summary
- RLS / least-privilege database access
- AI job owner isolation
- CI build/test validation
- VPS Docker deployment assets

## Product flow

```text
Content / Public Tool
        ↓
     ApuDa ID
        ↓
   Health Profile
        ↓
Record → Understand → Act → Repeat
        ↓
   Visit Preparation
        ↓
      Repeat Use
```

## Design direction

Friendly + Smart + Trustworthy.

The product should feel like a consumer health companion rather than an EMR/admin dashboard.

Primary rules:

- mobile first,
- clear Korean labels,
- large touch targets,
- no fear-based medical UI,
- user confirmation before AI-parsed health data is saved,
- no automatic treatment-efficacy conclusions,
- no diagnosis/prescribing/medication-change instructions.

## Remaining external rollout gates

Development V1 is code-complete enough for preview testing, but rollout still requires external infrastructure steps:

1. a preview hosting project that can access this GitHub branch,
2. preview environment variables,
3. Supabase Auth callback URL for that preview,
4. VPS deployment of `services/ai` and HTTPS reachability from the preview host,
5. end-to-end smoke testing with a test account,
6. confirmation of the actual apuda.app production deployment source before any production replacement.

Until those gates are cleared:

- no production DNS change,
- no replacement of the current apuda.app,
- no production-domain cutover,
- no public beta with real health information.
