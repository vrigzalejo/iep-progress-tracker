# Product Requirements Document

**IEP Progress Tracker — after 0.7.0 through v1.0**

| | |
| --- | --- |
| **Status** | Living roadmap (`0.7.0` shipped 2026-09-09; v0.8 is family comprehension, production sign-in, phone/tablet layout, the installable mobile app, and privacy-safe log monitoring) |
| **Current product** | Meeting, digest, and filed-PDF MVP (`0.7.0`); fictional demo data until a district sets `NEXT_PUBLIC_DEMO_MODE=false` |
| **Audience** | Educators, related-service providers, school admins, parents/guardians |
| **North star** | The fastest, most defensible way to log IEP progress in the moment and send home a report a family can actually read — without the product making IEP decisions. |

This document is grounded in the current app: Today / Hallway session logging, minutes ledger, unread message threads, report studio, standing accommodations, goal versions, family reports, meeting room, weekly digest, filed PDFs, SSO, per-child consent, FERPA student-file export, retention/cron, optional SMTP, TOTP MFA, idle timeout, local Docker HTTPS, privacy-safe stdout logs, and a how-to chatbot that never sees student records.

---

## 1. Product context

The app already covers the core loop:

1. Staff sign in → Today worklist → Hallway trial pad (or student → goal) → save a session → report studio for period comments → print report or meeting packet
2. Parent sees shared goals, home carryover, report, and a per-student message thread
3. Admin manages team, campus names, retention, audit, deletion, and one-student file export

It is **not** a legal FERPA certification, **not** an IEP writer, and **not** a placement or services recommender. Charts and “on track / needs attention / goal met” badges describe **data against the written mastery rule**. That constraint stays.

**v0.5** closed the production-privacy blockers that kept demo from being turned off. **v0.6** closed the “one goal, one form” bottleneck. **v0.7** adds an opt-in weekly digest, a projector-safe meeting room, and filed report/packet PDFs. **v0.8** is leftover family work, a production sign-in that does not still look like a demo, a phone/tablet shell that does not overflow or fight itself, the **same product as an installable phone/iPad app** (not a second native codebase), and **privacy-safe logs** operators can follow while testing.

### Sign-in when demonstration mode is off (`NEXT_PUBLIC_DEMO_MODE=false`)

This is what `/sign-in` already does. It is not a new design — document it so v0.8 only changes the gaps.

| Surface | Demo on | Demo off |
| --- | --- | --- |
| Gold “demonstration data” banner | Shown on every signed-in page | Hidden |
| Right-hand card | Yellow **Fictional sample school** list; tap fills email + shared passphrase | White **School accounts** card: an administrator must add the work or family email first; the identity provider only proves who the person is |
| Demo emails / passphrase | Listed | Never shown |
| Email + password form | Shown | Shown only if school SSO is **not** configured, or `AUTH_CREDENTIALS_ENABLED=true`. Otherwise the form is hidden |
| SSO buttons | Optional | Preferred. Microsoft / Google / ClassLink (or other OIDC) appear when those env vars are set. Divider **or use email** only if the password form is still on |
| After a password that needs MFA | Authenticator field appears | Same. Password staff without TOTP are sent to Account setup to enroll (required when demo is off) |
| Footer under the form | Eight failed passwords pause sign-in for 15 minutes | Same if passwords are on; if SSO-only: “School SSO signs you in with your district account.” |
| Unknown SSO email | Rejected unless JIT | Same. Default copy: “No matching school account. Ask an administrator to add your email first.” Do not use JIT for parents |
| Footer FERPA line | Says “this demonstration is not a legal certification” | **Shipped in 0.8.0.** Drops “demonstration” when demo is off |
| Forgot / reset password | [Forgot password](/forgot-password) when mail is on | **Shipped in 0.8.0.** Two-hour set-password link (no student records). Team invite can skip a temp password |

Sessions stay HTTP-only cookies, eight hours, idle sign-out (default 20 minutes). Roles stay in this app.

---

## 2. Who we optimize for

| Persona | Job to be done | Current friction |
| --- | --- | --- |
| **Educator / case manager** | Log 8–15 sessions between bells; finish period comments in one sitting | Today + Hallway + report studio exist; leftover friction is attachments, next-student after save, and pages that still assume a wide laptop |
| **Related-service provider** | Hit prescribed weekly minutes; prove makeup when a student is absent | Week ledger exists; makeup is still a session outcome, not a click-the-gap planner |
| **Administrator** | Roster staff, prove access, answer a records request | Student ZIP + CSV + audit exist; still no school-site tree, SIS roster, or “last backup / last purge” ops panel |
| **Parent / guardian** | Understand progress in everyday language; know what to practice at home | Per-child consent, portal, unread threads, and opt-in weekly digest exist; Spanish family UI is still open; family and sign-in pages are desktop-first |

---

## 3. What needs to improve (before new toys)

P0 production-privacy work shipped in **0.5.0**. Daily-workflow P1 rows shipped in **0.6.0**. Meeting/digest/PDF shipped in **0.7.0**. Remaining rows below are the **v0.8** family, production-sign-in, and layout slice, then v1.0 model debt. Cool features still should not outrun a district review (object storage, `demo: false`, MFA or SSO).

### P0 — Production and privacy (shipped in 0.5.0)

| Gap | Why it mattered | Shipped as |
| --- | --- | --- |
| **Demo seed on every auth / `requireUser()`** | One mis-set `NEXT_PUBLIC_DEMO_MODE` on a live database would recreate fictional students next to real ones. | Seed runs from `npx prisma db seed` only, and refuses when demo is off. `/api/health` reports `demo`. |
| **Evidence on local disk (K8s/Docker)** | Horizontal scale or a crashed pod would lose work samples. | Object storage is required when demo is off. Disk remains local-dev / hosted-demo only. Keep **one app replica** until a district deploy is proven on private storage. |
| **No automated retention sweep** | Admins could set 2,555 days; nothing purged. | Admin dry-run/purge plus `/api/cron/daily` (`CRON_SECRET`). Audit rows, no PII in logs. |
| **Incomplete FERPA records-request packet** | CSV was staff-caseload only. | Admin ZIP for one student: profile, goals, entries, trials, period statements, family messages, consent, audit subset. |
| **Parent consent is first-child only** | Multi-child families could not ack per child. | Consent is per linked student. Notice-version bump requires re-ack. |
| **MFA for staff** | Password + lockout was not enough for districts that still use credentials. | TOTP on Account setup. SSO remains the preferred path. Passkeys are still open. |
| **No email at all** | Invites and family notes died in the tab. | Optional SMTP for guardian invite and family-message ping. Bodies stay generic; no goal text in subject lines. Report-window mail is still open. |
| **8-hour cookie, no idle warning** | Shared classroom machines stayed signed in. | Idle timeout (`NEXT_PUBLIC_IDLE_MINUTES`, default 20; `0` disables). |
| **Tests are unit-only** | No e2e of the session → report path. | Playwright: sign-in, log trials, Today/Hallway, report studio, parent cannot open Team. axe/WCAG pass is still open. |

### P1 — Daily workflow quality

| Gap | Why it matters | Status |
| --- | --- | --- |
| **Session log is one goal, one form** | Teachers will not open `/goals/[id]/progress/new` fifteen times. | **Shipped in 0.6.0.** Today worklist → Hallway trial pad. Next-student-after-save and Hallway evidence shipped in **0.8.0**. |
| **Messages are a flat list of 40** | No unread state, no notify, no attachments, no thread. Families think nobody saw the note. | **Mostly shipped in 0.6.0.** Per-student thread, unread badge, email ping. Attachments / images are still open. |
| **Service minutes are a count, not a ledger** | Dashboard shows “below this week’s prescribed minutes.” No makeup planner, no “who was absent Tuesday.” | **Mostly shipped in 0.6.0.** Week ledger: prescribed vs delivered vs absent/makeup. Click-a-gap scheduler is still open. |
| **Period comments are one student at a time** | Report windows are the painful week. | **Shipped in 0.6.0.** Report studio: period filter, missing-comment queue, staff snippet library, bulk “not yet introduced.” |
| **Print = browser print** | Meeting packets look fine; they are not a filed PDF. | **Shipped in 0.7.0.** Staff can file a report or packet PDF as an evidence-class file. Studio “print all” as one job is still open. |
| **Search is `ILIKE` on names/goal text** | Fine at 5 demo students; noisy at 400. | **Shipped in 0.8.0.** Filters: school, grade, service area, data signal, overdue report date. |
| **Phone and tablet layout is leftover desktop chrome** | Hallway has large targets; everything else still assumes a laptop. The drawer overlaps Sign out on short phones, tables only scroll sideways, and the help chat sits on top of page actions. | **Shipped in 0.8.0.** Drawer scrim, stacked tables, one-column sign-in, help-chat clearance. Full WCAG 2.2 AA stays v1.0. |
| **WCAG 2.2 AA is on the launch checklist, not done** | Trial pad and sidebar need large targets, focus order, live-region for trial counts. | **Open (v1.0).** Keyboard + VoiceOver pass on session form, family portal, and print views. Plus axe smoke. |

### P2 — Model and ops debt

- **One case manager per student.** Real teams share cases; need a secondary / coverage assignment with an end date (substitute mode).
- **Providers cannot create or edit goals.** Correct for least privilege in many districts; wrong for OT/SLP-owned goals. Make this an org setting, not a hardcoded role matrix.
- **No paraeducator / intern role.** They log under supervision; they should not edit goals or export.
- **Goal / present-levels version history.** **Shipped in 0.6.0.** Changing official wording creates a dated version; period statements can pin to the version active in that window.
- **Student-level accommodations catalog.** **Shipped in 0.6.0.** Standing list on the student; session form can check what was used today.
- **Single-organization deploy.** `Organization` exists. An admin **Schools** list (campus names students pick) shipped in **0.7.0**. Still no district → campus → caseload tree or staff assigned to a site. Blocks a multi-school district until v1.0.
- **No SIS rostering.** SSO proves identity; someone still types every student. ClassLink/OneRoster is the obvious next step (SSO already mentions ClassLink).
- **Monitoring is optional Sentry.** **Stdout JSON logs shipped in 0.8.0** (`npm run docker:logs`, optional local Dozzle). Sentry DSN is still unwired. Admin “last backup / last retention run” panel stays v1.0.
- **Passkeys** for credentials accounts (TOTP shipped in 0.5.0).
- **Report-window transactional email** (invite + family-message ping shipped; opening-window mail did not).
- **Local Docker HTTPS.** **Shipped in 0.6.0** for Compose (`https://127.0.0.1:43147`, HTTP redirects). Hosted TLS remains the platform (Vercel).

---

## 4. New features (the cool ones that stay in-bounds)

Every idea below is **logging, visualization, communication, or operations**. None write goals, interpret a child, or recommend services.

### 4.1 Hallway mode (the feature that would make staff love this)

**Status.** Shipped in **0.6.0** (PWA, IndexedDB queue, optional device PIN). Next-student-after-save and Hallway evidence attach shipped in **0.8.0**. Remaining: conflict UX polish.

**What.** A PWA “Hallway” screen: huge trial buttons, student + goal already chosen, works offline, syncs when the hallway Wi‑Fi comes back.

**Why.** Progress dies when the form is a full page on a laptop. The trial pad (`Independent` / `Prompted` / `Incorrect`) is already the best interaction in the product. Make it the product.

**Requirements**

- Installable PWA; offline queue in IndexedDB; conflict rule = last write with audit of sync time.
- One-thumb targets (≥44px), landscape tablet, portrait phone.
- Offline store holds **session scores and trial results only** for the current day — not the full student file.
- Sync failure is visible; never silently drop a session.
- Optional lock screen PIN on top of the 8-hour session (shared iPad cart).

**Non-goals.** Voice models in the cloud. On-device speech-to-text for *staff notes* is OK if nothing leaves the device.

### 4.2 Today’s caseload + 10-second log

**Status.** Shipped in **0.6.0** as `/today`. Dashboard stats remain; Today is the worklist.

**What.** Dashboard becomes a worklist, not four stat cards.

- Next reporting dates and stale goals stay.
- New: **Today** — students with a service due (from `StudentProvider.sessionsPerWeek` / minutes), one tap into hallway mode.
- After save, land on the next student, not the goal page.

**Success.** A provider can log a 10-trial speech session in under 20 seconds without a page reload.

### 4.3 Service-minutes ledger and makeup queue

**Status.** Shipped in **0.6.0** as `/minutes` (prescribed vs delivered vs absent/makeup). Click-a-gap scheduler is still open.

**What.** Week view per provider and per student: prescribed minutes, delivered, absent, declined, makeup scheduled.

**Why.** The minutes-gap card is a teaser. Related-service compliance is a calendar problem.

**Requirements**

- Color is descriptive (“12 of 30 minutes this week”), never “noncompliant — reduce services.”
- Makeup is a session outcome you already have (`MAKEUP_SCHEDULED`); give it a date and a place.
- Export this ledger in the records-request packet.

### 4.4 Family weekly digest (opt-in)

**Status.** Shipped in **0.7.0**. SMS later is still open.

**What.** Friday email (or SMS later): shared goals only, last week’s scores in plain language, home carryover the staff already typed, link to the portal.

**Why.** Parents will not remember to open `/parent`. The portal is good; it needs a heartbeat.

**Requirements**

- Guardian opt-in per student. Off by default in demo.
- Template uses scores and staff-written carryover. **No model rewrite of the child’s data.**
- Subject line: “Weekly update for [preferred name]” — no scores, no disability language.
- Unsubscribe and “who can see this” on every mail.

### 4.5 IEP meeting room mode

**Status.** Shipped in **0.7.0**.

**What.** A projector-safe view of the existing meeting packet: large type, one goal per screen, chart, last 5 present sessions, period code, family messages.

**Why.** Teams currently print and shuffle. This is the “wow” in the conference room without inventing recommendations.

**Requirements**

- Keyboard: `N` / `P` between goals; hide chrome; high contrast.
- Optional attendance checklist (names only) saved to the student record.
- Staff still write the narrative. The room mode does not suggest a progress code.

### 4.6 Progress report studio

**Status.** Shipped in **0.6.0** as `/reports/studio` (missing-comment queue, snippets, bulk not-yet-introduced). Per-student filed PDF shipped in **0.7.0**; combined “print all” is still open.

**What.** Caseload × reporting period grid. Cells show missing vs written. Click to write the IEP progress code + narrative. Bulk “mark not yet introduced” with confirm.

**Why.** Period week is when products get abandoned.

**Requirements**

- Staff-authored **snippet library** (district phrases they paste). Not generated per student.
- Shows the computed data signal as *reference only*, labeled as such.
- Print/PDF all completed reports in one job.

### 4.7 Prompt-fading and independence charts

**Status.** Shipped in **0.6.0** on the goal page (share of trials by prompt level; labeled as data, not advice).

**What.** On a goal, a stacked view of independent vs gesture / verbal / model / physical over time.

**Why.** The trial model already stores `promptLevel`. You are sitting on a visualization no competing “goal tracker” bothers to show — and it is still **data**, not advice.

**Labeling.** “Share of trials by prompt level. This is not a recommendation to change the prompt hierarchy.”

### 4.8 Standing accommodations + evidence gallery

**Status.** Standing list shipped in **0.6.0**. Evidence gallery + meeting-packet flag + home-carryover print cards shipped in **0.8.0**.

**What.** Student-level accommodation list (staff-entered). Session form defaults to that list; staff uncheck what was not used. Evidence files get a lightbox, caption, and “used in meeting packet” flag.

**Why.** Work samples are how teams defend a code. A 5 MB upload with a filename is not a gallery.

### 4.9 Goal and present-levels versions (amendments)

**Status.** Shipped in **0.6.0**. Period statements can pin to the version active in that window.

**What.** Changing official wording, baseline, target, or mastery rule creates a version row with who / when / why (staff-typed). Reports pin to the version that was active in that period.

**Why.** Overwriting the goal text is a compliance hole.

### 4.10 Bilingual family surfaces

**Status.** Shipped in **0.8.0**. English/Spanish chrome plus optional staff-written Spanish summary. No model translation.

**What.** Family portal, reports, and digest in **English + Spanish** first (UI chrome + staff can store a Spanish plain-language summary).

**Why.** Demo names are already bilingual-world. Family comprehension is the product.

**Non-goal.** Auto-translating official IEP wording or progress narratives through a model.

### 4.11 ClassLink / OneRoster rostering

**Status.** Open (v1.0).

**What.** Nightly roster sync: schools, staff, students, guardian emails. Roles still live here. Unknown students are staged for case-manager claim, not auto-created as full IEP files.

**Why.** SSO without rostering still means typing 400 profiles.

### 4.12 Coverage / substitute access

**Status.** Open (v1.0).

**What.** Time-boxed grant: “Patricia covers Maricel’s caseload Mon–Wed.” Audit every view. Auto-expire.

**Why.** Real schools have absences. Sharing a password is the current workaround.

### 4.13 How-to chatbot, screen-aware (still handbook-only)

**Status.** Handbook-only assistant shipped earlier; 0.6.0 updated articles for Today, Hallway, minutes, and studio. Still no student payload.

**What.** The corner assistant already maps routes to handbook articles. Make it open the article for *this* path by default, with suggested questions. Keep `HF_TOKEN` as optional rephrase of handbook text.

**Non-negotiable.** No student payload, no goal text, no “what should I write for this period.”

### 4.14 Phone and tablet shell

**Status.** Shipped in **0.8.0**.

**What.** Make the signed-in shell, sign-in, family portal, and wide staff tables usable at 375px (phone) and 768px (tablet) without horizontal page scroll, overlapping chrome, or unreadable columns.

**Why.** Production sign-in and family reading happen on a phone. Staff open Today / Students / Minutes on a cart iPad, not only a classroom laptop. A drawer that covers Sign out, a help bubble on top of Save, and sideways-only tables make the product look unfinished once the gold demo banner is gone.

**Known mess (current code)**

- **Drawer.** `AppShell` slides a `fixed` 16rem aside. Sign out is `absolute` at the bottom, so a short phone or a long staff nav list covers the last links. There is no dimmed backdrop and no focus trap; the page behind stays clickable.
- **Header.** Hamburger + full-width search share one row. On a phone the field crowds the menu control; family header copy wraps under the icon.
- **Help chat.** Fixed `bottom-20 right-4` launcher and panel sit on primary actions (Hallway save, message send, studio submit).
- **Sign-in.** Stacks the form card, the School accounts / demo card, and a FERPA paragraph. Fine at `lg`; on a phone it is three blocks of the same width with no single primary column.
- **Tables.** Report studio, minutes ledger, and Team only get `overflow-x-auto`. They do not collapse to cards or a stacked definition list.
- **Grids.** Dashboard / student / goal stat rows go `md:grid-cols-3` or `4` and squeeze labels. Meeting room stays projector-first (out of scope here).

**Requirements**

- Phone: drawer opens over a dismissible scrim; nav list scrolls; user + Sign out stay visible; Escape and backdrop close it; moving to a new route still closes it.
- Header search can collapse to an icon that expands, or sit on its own row under the title, so the menu control stays ≥44px and unobscured.
- Help launcher clears the bottom safe area and does not cover the primary button on Hallway, messages, or studio. Full-height sheet on phones is OK.
- Sign-in is one column below `lg`: credentials/SSO first, School accounts as a short note, FERPA line last. Production copy (no “demonstration”) ships with the sign-in polish already in v0.8.
- Studio, minutes, and Team: card or stacked rows below `md`; keep the table from `md` up, still horizontally scrollable if a column set is wide.
- No page-level horizontal scroll at 375px on sign-in, Today, Students, family home, messages, or a student file. Safe-area insets for notched phones.
- Verify in a browser at 375 and 768, plus the existing Hallway large-target path. Do not wait for the v1.0 VoiceOver/axe pass.

**Non-goals.** Redesigning meeting room. Full WCAG 2.2 AA (v1.0). A second React Native / Expo client that talks to a new student API (see 4.15 — the mobile app is this site, installed).

### 4.15 Installable mobile app (same origin)

**Status.** Shipped in **0.8.0** as an installable same-origin PWA. Capacitor/MDM wrap remains optional for v1.0.

**What.** Staff and families install **this** product on a phone or iPad: home-screen icon, standalone chrome, same Auth.js cookies, same Postgres, same evidence store. No second app, no second student API, no student records on a vendor BaaS.

**Why.** Districts ask for “the mobile app.” A native rewrite would copy FERPA data into a new client, break cookie SSO, and double the audit surface. The job to be done is: open Today or Family home from the home screen between bells or in the pickup line.

**Requirements**

- Manifest `start_url` is `/` (role redirect: staff → Dashboard/Today, parent → Family home, signed-out → sign-in). `scope` is `/`.
- PNG icons 180 (Apple), 192, and 512. iOS will not use the current SVG as a home-screen icon.
- `apple-mobile-web-app-capable`, theme color, `viewport-fit=cover`, safe-area insets.
- Service worker registers on every page, including `/sign-in`. Offline cache stays **Today + Hallway session scores for the current day only** — never the full student file.
- Dismissible install hint: iOS Share → Add to Home Screen; Android Chrome Install app. Hidden once the display mode is already `standalone`.
- Same roles, MFA, idle timeout, and “no student payload to models” rules as the website.
- Optional later (v1.0, only if a district requires MDM / App Store): a **Capacitor / WKWebView wrapper** of this origin. Still no native copy of the caseload. Do not ship a parallel React Native client.

**Non-goals.** App Store listing in v0.8. Push notifications that include student names or scores. Caching reports, messages, or evidence offline. A student-facing social app.

### 4.16 Privacy-safe log monitoring

**Status.** Shipped in **0.8.0** as JSON stdout (request + error lines) plus `npm run docker:logs`. Optional local Dozzle UI on `127.0.0.1:8888`. `SENTRY_DSN` remains unwired; do not send student payloads if you add Sentry later. Admin “last backup / last purge” panel stays v1.0.

**What.** Operators watching a local or hosted process can see that a request happened (method + redacted path such as `/students/:id`) and that an error happened (message + safe context). They cannot reconstruct a student file from logs.

**Why.** Testing `development` and production incidents both need a tail. Raw Next.js / Docker logs are easy to fill with preferred names, search queries, and evidence URLs.

**Requirements**

- One JSON line per event: `ts`, `level`, `event`, `app`, plus scrubbed context.
- Request logs omit the query string and replace cuid/uuid path segments with `:id`. Health and icon routes are not logged.
- `captureError` / `scrubLogContext` drop preferred name, email, phone, official wording, notes, narratives, and home carryover. Tests refuse those keys.
- Local: `npm run docker:logs` follows Compose. `npm run docker:logs:ui` starts Dozzle on loopback only (Docker socket). Set `LOG_REQUESTS=false` to silence request lines.
- Unhandled request errors go to stdout via `instrumentation.ts` `onRequestError`.
- Production incidents that leak PII in logs stay a **zero** success metric.

**Non-goals.** An in-app log dump (that would copy records into a second store). Shipping `@sentry/nextjs` in this slice.

---

## 5. Non-goals (explicit)

Do not put these on the roadmap, even if a district asks in a demo:

- Generate or rewrite IEP goals, benchmarks, or present levels
- Recommend services, minutes, placement, or “what the team should decide”
- Send student records to any model (including “just to summarize the chart”)
- Train on student data
- Become a full SIS, Medicaid biller, or statewide IEP form system (CA SELPA / NY IEP clones)
- Public student-facing logins or social feeds
- A second native app that stores or syncs student records outside this origin (React Native + new API, Firebase student cache, and the like)

If a feature needs a sentence like “the student should…,” it is out of scope.

---

## 6. Phased roadmap

### v0.5 — “Safe to turn demo off” (shipped 2026-09-03 as `0.5.0`)

Consent per child · seed never runs in production · object storage required when demo is off · FERPA student-file ZIP · transactional email (invite + family message) · retention job + cron · TOTP MFA · Playwright on the core loop · idle timeout.

**Shipped when:** `/api/health` reports `ok`, `demo`, `evidence`, and `credentials`. Hosted demo stays `demo: true`. A district still turns demo off, points evidence at private object storage, and completes their own launch checklist.

### v0.6 — “Log it before the bell” (shipped 2026-09-04 as `0.6.0`)

Today caseload · hallway PWA / offline queue · service-minutes ledger + makeup · unread messages + notify · report studio · prompt-level chart · standing accommodations · goal versions · local Docker HTTPS.

**Shipped when:** a provider can finish a typical half-day of sessions from Today → Hallway without opening a full goal page, and period week is the report-studio grid.

### v0.7 — “The meeting and the kitchen table” (shipped 2026-09-09 as `0.7.0`)

Meeting room mode · server PDFs · family weekly digest · admin Schools list · Resend/SMTP transactional mail · Team reactivate. Still open: Spanish family UI · evidence gallery · home-carryover print/SMS cards (staff-written only).

**Done when:** an IEP meeting can run from the projector view, and a guardian who never bookmarks the portal still sees a weekly update they opted into.

### v0.8 — “A family can read it without a demo banner” (shipped as `0.8.0`)

Spanish family UI · evidence gallery · staff-written home-carryover cards · production sign-in copy (no “demonstration” footer) · forgot / first-login password from the invite mail · caseload search filters · next student after Hallway save · phone and tablet shell · installable home-screen app · privacy-safe stdout logs (`npm run docker:logs`).

**Done when:** a district can set `NEXT_PUBLIC_DEMO_MODE=false` and the sign-in page looks like a school product; a Spanish-speaking guardian can read the portal, report, and digest on a phone; work samples have a gallery; staff can open Today, Students, Minutes, and Team at 375px without overlapping chrome; Add to Home Screen lands on `/`; an operator can follow Compose logs without student names, emails, or goal text.

### v1.0 — “A district can run this”

School-site hierarchy · OneRoster/ClassLink rostering · coverage grants · paraeducator role · org setting for “providers may edit goals” · admin ops panel (backups, last purge, storage backend) · WCAG 2.2 AA sign-off.

**Done when:** two schools in one org, SSO + roster, no shared passwords, evidence on object storage, multi-replica app.

---

## 7. Success metrics (data, not decisions)

| Metric | v0.5 | v0.6 | v1.0 |
| --- | --- | --- | --- |
| Time to log a 10-trial present session | — | < 20s from Today | < 15s offline-capable |
| % of active goals with a present session in 14 days | baseline | +30% vs baseline | +50% |
| % of goals with a period statement before the window ends | baseline | +40% | +60% |
| Family digest open rate (opt-in) | — | — | > 40% |
| Unauthorized access tests / e2e | Playwright happy path | Playwright + report studio | Playwright + a11y on 5 critical views |
| Production incidents that leak PII in logs | 0 | 0 | 0 |

Do **not** metric “% of goals marked on track.” That would pressure staff toward a badge.

---

## 8. Suggested issue cut (when you want to land work)

Smallest useful slices, in the repo’s `{issue}-{slug}` style. v0.6 daily workflow and v0.7 meeting/digest/PDFs have shipped.

1. **Phone and tablet shell** — drawer scrim, header/search, stacked tables, help-chat clearance, one-column sign-in (v0.8)
2. **Installable home-screen app** — PNG icons, `start_url` `/`, install hint, SW on sign-in (v0.8). Capacitor/MDM wrap only if a district requires a store listing
3. **Non-demo sign-in copy + forgot/first-login password** — production `/sign-in` still talks like a demo and has no reset mail (v0.8)
4. **Spanish family UI** — portal, report, digest chrome (v0.8)
5. **Evidence gallery / home-carryover cards** — lightbox + staff-written cards (v0.8)
6. **Search filters + next-student after Hallway save** — daily leftover (v0.8)
7. **Privacy-safe log monitoring** — stdout JSON, `docker:logs`, optional Dozzle; no student payloads (v0.8)
8. **OneRoster / coverage / para role** — district (v1.0)
9. **Passkeys / report-window mail / print-all PDF** — leftover polish if a district asks

---

## 9. Recommendation

P0 safety shipped in 0.5.0. Daily workflow shipped in 0.6.0. Family digest, meeting room, filed PDFs, Schools, and Resend/SMTP mail shipped in 0.7.0. Next: **v0.8** — Spanish family surfaces, evidence gallery, home-carryover cards, a sign-in page that no longer looks like the fictional demo when `NEXT_PUBLIC_DEMO_MODE=false`, a phone/tablet shell that does not overlap itself, the same site as an installable phone/iPad app (not a second native client), and privacy-safe logs you can follow with `npm run docker:logs`.

Land work the usual way: GitHub issue (what / who / done-when) → branch `{issue-number}-{short-slug}` off `development` → PR into `development` with `Fixes #N`. Do not commit this file to `development` or `main` directly.
