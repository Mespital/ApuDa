---
name: apuda-seo
description: Audit ApuDa's existing public-site technical SEO, sitemap, indexing, canonical metadata, structured data, and medical-content accessibility. Use for SEO reviews or proposed changes to apuda.app; preserve patient records and existing 30-cancer FAQ coverage.
---

# ApuDa Technical SEO

Use this project-scoped, non-executable workflow adapted from the MIT-licensed `AgriciDaniel/claude-seo` `seo-technical` guidance. The selected upstream source revision and license are recorded in `docs/reviews/2026-11-10-seo-geo-marketing-skills.md`.

## Scope and baseline

1. Inspect `public-site/scripts/build-seo.mjs`, `public-site/scripts/check-seo.mjs`, `public-site/robots.txt`, `public-site/sitemap.xml`, and relevant HTML before proposing any new mechanism.
2. The current generator already creates canonical URLs, FAQ pages, metadata, structured data, and the sitemap. **Do not independently regenerate a competing sitemap, schema system, or page set.** Extend existing code only when the user explicitly requests an implementation.
3. Read current counts from source; historical baseline on 2026-11-10 was 30 FAQ JSON files × 100 questions, 30 first-30-days books, and 85 sitemap URLs. Treat these as regression expectations, not universal SEO requirements.
4. Audit crawlability, indexability, accessible server-rendered text, canonical/redirect relationships, metadata duplication, structured data validity, sitemap/robots consistency, and mobile readability.
5. Keep external medical guideline links as citations, but do not confuse source presence with current medical accuracy or real clinician approval.

## Read-only audit procedure

1. Enumerate the target public URLs and their page templates. Check `robots.txt` directives for Googlebot and AI search crawlers separately from AI training crawlers; do not alter the policy automatically.
2. Check that a canonical points to the correct publicly accessible page and that indexing does not accidentally include the patient notebook, personal account endpoints, `/nonsul/`, private APIs, or prototypes.
3. Assess titles, summaries, breadcrumb and article/FAQ structured data as appropriate; validate schema against search-engine documentation before recommending a change. Rich result eligibility is not guaranteed.
4. Compare content in the raw HTML with what is available only after JavaScript execution. Identify broken source links without scraping user records or authenticated pages.
5. Report only evidence-supported findings: severity `P0/P1/P2`, affected URL and source file, exact failing condition, minimally scoped fix, regression check.

## Safe validation

Run the existing checks from the `public-site` directory when source files and dependencies are present:

```sh
node scripts/check-seo.mjs
node scripts/check-faq-medical-safety.mjs
```

`npm run seo:build` **writes generated public files**. Do not run it in a working tree containing user changes without reviewing its output targets, and never use it as a first step in a read-only audit. If a change is authorized, run generation in a clean development branch, inspect the diff, then run checks.

## Hard boundaries

- No production deployment, DNS/indexing-console changes, GitHub merge, or external posting without the user's explicit request.
- No patient details or account tokens in prompts, reports, external SEO tools, or screenshots.
- No automatic installation or execution of upstream `curl | bash`, npm lifecycle scripts, or third-party agents.
- No unsupported `전문의 감수 완료`, ranking guarantees, unverified clinical benefit, or invented Search Console metrics.
- Keep `public-site/note/`, `/note-v4/`, `/nonsul/`, backup/storage compatibility, and Netlify free-plan settings untouched unless separately authorized.
