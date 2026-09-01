# IEP Progress Tracker

IEP Progress Tracker is a web application for special education (SPED) teams to track IEP goals and student progress. It is built for educators, related-service providers, school administrators, and parents, with least-privilege access and a parent-friendly reporting flow.

This repository ships a polished MVP that runs on **fictional demonstration data**. Do not enter real student records in demo mode.

IEP Progress Tracker is designed around FERPA-aligned practices (data minimization, role-based access, audit logs, encryption in transit via HTTPS, and configurable retention). **It is not a legal compliance certification.** Have a qualified privacy review before production use with real students.

## What you can do

- Sign in as Administrator, Educator, Provider, or Parent / Guardian
- Maintain student profiles with only necessary fields, IEP review dates, and present levels
- Create IEP goals with official wording, a plain-language summary, short-term objectives, and a mastery rule (consecutive sessions and allowed prompts)
- Log sessions in the moment: tap independent / prompted / incorrect trials, or mark absent, declined, or makeup
- Record service minutes, setting, accommodations, and optional home carryover
- View trend charts and “on track / needs attention / goal met” indicators that follow the written mastery rule and describe **data**, not IEP decisions
- Write period progress codes and narratives, then print a parent-friendly report or an IEP meeting packet
- Use an educator dashboard for reporting dates, IEP reviews, uncovered service minutes, and stale data
- Keep family threads separate from staff-only notes; parents can switch among linked students
- Search, filter, export CSV, and review audit history (authorized staff)
- Ask the in-app how-to assistant how a screen works (it does not generate IEP content or read student records)
- Configure retention, acknowledge consent, and delete records with confirmation

The product does **not** generate IEP goals, recommend services, or make educational, legal, or clinical decisions. Student data is **not** used to train AI models.

## Stack

- Next.js (App Router) and TypeScript
- Tailwind CSS and accessible UI primitives
- Auth.js credentials authentication with hashed passwords, plus optional Microsoft, Google, or OIDC SSO
- Prisma ORM with Postgres (local Docker, or hosted Supabase / Neon)
- Zod validation, server-side authorization, Vitest

## Local setup

Requirements: Node.js 22+, npm, and Docker (or another Postgres 16 instance). The app no longer uses SQLite.

```bash
git clone <this-repo>
cd iep-progress-tracker
cp .env.example .env.local
# set AUTH_SECRET to a long random string
# optional: change POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
npm run docker:db
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev -- --port 43147 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

### Rename the product

Set these in `.env.local`, then restart the dev server. The UI, page titles, demo emails, and export filename all follow this config.

```bash
NEXT_PUBLIC_APP_NAME="IEP Progress Tracker"
NEXT_PUBLIC_APP_SLUG="iep-progress-tracker"
```

Leave `NEXT_PUBLIC_APP_SLUG` unset to derive a hyphenated slug from the name. Optional: `NEXT_PUBLIC_DEMO_EMAIL_DOMAIN` and `NEXT_PUBLIC_DEMO_PASSPHRASE`.

### Demo accounts

All demonstration accounts share the passphrase `Iep-progress-tracker!Demo26`.

Addresses follow `NEXT_PUBLIC_APP_SLUG`. With the default slug they are:

| Role | Name | Email |
| --- | --- | --- |
| Administrator | Crisanto Reyes | crisanto.reyes@demo.iep-progress-tracker.school |
| Educator | Maricel Santos | maricel.santos@demo.iep-progress-tracker.school |
| Provider | Patricia Cruz | patricia.cruz@demo.iep-progress-tracker.school |
| Parent / guardian | Diana Santos | diana.santos@demo.iep-progress-tracker.school |

All students (Jaime Santos, Carla Santos, Samuel Villanueva, Andrea Tan, Rafael Bautista) are fictional. Diana Santos is linked to both Jaime and Carla so the family portal can switch children.

### School SSO

SSO is opt-in and disabled until you set provider credentials. Demo password accounts keep working.

1. Add staff (and parents) in **Team and permissions** with the same email their identity provider uses. Leave the password blank once SSO is configured.
2. Register the callback URL `{AUTH_URL}/api/auth/callback/{provider}` with the identity provider:
   - Microsoft Entra ID: `/api/auth/callback/microsoft-entra-id`
   - Google: `/api/auth/callback/google`
   - Generic OIDC (Okta, ClassLink, Auth0, and similar): `/api/auth/callback/oidc`
3. Set the matching `AUTH_*` variables below. Use your **tenant** issuer for Microsoft (`https://login.microsoftonline.com/{tenant-id}/v2.0`), not `common`.
4. Restrict sign-in with `AUTH_SSO_ALLOWED_DOMAINS=district.edu`.
5. In production, set `AUTH_CREDENTIALS_ENABLED=false` after SSO works so password login is off.

Unknown emails are rejected unless you explicitly enable JIT provisioning (`AUTH_SSO_JIT_PROVISION=true`). JIT creates staff with `AUTH_SSO_JIT_ROLE` (default `EDUCATOR`) in the first organization. Do not use JIT for parents; link guardian emails first.

Roles stay in this app. The identity provider only proves who the person is.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `POSTGRES_USER` | No | Database user. Default: `iep` |
| `POSTGRES_PASSWORD` | No | Database password. Default: `iep` (change this) |
| `POSTGRES_DB` | No | Database name. Default: `iep`. Vercel also sets `POSTGRES_DATABASE` |
| `POSTGRES_HOST` | No | Hostname. Default: `127.0.0.1` (Compose app uses `db`) |
| `POSTGRES_PORT` | No | Port. Default: `5432` |
| `DATABASE_URL` | No | Full Postgres URL. When set, it overrides the `POSTGRES_*` variables. Use this for RDS, Cloud SQL, Azure Database, Neon, or the Supabase pooler |
| `POSTGRES_URL` | No | Vercel/Neon/Supabase pooled URL. Used when `DATABASE_URL` is unset |
| `POSTGRES_PRISMA_URL` | No | Vercel pooled URL (`pgbouncer=true`). Preferred over `POSTGRES_URL` at runtime |
| `POSTGRES_URL_NON_POOLING` / `DIRECT_URL` | No | Direct Postgres URL for `prisma migrate deploy` (required for the Supabase pooler) |
| `SUPABASE_URL` | Supabase | Project URL (`https://PROJECT.supabase.co`). `NEXT_PUBLIC_SUPABASE_URL` is also accepted |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server-only key for private evidence Storage. Never expose as `NEXT_PUBLIC_*` |
| `SUPABASE_EVIDENCE_BUCKET` | No | Private Storage bucket for evidence. Default: `iep-evidence` |
| `BLOB_READ_WRITE_TOKEN` | Vercel | Private Blob store token if you are not using Supabase Storage |
| `AUTH_SECRET` | Yes | Auth.js session signing secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Production | Public origin, for example `https://iep-progress-tracker.example.edu` |
| `NEXT_PUBLIC_DEMO_MODE` | No | Keep `true` until you remove seed data |
| `NEXT_PUBLIC_APP_NAME` | No | Product name shown in the UI. Default: `IEP Progress Tracker` |
| `NEXT_PUBLIC_APP_SLUG` | No | URL-safe id for demo emails and export files. Derived from the name if omitted |
| `NEXT_PUBLIC_DEMO_EMAIL_DOMAIN` | No | Domain for demo accounts. Default: `demo.{slug}.school` |
| `NEXT_PUBLIC_DEMO_PASSPHRASE` | No | Shared demo sign-in passphrase |
| `SENTRY_DSN` | No | Optional error monitoring. Do not send student payloads |
| `HF_TOKEN` | No | Optional Hugging Face token for the how-to chatbot (`HUGGINGFACE_HUB_TOKEN` also works). Monthly free credits on Inference Providers. Unset = in-app guide answers only. Never send student records |
| `HF_CHAT_MODEL` | No | Chat model id. Default: `Qwen/Qwen2.5-3B-Instruct:cheapest` |
| `HF_CHAT_BASE_URL` | No | OpenAI-compatible HF router. Default: `https://router.huggingface.co/v1` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | SSO | Entra ID application (client) ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | SSO | Entra ID client secret |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | SSO | `https://login.microsoftonline.com/{tenant-id}/v2.0` |
| `AUTH_GOOGLE_ID` | SSO | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | SSO | Google OAuth client secret |
| `AUTH_GOOGLE_HOSTED_DOMAIN` | No | Optional Google Workspace domain (`hd`) |
| `AUTH_OIDC_ISSUER` | SSO | OIDC issuer URL for Okta, ClassLink, Auth0, and similar |
| `AUTH_OIDC_ID` | SSO | OIDC client ID |
| `AUTH_OIDC_SECRET` | SSO | OIDC client secret |
| `AUTH_OIDC_NAME` | No | Button label, for example `ClassLink` |
| `AUTH_SSO_ALLOWED_DOMAINS` | No | Comma-separated email domains allowed to use SSO |
| `AUTH_SSO_JIT_PROVISION` | No | `true` to create unknown users on first SSO sign-in. Default: off |
| `AUTH_SSO_JIT_ROLE` | No | Role for JIT users. Default: `EDUCATOR` |
| `AUTH_SSO_ORGANIZATION_ID` | No | Organization to attach JIT users to. Defaults to the first org |
| `AUTH_CREDENTIALS_ENABLED` | No | Set `false` in production after SSO is live |

`.env*` files are gitignored except `.env.example`.

## Tests

```bash
npm test
npm run lint
npm run build
```

Automated tests cover authorization rules, progress-signal calculation, and input validation. Pull requests to `development` and `main` run these checks and a Docker image build. Merges to `main` publish `ghcr.io/vrigzalejo/iep-progress-tracker`.

## Deployment

1. Provision Postgres on encrypted disks (or use the in-cluster StatefulSet for a small deploy).
2. Set `POSTGRES_*` (or `DATABASE_URL`), `AUTH_SECRET`, `AUTH_URL`, and SSO provider variables.
3. Run `npx prisma migrate deploy` (the container does this on start) and **do not** seed demo students.
4. Serve the app only over HTTPS (Vercel, Fly.io, or a reverse proxy).
5. Store evidence uploads on encrypted object storage, not a public bucket. On Vercel, use **Supabase Storage** (private bucket) or a private Blob store.
6. Optional: add `@sentry/nextjs` using `SENTRY_DSN`, with PII scrubbing enabled.

`Dockerfile` is included for container deploys.

### Vercel and Supabase

The hosted setup this repo is aimed at: **Next.js on Vercel**, **Postgres and private evidence files on Supabase**. Create the Supabase project in a **US region**. School SSO stays in this app (Auth.js); do not turn on Supabase Auth for staff or parents.

Connect the GitHub repo (`vrigzalejo/iep-progress-tracker`) in Vercel. Set the **production branch to `main`**. Preview deploys should use a separate Supabase project or branch so `prisma migrate deploy` during build does not change production.

1. In Supabase, copy the **transaction pooler** URI into `DATABASE_URL` (port `6543`, add `pgbouncer=true`) and the **direct / session** URI into `DIRECT_URL` (port `5432`).
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Keep the service role key on the server only. The app creates a private `iep-evidence` bucket on first upload if it is missing.
3. In Vercel, set:
   - `AUTH_SECRET` (long random string)
   - `AUTH_URL` (the deployment origin, for example `https://your-project.vercel.app`)
   - `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_DEMO_MODE=true` only for a fictional demo; `false` before real students
4. Deploy. The `vercel-build` script runs `prisma migrate deploy` then `next build`. Functions stay in `iad1` (US East).
5. Confirm `GET /api/health` returns `{"ok":true}`.

You can instead use Neon + a private Vercel Blob store. If both Supabase Storage and Blob are configured, evidence files go to Supabase.

Do not seed demo students on a production database. Vercel and Supabase are subprocessors; complete a DPA (and a BAA if your district requires one) before real student records. Disk uploads used by Docker/Kubernetes do not persist on Vercel.

SSO callback URLs must use the Vercel `AUTH_URL`: `{AUTH_URL}/api/auth/callback/{provider}`.

### Docker

The Compose file starts **Postgres** and the app. The app image runs migrations on start, then listens on port **43147**. Evidence uploads live in `/app/data`.

```bash
# AUTH_SECRET and POSTGRES_* must be set in .env.local
npm run docker:up
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147). Stop with `npm run docker:down`. Volumes keep Postgres data (`pg-data`) and uploads (`app-uploads`).

Compose reads `.env.local` (`--env-file`) so the database user, password, and name match Next.js. After the first start, Postgres keeps the original credentials on the volume; changing them in `.env.local` does not rewrite an existing database.

If `prisma migrate` reports a failed SQLite-era migration, the volume still has old history. Wipe it (this deletes local demo data) and start again:

```bash
docker compose --env-file .env.local down -v
npm run docker:up
```

For local Next.js against Compose Postgres only:

```bash
npm run docker:db
npx prisma migrate deploy
npm run dev
```

`GET /api/health` returns `{ "ok": true }` after Postgres is reachable. It does not require a session.

The app still stores evidence files on disk, so keep **one app replica** until you move uploads to object storage. Postgres itself is a separate service and can use a PVC.

### Kubernetes

Manifests are in `deploy/k8s` (namespace, config, secret, PVCs, Postgres StatefulSet, app Deployment, Service, Ingress).

```bash
docker build -t iep-progress-tracker:0.4.0 .
# Kind: kind load docker-image iep-progress-tracker:0.4.0
# Minikube: minikube image load iep-progress-tracker:0.4.0
# Production: use ghcr.io/vrigzalejo/iep-progress-tracker:latest (published on merge to main)

# Edit deploy/k8s/secret.yaml (AUTH_SECRET, POSTGRES_PASSWORD)
# Edit deploy/k8s/configmap.yaml (POSTGRES_USER, POSTGRES_DB, AUTH_URL) and the Ingress host
kubectl apply -k deploy/k8s
kubectl -n iep-progress-tracker port-forward svc/iep-progress-tracker 43147:80
```

Replace the placeholders in `deploy/k8s/secret.yaml` before any real student data. Set `POSTGRES_USER` and `POSTGRES_DB` in `deploy/k8s/configmap.yaml` to match. Point Ingress `iep-progress-tracker.example.edu` at your cluster and use HTTPS. For a managed database (RDS, Cloud SQL, Azure Database), drop the Postgres StatefulSet and set `DATABASE_URL` on the secret.

## Data model (minimum fields)

- **Organization** — school, retention days, privacy notice version
- **User** — name, email, role, optional password hash (SSO-only accounts omit it)
- **Student** — preferred name, grade, school, case manager, IEP review dates, present levels
- **StudentProvider** — assigned related-service staff with prescribed weekly minutes
- **GuardianContact** — name, relationship, email, optional phone
- **IepGoal** — official wording, plain-language summary, baseline, target, mastery rule, reporting period, service area, measurement method, status, family sharing flag
- **GoalObjective** — short-term objectives / benchmarks under an annual goal
- **ProgressEntry** — date, score or trials, session outcome, minutes, setting, accommodations, home carryover, evidence, author
- **ReportingPeriodWindow** — school progress-report windows
- **GoalPeriodStatement** — staff-chosen IEP progress code and narrative for a period
- **Message** — student-scoped family or staff-only notes
- **AuditLog** — who viewed or changed which record
- **ConsentRecord** — notice version acknowledged by a guardian

## Role / permission matrix

| Capability | Administrator | Educator | Provider | Parent |
| --- | --- | --- | --- | --- |
| View student profile | School | Caseload | Assigned | Linked student |
| Create / edit goals | Yes | Yes | View | Shared goals |
| Record progress | Yes | Yes | Assigned | No |
| Reports | Yes | Yes | Assigned | Shared only |
| Team management | Yes | No | No | No |
| Retention / deletion | Yes | No | No | Consent only |
| Audit / export | Yes | Caseload export | Assigned export | No |

Unauthorized record access returns “not found” to avoid leaking whether a student exists.

## Threat-model notes

| Threat | Mitigation in this MVP |
| --- | --- |
| Account takeover | Password hashing (bcrypt), complexity rules, lockout after 8 failures, 8-hour sessions, HTTP-only cookies; SSO matches pre-provisioned emails and optional domain allowlist |
| Privilege escalation | Server-side permission checks on every query and mutation; parents cannot mint staff roles |
| Record enumeration | `notFound()` for unauthorized student/goal access |
| Sensitive data in logs / telemetry | Audit entries avoid goal text and notes; error UI does not echo student content |
| XSS / clickjacking | CSP, `X-Frame-Options: DENY`, nosniff |
| Insecure uploads | Authenticated download route, 5 MB cap, files stored outside `/public` |
| Demo data mistaken for real records | Persistent demonstration banner; fictional names and emails |
| AI leakage | No generative features; documented ban on using student data for model training |

Residual risks: point production Postgres at encrypted volumes and backups; this demo Compose stack uses a local passphrase; evidence files stay on a PVC in Docker/Kubernetes until you wire object storage. Hosted deploys use private Supabase Storage (or a private Vercel Blob store) for evidence.

## Production-launch checklist

- [ ] Qualified FERPA / privacy review completed
- [ ] Demo seed disabled; no fictional students in the production database
- [ ] Unique `AUTH_SECRET`; demo passphrase removed
- [ ] SSO configured (Microsoft, Google, or OIDC) with tenant issuer and domain allowlist; credentials sign-in disabled in production
- [ ] HTTPS only; HSTS at the load balancer
- [ ] Postgres (or equivalent) on encrypted volumes; backups encrypted
- [ ] Evidence files in private, encrypted storage with access logging
- [ ] District retention schedule entered
- [ ] Parent consent workflow confirmed with your legal team
- [ ] Error monitoring configured **without** student payloads
- [ ] Accessibility review (WCAG 2.2 AA) with keyboard and screen-reader testing
- [ ] Incident response contact posted for staff
- [ ] Data processing agreement if any subprocessors are added (including Vercel, Supabase, Neon, and Blob storage)

## Architecture notes

Authorization lives in `src/lib/permissions.ts` and is enforced in `src/lib/queries.ts` plus server actions in `src/app/actions.ts`. Progress indicators are calculated in `src/lib/progress.ts` and labeled as data snapshots, not IEP team decisions.

Primary flows:

1. Staff sign in → dashboard → student → goal → log a session (trials or outcome) → period comment → report or meeting packet
2. Parent signs in → family portal (switch children if linked) → shared goals, home carryover, report, family messages
3. Administrator → team roles, retention, audit, deletion

## Contributing

Work starts as a GitHub issue, then a branch off `development`, then a pull request **into `development`**. `main` is production and only receives release PRs from `development`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for labels, branch names, `Fixes #` linking, and the release steps.
