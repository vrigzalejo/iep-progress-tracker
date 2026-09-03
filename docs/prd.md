# Product Requirements Document

**IEP Progress Tracker — v0.5 through v1.0**

| | |
| --- | --- |
| **Status** | Draft for discussion |
| **Current product** | Polished MVP (`0.5.0`), fictional demo data |
| **Audience** | Educators, related-service providers, school admins, parents/guardians |
| **North star** | The fastest, most defensible way to log IEP progress in the moment and send home a report a family can actually read — without the product making IEP decisions. |

This document is grounded in the current app: goals, trial-pad sessions, family reports, SSO, audit/retention, and a how-to chatbot that never sees student records.

---

## 1. Product context

The app already covers the core loop:

1. Staff sign in → dashboard → student → goal → log a session → period comment → print report or meeting packet
2. Parent sees shared goals, home carryover, report, family messages
3. Admin manages team, retention, audit, deletion

It is **not** a legal FERPA certification, **not** an IEP writer, and **not** a placement or services recommender. Charts and “on track / needs attention / goal met” badges describe **data against the written mastery rule**. That constraint stays.

What is missing is not “more IEP features.” It is **speed at the point of service**, **production-grade privacy ops**, and **family communication that does not depend on someone remembering to open the portal**.

---

## 2. Who we optimize for

| Persona | Job to be done | Current friction |
| --- | --- | --- |
| **Educator / case manager** | Log 8–15 sessions between bells; finish period comments in one sitting | One goal at a time, no “today’s caseload,” no reminders when a family writes |
| **Related-service provider** | Hit prescribed weekly minutes; prove makeup when a student is absent | Minutes gap is a dashboard number, not a week calendar or makeup queue |
| **Administrator** | Roster staff, prove access, answer a records request | CSV + audit list; no one-click student file packet; demo seed still runs on auth |
| **Parent / guardian** | Understand progress in everyday language; know what to practice at home | Portal is solid; no email/SMS digest, no read receipts, consent only wires to the first linked child |

---

## 3. What needs to improve (before new toys)

These are defects or production gaps. Ship these first. Cool features on a demo-seeded, single-replica, no-notification app will not survive a district review.

### P0 — Production and privacy (blocks real students)

| Gap | Why it matters | Done when |
| --- | --- | --- |
| **Demo seed on every auth / `requireUser()`** | `seedDemoData()` runs from `src/auth.ts` and `src/lib/queries.ts`. One mis-set `NEXT_PUBLIC_DEMO_MODE` on a live database recreates fictional students next to real ones. | Seed runs only from `npx prisma db seed` (or an explicit demo flag). Production start with `DEMO_MODE=false` never inserts students. Health check reports `demo: false`. |
| **Evidence on local disk (K8s/Docker)** | README already says one app replica until object storage. Horizontal scale or a crashed pod loses work samples. | Default path is private Supabase (or Blob). Disk is local-dev only. Multi-replica deploy is documented and tested. |
| **No automated retention sweep** | Admins can set 2,555 days; nothing actually purges expired records or evidence. | Nightly job archives/deletes past retention, writes audit rows, never logs PII. Dry-run report for admins. |
| **Incomplete FERPA records-request packet** | CSV export is staff-caseload, not “give me everything we store on Jaime.” | Admin can export one student’s full file: profile, goals, entries, trials, period statements, family messages, consent, audit subset — as a dated ZIP/PDF bundle. |
| **Parent consent is first-child only** | Privacy page uses `students[0]` for acknowledge. Multi-child families (already in seed: Diana → Jaime and Carla) cannot ack per child. | Consent is per linked student. Notice-version bump requires re-ack. |
| **MFA / passkeys for staff** | Password + 8-failure lockout is MVP. Districts will ask for MFA before SSO is everywhere. | TOTP or passkeys for credentials accounts; SSO remains the preferred path. |
| **No email at all** | Messages, report-due, stale data, and parent invites die in the tab. | Transactional email (or district SMTP) for: guardian invite, family message, report window opening. Bodies stay generic; no goal text in subject lines. |

### P1 — Daily workflow quality

| Gap | Why it matters | Done when |
| --- | --- | --- |
| **Session log is one goal, one form** | Teachers will not open `/goals/[id]/progress/new` fifteen times. | “Today” view: caseload strip → student → goal chips → trial pad without leaving the page. |
| **Messages are a flat list of 40** | No unread state, no notify, no attachments, no thread. Families think nobody saw the note. | Per-student thread, unread badge, email ping to assigned staff, optional image (same evidence rules). |
| **Service minutes are a count, not a ledger** | Dashboard shows “below this week’s prescribed minutes.” No makeup planner, no “who was absent Tuesday.” | Week calendar: prescribed vs delivered vs absent/declined/makeup. Click a gap to schedule makeup. |
| **Period comments are one student at a time** | Report windows are the painful week. | Caseload report studio: filter by period + “missing comment,” write all narratives in one sitting. |
| **Print = browser print** | Meeting packets look fine; they are not a filed PDF. | Server-generated PDF (report + packet) stored as evidence-class files, not public URLs. |
| **Search is `ILIKE` on names/goal text** | Fine at 5 demo students; noisy at 400. | Filters: school, grade, service area, data signal, report due. Keyboard-first. |
| **Tests are unit-only (9 files)** | Authz, progress math, and validation are covered. No e2e of the session → report path. | Playwright: sign-in, log trials, write period comment, parent sees shared goal only. Plus a11y smoke (axe). |
| **WCAG 2.2 AA is on the launch checklist, not done** | Trial pad and sidebar need large targets, focus order, live-region for trial counts. | Keyboard + VoiceOver pass on session form, family portal, and print views. |

### P2 — Model and ops debt

- **One case manager per student.** Real teams share cases; need a secondary / coverage assignment with an end date (substitute mode).
- **Providers cannot create or edit goals.** Correct for least privilege in many districts; wrong for OT/SLP-owned goals. Make this an org setting, not a hardcoded role matrix.
- **No paraeducator / intern role.** They log under supervision; they should not edit goals or export.
- **No goal / present-levels version history.** Amendments overwrite `officialWording`. Need dated versions so the meeting packet can show “as of.”
- **Student-level accommodations catalog is missing.** Accommodations exist only on a session. Families and meeting packets should list the standing list, then what was used today.
- **Single-organization deploy.** `Organization` exists, but there is no school-site tree or district → campus → caseload. Blocks a multi-school district.
- **No SIS rostering.** SSO proves identity; someone still types every student. ClassLink/OneRoster is the obvious next step (SSO already mentions ClassLink).
- **Monitoring is optional Sentry.** Need a privacy-safe error budget and an admin “last backup / last retention run” panel.
- **8-hour cookie, no idle warning.** Add idle timeout + “you will be signed out” for shared classroom machines.

---

## 4. New features (the cool ones that stay in-bounds)

Every idea below is **logging, visualization, communication, or operations**. None write goals, interpret a child, or recommend services.

### 4.1 Hallway mode (the feature that would make staff love this)

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

**What.** Dashboard becomes a worklist, not four stat cards.

- Next reporting dates and stale goals stay.
- New: **Today** — students with a service due (from `StudentProvider.sessionsPerWeek` / minutes), one tap into hallway mode.
- After save, land on the next student, not the goal page.

**Success.** A provider can log a 10-trial speech session in under 20 seconds without a page reload.

### 4.3 Service-minutes ledger and makeup queue

**What.** Week view per provider and per student: prescribed minutes, delivered, absent, declined, makeup scheduled.

**Why.** The minutes-gap card is a teaser. Related-service compliance is a calendar problem.

**Requirements**

- Color is descriptive (“12 of 30 minutes this week”), never “noncompliant — reduce services.”
- Makeup is a session outcome you already have (`MAKEUP_SCHEDULED`); give it a date and a place.
- Export this ledger in the records-request packet.

### 4.4 Family weekly digest (opt-in)

**What.** Friday email (or SMS later): shared goals only, last week’s scores in plain language, home carryover the staff already typed, link to the portal.

**Why.** Parents will not remember to open `/parent`. The portal is good; it needs a heartbeat.

**Requirements**

- Guardian opt-in per student. Off by default in demo.
- Template uses scores and staff-written carryover. **No model rewrite of the child’s data.**
- Subject line: “Weekly update for [preferred name]” — no scores, no disability language.
- Unsubscribe and “who can see this” on every mail.

### 4.5 IEP meeting room mode

**What.** A projector-safe view of the existing meeting packet: large type, one goal per screen, chart, last 5 present sessions, period code, family messages.

**Why.** Teams currently print and shuffle. This is the “wow” in the conference room without inventing recommendations.

**Requirements**

- Keyboard: `N` / `P` between goals; hide chrome; high contrast.
- Optional attendance checklist (names only) saved to the student record.
- Staff still write the narrative. The room mode does not suggest a progress code.

### 4.6 Progress report studio

**What.** Caseload × reporting period grid. Cells show missing vs written. Click to write the IEP progress code + narrative. Bulk “mark not yet introduced” with confirm.

**Why.** Period week is when products get abandoned.

**Requirements**

- Staff-authored **snippet library** (district phrases they paste). Not generated per student.
- Shows the computed data signal as *reference only*, labeled as such.
- Print/PDF all completed reports in one job.

### 4.7 Prompt-fading and independence charts

**What.** On a goal, a stacked view of independent vs gesture / verbal / model / physical over time.

**Why.** The trial model already stores `promptLevel`. You are sitting on a visualization no competing “goal tracker” bothers to show — and it is still **data**, not advice.

**Labeling.** “Share of trials by prompt level. This is not a recommendation to change the prompt hierarchy.”

### 4.8 Standing accommodations + evidence gallery

**What.** Student-level accommodation list (staff-entered). Session form defaults to that list; staff uncheck what was not used. Evidence files get a lightbox, caption, and “used in meeting packet” flag.

**Why.** Work samples are how teams defend a code. A 5 MB upload with a filename is not a gallery.

### 4.9 Goal and present-levels versions (amendments)

**What.** Changing official wording, baseline, target, or mastery rule creates a version row with who / when / why (staff-typed). Reports pin to the version that was active in that period.

**Why.** Overwriting the goal text is a compliance hole.

### 4.10 Bilingual family surfaces

**What.** Family portal, reports, and digest in **English + Spanish** first (UI chrome + staff can store a Spanish plain-language summary).

**Why.** Demo names are already bilingual-world. Family comprehension is the product.

**Non-goal.** Auto-translating official IEP wording or progress narratives through a model.

### 4.11 ClassLink / OneRoster rostering

**What.** Nightly roster sync: schools, staff, students, guardian emails. Roles still live here. Unknown students are staged for case-manager claim, not auto-created as full IEP files.

**Why.** SSO without rostering still means typing 400 profiles.

### 4.12 Coverage / substitute access

**What.** Time-boxed grant: “Patricia covers Maricel’s caseload Mon–Wed.” Audit every view. Auto-expire.

**Why.** Real schools have absences. Sharing a password is the current workaround.

### 4.13 How-to chatbot, screen-aware (still handbook-only)

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

### v0.5 — “Safe to turn demo off” (foundation)

Consent per child · seed never runs in production · object storage default · FERPA student-file export · transactional email (invite + family message) · retention job · MFA or enforced SSO · Playwright on the core loop · idle timeout.

**Done when:** a district privacy officer can complete the existing production-launch checklist without “we’ll add that later,” and `/api/health` reports `ok` + `demo: false`.

### v0.6 — “Log it before the bell” (delight)

Today caseload · hallway PWA / offline queue · service-minutes ledger + makeup · unread messages + notify · report studio · prompt-level chart · standing accommodations · goal versions.

**Done when:** a provider can finish a typical half-day of sessions without opening a full goal page, and period week is a grid not a scavenger hunt.

### v0.7 — “The meeting and the kitchen table”

Meeting room mode · server PDFs · family weekly digest · Spanish family UI · evidence gallery · home-carryover print/SMS cards (staff-written only).

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
| Unauthorized access tests / e2e | unit only | Playwright happy path | Playwright + a11y on 5 critical views |
| Production incidents that leak PII in logs | 0 | 0 | 0 |

Do **not** metric “% of goals marked on track.” That would pressure staff toward a badge.

---

## 8. Suggested issue cut (when you want to land work)

Smallest useful slices, in the repo’s `{issue}-{slug}` style:

1. **Stop seeding on auth** — production safety
2. **Consent per linked student** — privacy bug
3. **Hallway / Today session strip** — the wedge feature
4. **Unread family messages + email** — communication
5. **Service week ledger** — provider love
6. **Report studio** — period-week pain
7. **Student-file export** — FERPA ops
8. **Goal wording versions** — amendment honesty
9. **Prompt-level chart** — unique, still in-bounds
10. **PWA offline queue** — only after object storage + sync audit

---

## 9. Recommendation

If you only build **three** things after the P0 safety work:

1. **Today + hallway trial pad** — this is the product people feel in their hands.
2. **Report studio** — this is the product people need in week 9.
3. **Family digest** — this is the product families actually notice.

Everything else in section 4 is leverage on top of those three.

Land work the usual way: GitHub issue (what / who / done-when) → branch `{issue-number}-{short-slug}` off `development` → PR into `development` with `Fixes #N`. Do not commit this file to `development` or `main` directly.
