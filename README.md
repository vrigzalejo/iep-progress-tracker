# ProgressPath

ProgressPath is a web application for special education (SPED) teams to track IEP goals and student progress. It is built for educators, related-service providers, school administrators, and parents, with least-privilege access and a parent-friendly reporting flow.

This repository ships a polished MVP that runs on **fictional demonstration data**. Do not enter real student records in demo mode.

ProgressPath is designed around FERPA-aligned practices (data minimization, role-based access, audit logs, encryption in transit via HTTPS, and configurable retention). **It is not a legal compliance certification.** Have a qualified privacy review before production use with real students.

## What you can do

- Sign in as Administrator, Educator, Provider, or Parent / Guardian
- Maintain student profiles with only necessary fields
- Create IEP goals with official wording plus a plain-language summary
- Record progress entries (including optional evidence files)
- View trend charts and “on track / needs attention / goal met” indicators that describe **data**, not IEP decisions
- Build printable, parent-friendly progress reports
- Use an educator dashboard for reporting dates, stale data, and recent activity
- Search, filter, export CSV, and review audit history (authorized staff)
- Configure retention, acknowledge consent, and delete records with confirmation

The product does **not** generate IEP goals, recommend services, or make educational, legal, or clinical decisions. Student data is **not** used to train AI models.

## Stack

- Next.js (App Router) and TypeScript
- Tailwind CSS and accessible UI primitives
- Auth.js credentials authentication with hashed passwords
- Prisma ORM with SQLite (swap to Postgres for production)
- Zod validation, server-side authorization, Vitest

## Local setup

Requirements: Node.js 22+ and npm.

```bash
git clone <this-repo>
cd progresspath
cp .env.example .env.local
# set AUTH_SECRET to a long random string
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev -- --port 43147 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

### Demo accounts

All demonstration accounts share the passphrase `ProgressPath!Demo26`.

| Role | Name | Email |
| --- | --- | --- |
| Administrator | Chris Okonkwo | chris.okonkwo@demo.progresspath.school |
| Educator | Maya Ellis | maya.ellis@demo.progresspath.school |
| Provider | Priya Shah | priya.shah@demo.progresspath.school |
| Parent / guardian | Dana Hale | dana.hale@demo.progresspath.school |

All students (Jordan Hale, Sam Rivera, Avery Chen, Riley Brooks) are fictional.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma connection string. Local default: `file:./prisma/dev.db` |
| `AUTH_SECRET` | Yes | Auth.js session signing secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Production | Public origin, for example `https://progresspath.example.edu` |
| `NEXT_PUBLIC_DEMO_MODE` | No | Keep `true` until you remove seed data |
| `SENTRY_DSN` | No | Optional error monitoring. Do not send student payloads |

`.env*` files are gitignored except `.env.example`.

## Tests

```bash
npm test
npm run lint
npm run build
```

Automated tests cover authorization rules, progress-signal calculation, and input validation.

## Deployment

1. Provision Postgres (recommended) or another relational database on encrypted disks.
2. Set `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL`.
3. Run `npx prisma migrate deploy` and **do not** seed demo students.
4. Serve the app only over HTTPS (Vercel, Fly.io, or a reverse proxy).
5. Store evidence uploads on encrypted object storage, not a public bucket.
6. Optional: add `@sentry/nextjs` using `SENTRY_DSN`, with PII scrubbing enabled.

`Dockerfile` is included for container deploys. For Vercel, connect the repo and set the environment variables above.

## Data model (minimum fields)

- **Organization** — school, retention days, privacy notice version
- **User** — name, email, role, password hash
- **Student** — preferred name, grade, school, case manager
- **StudentProvider** — assigned related-service staff
- **GuardianContact** — name, relationship, email, optional phone
- **IepGoal** — official wording, plain-language summary, baseline, target, reporting period, service area, measurement method, status, family sharing flag
- **ProgressEntry** — date, score, measurement type, notes, evidence, author
- **Message** — student-scoped team/family messages
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
| Account takeover | Password hashing (bcrypt), complexity rules, lockout after 8 failures, 8-hour sessions, HTTP-only cookies |
| Privilege escalation | Server-side permission checks on every query and mutation; parents cannot mint staff roles |
| Record enumeration | `notFound()` for unauthorized student/goal access |
| Sensitive data in logs / telemetry | Audit entries avoid goal text and notes; error UI does not echo student content |
| XSS / clickjacking | CSP, `X-Frame-Options: DENY`, nosniff |
| Insecure uploads | Authenticated download route, 5 MB cap, files stored outside `/public` |
| Demo data mistaken for real records | Persistent demonstration banner; fictional names and emails |
| AI leakage | No generative features; documented ban on using student data for model training |

Residual risks: SQLite is not encrypted by itself (use disk encryption or SQLCipher/Postgres TDE in production); this demo uses a shared passphrase; object storage and key management are not wired until you deploy.

## Production-launch checklist

- [ ] Qualified FERPA / privacy review completed
- [ ] Demo seed disabled; no fictional students in the production database
- [ ] Unique `AUTH_SECRET`; demo passphrase removed
- [ ] HTTPS only; HSTS at the load balancer
- [ ] Postgres (or equivalent) on encrypted volumes; backups encrypted
- [ ] Evidence files in private, encrypted storage with access logging
- [ ] District retention schedule entered
- [ ] Parent consent workflow confirmed with your legal team
- [ ] Error monitoring configured **without** student payloads
- [ ] Accessibility review (WCAG 2.2 AA) with keyboard and screen-reader testing
- [ ] Incident response contact posted for staff
- [ ] Data processing agreement if any subprocessors are added

## Architecture notes

Authorization lives in `src/lib/permissions.ts` and is enforced in `src/lib/queries.ts` plus server actions in `src/app/actions.ts`. Progress indicators are calculated in `src/lib/progress.ts` and labeled as data snapshots, not IEP team decisions.

Primary flows:

1. Staff sign in → dashboard → student → goal → add progress → report
2. Parent signs in → family portal → shared goals, report, messages
3. Administrator → team roles, retention, audit, deletion
