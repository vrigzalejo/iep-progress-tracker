# IEP Progress Tracker — agent notes

This is a FERPA-oriented IEP progress app. Do not treat demo data as real student records.

## GitHub workflow (required)

Work starts as a **GitHub issue**, then a branch off `development`, then a pull request **into `development`**. `main` is production.

1. Open an issue (what / who / done-when). Use `Fixes #N` in the PR body.
2. Branch `{issue-number}-{short-slug}` from `development`. Never commit to `development` or `main`.
3. Open the PR against `development`, squash merge. Do not delete `development`.
4. Release: issue labeled `release`, then a PR from `development` into `main`.

Details: `CONTRIBUTING.md`. Push the GitHub remote named `github` (`vrigzalejo/iep-progress-tracker`), not `origin` (Cursor-hosted).

## Product constraints

- Do not generate IEP goals, recommend services, or make educational/legal decisions.
- Do not use student data to train models. Keep PII out of logs and error UI.
- Database is Postgres. Credentials come from `POSTGRES_*` (or `DATABASE_URL`). Never commit `.env.local`.
- Keep **one app replica** until evidence uploads use object storage.

## Checks

Run `npm test` for logic changes. For Docker/K8s work, `npm run docker:up` must build and `/api/health` must return `{"ok":true}`.
