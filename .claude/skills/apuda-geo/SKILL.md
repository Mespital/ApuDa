---
name: apuda-geo
description: Review ApuDa medical education pages for answer-first structure, evidence traceability, AI-search citability, and AI crawler access without claiming guaranteed ChatGPT or Perplexity placement. Use for GEO/AEO audits and safe copy proposals.
---

# ApuDa GEO / AEO Citability

Use the question-answer and evidence-traceability approach adapted from the MIT-licensed `zubair-trabzada/geo-seo-claude` `geo-citability` skill. Source revision: `docs/reviews/2026-11-10-seo-geo-marketing-skills.md`.

## Review workflow

1. Start with the existing 30-cancer public FAQ data (`public-site/library/faq/data/*.json`) and corresponding static HTML, not patient notebook data.
2. Choose five representative pages for a spot check: `lung`, `breast`, `ovarian`, `bladder`, and `pcnsl` when these slugs exist. Expand to all 30 only after the sample reveals a repeatable issue.
3. For each sampled answer, check whether its first one or two sentences directly address the question and whether the paragraph is understandable on its own. Avoid imposing a rigid English word-count rule on Korean text.
4. Confirm medical statements have traceable source references and publication/update dates where supported. Flag uncertain, off-label, overseas-only, or out-of-date guidance for editorial review; do not invent citations.
5. Separate three technical concepts: traditional search indexing, AI search retrieval, and model training. Review `robots.txt` for their distinct crawler policies without changing the owner's choice.
6. Evaluate `FAQPage`, `Article`, `BreadcrumbList`, headings, summaries, and citation links only against actual page content. Do not create structured data that makes unpublished or unreviewed medical claims.

## Reporting rubric

Record each result in this shape:

| Field | Meaning |
|---|---|
| URL / source path | Exact public page and source file |
| Answer clarity | Clear / partial / unclear, with example |
| Evidence traceability | Linked primary source / indirect source / missing |
| Medical review status | Actual verified human sign-off / AI precheck / pending / unknown |
| Crawlability | Direct observation or unknown; never infer from a marketing score |
| Proposed revision | Exact suggested wording, preserving the original clinical scope |
| Risk | P0 medical harm, P1 misinformation/access, P2 discoverability/style |

Do not present a self-created 0–100 GEO score as validated prediction of AI citations. If a heuristic score is necessary for internal comparison, label it **experimental editorial rubric**, publish the criteria, and compare matched pages over time. Actual AI citations must be observed and independently logged; rankings cannot be guaranteed.

## ApuDa editorial guardrails

- Medical accuracy outranks clicks, shareability, and short answer length.
- Preserve distinctions among stage, tumor type, biomarkers, treatment indications, and country-specific approval or reimbursement.
- Avoid survival predictions, treatment recommendations for an individual, absolute safety language, fabricated professional reviewer identities, and automatic edits to the 3,000 FAQs.
- Keep the common `참고용 정보·의료진 상의` notice and emergency guidance. Never move private records into indexable pages.
- `llms.txt` is optional exploratory metadata, not a substitute for `robots.txt`, XML sitemaps, accessible HTML, or verified medical sources. Propose it only with clear limitations.
- Do not launch network crawls, modify crawler rules, or publish changes without explicit approval.
