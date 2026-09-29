# ApuDa AI VPS Connection Checklist

This document connects the already-built My ApuDa web app to the CPU AI input service.

## Runtime boundary

- Netlify: `https://my-apuda-beta.netlify.app`
- VPS internal AI API: `127.0.0.1:8000`
- Recommended public AI hostname: `https://ai.apuda.app`
- Redis stays private inside Docker.
- Browser never receives `APUDA_AI_API_KEY`.

## 1. DNS

Create an `A` record:

```text
ai.apuda.app -> <authorized VPS public IPv4>
```

Do not expose Redis.

## 2. Reverse proxy

Use the supplied `services/ai/Caddyfile.example` or `nginx.example.conf`.

The public reverse proxy should forward HTTPS traffic only to:

```text
127.0.0.1:8000
```

The FastAPI container itself should not be directly exposed to the public internet.

## 3. GitHub Actions secrets

The manual workflow `.github/workflows/deploy-ai-vps.yml` expects these repository/environment secrets:

```text
VPS_HOST
VPS_USER
VPS_SSH_KEY
APUDA_AI_API_KEY
```

Use an SSH key dedicated to deployment and a long random ApuDa AI API secret.

The workflow is manual-only. It will not deploy automatically on every push.

## 4. Deploy

GitHub:

```text
Actions
→ Deploy ApuDa AI to VPS
→ Run workflow
→ feature/apuda-health-os-v1
```

The workflow syncs only `services/ai/` to `/srv/apuda-ai`, starts Docker Compose, and checks `127.0.0.1:8000/health`.

## 5. Verify HTTPS

After DNS and reverse proxy are ready:

```bash
curl -fsS https://ai.apuda.app/health
```

Expected: an HTTP 200 JSON health response.

## 6. Netlify server-only variables

Add:

```text
AI_API_BASE_URL=https://ai.apuda.app
APUDA_AI_API_KEY=<same server secret used by VPS>
```

These are server-only. Do not prefix them with `NEXT_PUBLIC_`.

Then redeploy Netlify.

## 7. My ApuDa runtime check

Open:

```text
/my/settings/system
```

Expected:

- account/database: usable
- ApuDa Talk: usable
- photo OCR / voice STT: usable

The page performs a live server-side health check instead of merely checking whether environment variables exist.

## 8. Functional smoke tests

Use synthetic data only:

1. enable AI-assisted input consent on the test profile,
2. upload a synthetic lab image,
3. confirm OCR rows before saving,
4. verify saved labs,
5. record a short Korean synthetic symptom note,
6. confirm parsed symptoms and severity before saving,
7. verify the 14-day symptom summary,
8. verify Visit Preparation includes the records.

Never use real patient information during infrastructure validation.
