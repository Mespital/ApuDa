# ApuDa Platform

This directory is the non-destructive scaffold for the next-generation **My ApuDa / Health OS**.

## Why this folder exists

The repository root contains the legacy cancer-screening prototype and CSV assets. Those files are intentionally left untouched.

The new platform work starts here on:

`feature/apuda-health-os-v1`

## Current Phase

Phase 1: foundation only.

- Next.js App Router + TypeScript
- Mobile-first ApuDa design foundation
- No production deployment
- No production database changes
- No legacy deletion
- No medical diagnosis logic

## Product principle

`Record → Understand → Act → Repeat`

## Next implementation order

1. Confirm/attach the actual production source if it exists outside this repository.
2. Add authentication and profile model.
3. Add Supabase schema + RLS.
4. Add treatment timeline.
5. Add labs and symptom logging.
6. Add photo/voice input.
7. Add visit preparation.
8. Add ApuDa Talk context.
9. Add analytics and content attribution.
