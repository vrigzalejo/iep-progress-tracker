# Product Requirements Document

**IEP Progress Tracker — after 0.6.0 through v1.0**

| | |
| --- | --- |
| **Status** | Living roadmap (`0.6.0` shipped 2026-09-04; v0.7 meeting/digest/PDFs in this tree) |
| **Current product** | Daily-workflow MVP (`0.6.0`) plus meeting room, family digest, and filed PDFs; fictional demo data until a district turns demo off |
| **Audience** | Educators, related-service providers, school admins, parents/guardians |
| **North star** | The fastest, most defensible way to log IEP progress in the moment and send home a report a family can actually read — without the product making IEP decisions. |

This document is grounded in the current app: Today / Hallway session logging, minutes ledger, unread message threads, report studio, standing accommodations, goal versions, family reports, meeting room, weekly digest, filed PDFs, SSO, per-child consent, FERPA student-file export, retention/cron, optional SMTP, TOTP MFA, idle timeout, local Docker HTTPS, and a how-to chatbot that never sees student records.

---

## 1. Product context

The app already covers the core loop:

1. Staff sign in → Today worklist → Hallway trial pad (or student → goal) → save a session → report studio for period comments → print report or meeting packet
2. Parent sees shared goals, home carryover, report, and a per-student message thread
3. Admin manages team, campus names, retention, audit, deletion, and one-student file export

It is **not** a legal FERPA certification, **not** an IEP writer, and **not** a placement or services recommender. Charts and “on track / needs attention / goal met” badges describe **data against the written mastery rule**. That constraint stays.

**v0.5** closed the production-privacy blockers that kept demo from being turned off. **v0.6** closed the “one goal, one form” bottleneck. **v0.7** (this tree) adds an opt-in weekly digest, a projector-safe meeting room, and filed report/packet PDFs. Remaining family work is Spanish UI, an evidence gallery, and home-carryover cards.

---

## 2. Who we optimize for

| Persona | Job to be done | Current friction |
| --- | --- | --- |
| **Educator / case manager** | Log 8–15 sessions between bells; finish period comments in one sitting | Today + Hallway + report studio exist; leftover friction is attachments and next-student after save |
| **Related-service provider** | Hit prescribed weekly minutes; prove makeup when a student is absent | Week ledger exists; makeup is still a session outcome, not a click-the-gap planner |
| **Administrator** | Roster staff, prove access, answer a records request | Student ZIP + CSV + audit exist; still no school-site tree, SIS roster, or “last backup / last purge” ops panel |
| **Parent / guardian** | Understand progress in everyday language; know what to practice at home | Per-child consent, portal, unread threads, and opt-in weekly digest exist; Spanish family UI is still open |

---

## 3. What needs to improve (before new toys)

P0 production-privacy work shipped in **0.5.0**. Daily-workflow P1 rows shipped in **0.6.0**. Remaining rows are family/meeting surfaces and model debt. Cool features still should not outrun a district review (object storage, `demo: false`, MFA or SSO).

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
| **Session log is one goal, one form** | Teachers will not open `/goals/[id]/progress/new` fifteen times. | **Shipped in 0.6.0.** Today worklist → Hallway trial pad. Next-student-after-save is still thin. |
| **Messages are a flat list of 40** | No unread state, no notify, no attachments, no thread. Families think nobody saw the note. | **Mostly shipped in 0.6.0.** Per-student thread, unread badge, email ping. Attachments / images are still open. |
| **Service minutes are a count, not a ledger** | Dashboard shows “below this week’s prescribed minutes.” No makeup planner, no “who was absent Tuesday.” | **Mostly shipped in 0.6.0.** Week ledger: prescribed vs delivered vs absent/makeup. Click-a-gap scheduler is still open. |
| **Period comments are one student at a time** | Report windows are the painful week. | **Shipped in 0.6.0.** Report studio: period filter, missing-comment queue, staff snippet library, bulk “not yet introduced.” |
| **Print = browser print** | Meeting packets look fine; they are not a filed PDF. | **Shipped in this tree (v0.7).** Staff can file a report or packet PDF as an evidence-class file. Studio “print all” as one job is still open. |
| **Search is `ILIKE` on names/goal text** | Fine at 5 demo students; noisy at 400. | **Open.** Filters: school, grade, service area, data signal, report due. Keyboard-first. |
| **WCAG 2.2 AA is on the launch checklist, not done** | Trial pad and sidebar need large targets, focus order, live-region for trial counts. | **Open (v1.0).** Keyboard + VoiceOver pass on session form, family portal, and print views. Plus axe smoke. |

### P2 — Model and ops debt

- **One case manager per student.** Real teams share cases; need a secondary / coverage assignment with an end date (substitute mode).
- **Providers cannot create or edit goals.** Correct for least privilege in many districts; wrong for OT/SLP-owned goals. Make this an org setting, not a hardcoded role matrix.
- **No paraeducator / intern role.** They log under supervision; they should not edit goals or export.
- **Goal / present-levels version history.** **Shipped in 0.6.0.** Changing official wording creates a dated version; period statements can pin to the version active in that window.
- **Student-level accommodations catalog.** **Shipped in 0.6.0.** Standing list on the student; session form can check what was used today.
- **Single-organization deploy.** `Organization` exists. An admin **Schools** list (campus names students pick) is in this tree. Still no district → campus → caseload tree or staff assigned to a site. Blocks a multi-school district until v1.0.
- **No SIS rostering.** SSO proves identity; someone still types every student. ClassLink/OneRoster is the obvious next step (SSO already mentions ClassLink).
- **Monitoring is optional Sentry.** Need a privacy-safe error budget and an admin “last backup / last retention run” panel.
- **Passkeys** for credentials accounts (TOTP shipped in 0.5.0).
- **Report-window transactional email** (invite + family-message ping shipped; opening-window mail did not).
- **Local Docker HTTPS.** **Shipped in 0.6.0** for Compose (`https://127.0.0.1:43147`, HTTP redirects). Hosted TLS remains the platform (Vercel).

---

## 4. New features (the cool ones that stay in-bounds)

Every idea below is **logging, visualization, communication, or operations**. None write goals, interpret a child, or recommend services.

### 4.1 Hallway mode (the feature that would make staff love this)

**Status.** Shipped in **0.6.0** (PWA, IndexedDB queue, optional device PIN). Remaining: conflict UX polish and “next student after save.”

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

**Status.** Shipped in this tree (v0.7). SMS later is still open.

**What.** Friday email (or SMS later): shared goals only, last week’s scores in plain language, home carryover the staff already typed, link to the portal.

**Why.** Parents will not remember to open `/parent`. The portal is good; it needs a heartbeat.

**Requirements**

- Guardian opt-in per student. Off by default in demo.
- Template uses scores and staff-written carryover. **No model rewrite of the child’s data.**
- Subject line: “Weekly update for [preferred name]” — no scores, no disability language.
- Unsubscribe and “who can see this” on every mail.

### 4.5 IEP meeting room mode

**Status.** Shipped in this tree (v0.7).

**What.** A projector-safe view of the existing meeting packet: large type, one goal per screen, chart, last 5 present sessions, period code, family messages.

**Why.** Teams currently print and shuffle. This is the “wow” in the conference room without inventing recommendations.

**Requirements**

- Keyboard: `N` / `P` between goals; hide chrome; high contrast.
- Optional attendance checklist (names only) saved to the student record.
- Staff still write the narrative. The room mode does not suggest a progress code.

### 4.6 Progress report studio

**Status.** Shipped in **0.6.0** as `/reports/studio` (missing-comment queue, snippets, bulk not-yet-introduced). Per-student filed PDF is in this tree; combined “print all” is still open.

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

**Status.** Standing list shipped in **0.6.0**. Evidence lightbox / “used in meeting packet” is still open.

**What.** Student-level accommodation list (staff-entered). Session form defaults to that list; staff uncheck what was not used. Evidence files get a lightbox, caption, and “used in meeting packet” flag.

**Why.** Work samples are how teams defend a code. A 5 MB upload with a filename is not a gallery.

### 4.9 Goal and present-levels versions (amendments)

**Status.** Shipped in **0.6.0**. Period statements can pin to the version active in that window.

**What.** Changing official wording, baseline, target, or mastery rule creates a version row with who / when / why (staff-typed). Reports pin to the version that was active in that period.

**Why.** Overwriting the goal text is a compliance hole.

### 4.10 Bilingual family surfaces

**Status.** Open (v0.7).

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

---

## 5. Non-goals (explicit)

Do not put these on the roadmap, even if a district asks in a demo:

- Generate or rewrite IEP goals, benchmarks, or present levels
- Recommend services, minutes, placement, or “what the team should decide”
- Send student records to any model (including “just to summarize the chart”)
- Train on student data
- Become a full SIS, Medicaid biller, or statewide IEP form system (CA SELPA / NY IEP clones)
- Public student-facing logins or social feeds

If a feature needs a sentence like “the student should…,” it is out of scope.

---

## 6. Phased roadmap

### v0.5 — “Safe to turn demo off” (shipped 2026-09-03 as `0.5.0`)

Consent per child · seed never runs in production · object storage required when demo is off · FERPA student-file ZIP · transactional email (invite + family message) · retention job + cron · TOTP MFA · Playwright on the core loop · idle timeout.

**Shipped when:** `/api/health` reports `ok`, `demo`, `evidence`, and `credentials`. Hosted demo stays `demo: true`. A district still turns demo off, points evidence at private object storage, and completes their own launch checklist.

### v0.6 — “Log it before the bell” (shipped 2026-09-04 as `0.6.0`)

Today caseload · hallway PWA / offline queue · service-minutes ledger + makeup · unread messages + notify · report studio · prompt-level chart · standing accommodations · goal versions · local Docker HTTPS.

**Shipped when:** a provider can finish a typical half-day of sessions from Today → Hallway without opening a full goal page, and period week is the report-studio grid.

### v0.7 — “The meeting and the kitchen table” (in working tree)

Meeting room mode · server PDFs · family weekly digest. Still open: Spanish family UI · evidence gallery · home-carryover print/SMS cards (staff-written only).

**Done when:** an IEP meeting can run from the projector view, and a guardian who never bookmarks the portal still sees a weekly update they opted into.

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

Smallest useful slices, in the repo’s `{issue}-{slug}` style. v0.6 daily workflow shipped. Meeting room, digest, and filed PDFs are in this tree.

1. **Spanish family UI** — family comprehension (remaining v0.7)
2. **Evidence gallery / home-carryover cards** — remaining v0.7
3. **OneRoster / coverage / para role** — district (v1.0)
4. **Passkeys / report-window mail** — leftover 0.5.0 polish if a district asks

---

## 9. Recommendation

P0 safety shipped in 0.5.0. Daily workflow shipped in 0.6.0. Family digest, meeting room, and filed PDFs are in this tree as v0.7. Remaining v0.7 leverage: Spanish family UI, evidence gallery, and staff-written home-carryover cards.

Land work the usual way: GitHub issue (what / who / done-when) → branch `{issue-number}-{short-slug}` off `development` → PR into `development` with `Fixes #N`. Do not commit this file to `development` or `main` directly.
