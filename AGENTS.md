# IEP Progress Tracker — agent notes

This is a FERPA-oriented IEP progress app. Do not treat demo data as real student records.

## Local first

Experiment in the working tree. Do not open GitHub issues, create review branches, commit, or open pull requests unless the user asks.

When the user is ready to land work, follow `CONTRIBUTING.md`: issue (what / who / done-when) → branch `{issue-number}-{short-slug}` off `development` → PR into `development` with `Fixes #N`. Never commit to `development` or `main`.

Push to the `github` remote (`vrigzalejo/iep-progress-tracker`), not `origin` (Cursor-hosted). Do not commit `.env.local` or secrets.

## Product constraints

- Do not generate IEP goals, recommend services, or make educational/legal decisions.
- Do not use student data to train models. Keep PII out of logs and error UI.
- Database is Postgres. Credentials come from `POSTGRES_*` or `DATABASE_URL` (Vercel/Supabase/Neon also accept `POSTGRES_URL`). Never commit `.env.local`.
- Keep **one app replica** until evidence uploads use object storage. On Vercel, use private Supabase Storage (or a private Blob store).

## Checks

Run `npm test` for logic changes. For Docker/K8s work, `npm run docker:up` must build and `/api/health` must return `{"ok":true}`. For Vercel, a production deploy must build and `/api/health` must return `{"ok":true}`.
