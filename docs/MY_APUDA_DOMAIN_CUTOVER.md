# My ApuDa Domain Cutover

Target architecture:

- Public information hub: `https://apuda.app`
- Personal health app: `https://my.apuda.app`
- AI input API: `https://ai.apuda.app`

The public root domain remains the acquisition/content hub. The authenticated Health OS moves from the temporary Netlify beta hostname to `my.apuda.app`.

## Netlify

Add `my.apuda.app` as the custom domain for the existing `my-apuda-beta` site.

After Netlify verifies DNS and provisions TLS, set:

```text
NEXT_PUBLIC_APP_URL=https://my.apuda.app
```

Keep:

```text
AI_API_BASE_URL=https://ai.apuda.app
APUDA_AI_API_KEY=<server-only secret>
```

Then redeploy.

## DNS

For the subdomain, use the target Netlify shows for the custom domain. For a standard Netlify subdomain setup this is typically:

```text
CNAME  my  my-apuda-beta.netlify.app.
```

Do not change the current `@` or `www` records for `apuda.app`.

## Supabase Auth

When the custom domain is live:

- Site URL: `https://my.apuda.app`
- Redirect URL: `https://my.apuda.app/auth/callback`

Keep the beta callback temporarily during validation, then remove it after cutover is stable.

## Public apuda.app integration

Add a persistent header action:

```text
로그인 → https://my.apuda.app/login
```

Recommended secondary CTA:

```text
My ApuDa → https://my.apuda.app/my
```

The public site should remain usable without sign-in. Sign-in is only required for personal records, profile management, OCR/STT, Visit Preparation and ApuDa Talk context.

## Cutover validation

1. Open `https://my.apuda.app`.
2. Verify TLS.
3. Sign in.
4. Verify email callback returns to `my.apuda.app`.
5. Verify `/my/settings/system` reports OCR/STT available.
6. Test a synthetic lab image and synthetic symptom voice note.
7. Verify the public `apuda.app` login button opens My ApuDa.
8. Only after these pass, stop promoting the temporary Netlify hostname.
