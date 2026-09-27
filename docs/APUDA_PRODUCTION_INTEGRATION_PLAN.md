# ApuDa Production Integration Plan

## Why this needs a staged cutover

The current public `apuda.app` already acts as a trusted no-login gateway for:

- diagnosis-stage guidance,
- cancer screening tools,
- the first-30-days guides,
- treatment companion tools,
- support information,
- Naver Café and blog content.

The new My ApuDa Health OS introduces authentication and persistent health records. It should therefore be introduced without removing the current zero-login public experience.

## Recommended rollout

### Stage 1 — Private preview

Deploy the new `/platform` app to a private preview host.

Do not change:

- `apuda.app`
- existing Netlify tools
- current cancer guide links
- public PET/FARM/CARE routes
- DNS

Validate signup, profiles, record flows, Visit Preparation, security and mobile UX with synthetic data.

### Stage 2 — My ApuDa beta

Preferred interim product boundary:

`my.apuda.app`

Rationale:

- preserves current public homepage,
- isolates authenticated health-record sessions,
- makes rollback simple,
- allows independent release cadence,
- avoids rewriting the current public site before PMF is proven.

A prominent public-site CTA can later point to:

`My ApuDa → my.apuda.app`

Alternative: if the actual production source is recovered and supports the same Next.js stack safely, mount the Health OS under `apuda.app/my`.

Do not decide between subdomain and route until the current production repository/deployment source is identified.

### Stage 3 — Unified navigation

After beta validation, use one ApuDa navigation model:

```text
ApuDa
├── 정보 / 가이드
├── 도구
├── My ApuDa
│   ├── 오늘
│   ├── 기록
│   ├── 치료 여정
│   ├── 진료 준비
│   └── ApuDa Talk
├── Care
├── PET
└── FARM
```

Public educational content stays usable without login. Login is requested only for persistent personal/family health management.

## Migration rule

Never require a health-data account just to read educational content or use a public informational guide unless a specific feature genuinely requires persistence.

This preserves ApuDa's current low-friction acquisition funnel:

`Content → Public ApuDa → useful tool → trust → optional My ApuDa account`

## Existing-tool migration

Existing tools should not be deleted at first.

Map each tool to a future Health OS action:

| Existing public function | Future authenticated continuation |
| --- | --- |
| screening/check tools | save relevant results or next-step notes |
| first-30-days guides | save questions / care checklist |
| treatment companion | treatment timeline / appointments |
| support information | saved resources / care plan |
| cancer educational pages | context-aware related content |
| community | optional external community link |

The Health OS should absorb persistent record functions gradually while public tools remain available during transition.

## Production cutover criteria

Move authenticated Health OS functionality onto the primary domain only after:

1. private beta retention is measured,
2. user-data security tests pass,
3. actual production source and ownership are known,
4. privacy/terms are legally reviewed,
5. deployment rollback is tested,
6. existing public-tool links are regression-tested,
7. analytics show that login does not damage the content acquisition funnel.

## Recommended first public CTA

Use a low-pressure opt-in:

> **내 건강 흐름을 기록하고 싶다면 — My ApuDa**

Do not force signup before users understand the value.
