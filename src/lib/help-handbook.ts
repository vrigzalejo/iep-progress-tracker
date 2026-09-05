import { APP_NAME } from "@/lib/brand";
import type { Role } from "@/lib/constants";

export type HelpArticle = {
  id: string;
  title: string;
  hrefs: string[];
  roles?: Role[];
  keywords: string[];
  body: string;
};

export function helpArticles(): HelpArticle[] {
  return [
    {
      id: "catalog",
      title: `Everything ${APP_NAME} can do`,
      hrefs: ["/guide", "/dashboard", "/today", "/students", "/reports", "/messages", "/privacy"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: [
        "features",
        "everything",
        "capabilities",
        "menu",
        "navigation",
        "overview",
        "what can",
        "whole app",
        "screens",
        "map",
      ],
      body: `${APP_NAME} is a least-privilege IEP progress app: transcribe goals as written, log sessions, share family-friendly reports, and keep an audit trail. It does not write IEP goals, recommend services, or make educational or legal decisions. The gold banner means demonstration data is fictional—do not enter real records.

Ask about any staff screen:

**Start** — [Sign in](/sign-in) (demo passphrase or school SSO) · [Account setup](/setup) · six-step [Setup guide](/guide)

**Chrome** — gold demo banner; sidebar (Dashboard, Students, Reports, Messages, Team if you are an administrator, Privacy, Setup guide); header [Search](/search); Sign out at the bottom of the sidebar; **How to use this site** in the corner

**Work list** — [Today](/today): remaining sessions this week, one tap into [Hallway](/hallway). [Dashboard](/dashboard) still shows reports due, stale goals, IEP reviews, and minutes. [Minutes](/minutes) is the week ledger.

**Caseload** — [Students](/students): filter by preferred name, school, or grade; add a minimum profile; IEP calendar; present levels; providers and minutes; guardian contacts; consent

**Goals** — from a profile, Add IEP goal (official wording, summary, baseline, target, measurement, mastery rule, optional first objective, share-with-family). Open a goal for the chart, extra objectives, and **Log a session**

**Sessions** — Present / Absent / Declined / Makeup; trial pad (Independent, Prompted, Incorrect) or frequency/score; setting, minutes, accommodations, home carryover, optional evidence file

**Reports** — [Report studio](/reports/studio) is the caseload × period grid. [Reports](/reports) still opens one student. Staff write the progress code and narrative. Snippets are district phrases you paste. **Meeting room** is the projector view. **File PDF** stores a packet or report as an evidence-class file.

**Find and talk** — header search · [Messages](/messages) threads with unread badges · profile thread (Family vs Staff only)

**School ops** — [Team](/team) (administrators: invite, change role, deactivate) · [Privacy](/privacy) (notice, parent acknowledgment, retention, CSV, archive, deletion, audit)

Charts and on-track badges are **data snapshots**, not IEP team votes.`,
    },
    {
      id: "catalog-family",
      title: `What families can do in ${APP_NAME}`,
      hrefs: ["/parent", "/messages", "/privacy", "/guide"],
      roles: ["PARENT"],
      keywords: [
        "features",
        "everything",
        "capabilities",
        "menu",
        "overview",
        "what can",
        "whole app",
        "screens",
        "map",
        "family",
        "portal",
      ],
      body: `As a parent or guardian you only see students linked to this account, and only goals the school marked share-with-family. You cannot see other families or staff-only notes. ${APP_NAME} does not write IEP goals or interpret a child’s record.

**Family home** — [Family home](/parent) is your landing page. If more than one child is linked, use the name tabs at the top.

**On that page** — shared goals with everyday-language progress and data-status badges; Open progress report; Meeting packet; optional **Weekly email** opt-in; Privacy and consent; a message box to the team

**Reports** — [Reports](/reports) or the buttons on Family home. Print from the report or packet. Staff choose the IEP progress code; you read what they shared

**Weekly email** — Off by default. If you opt in, Friday mail uses shared scores and staff-written home carryover only. Unsubscribe from the mail or turn it off here.

**Messages** — [Messages](/messages) lists family threads. You can also write from Family home. Keep other children’s information out of the note

**Privacy** — [Privacy](/privacy) explains what is stored. Acknowledge the notice for a linked student. You cannot export CSV, archive, or delete records

**Chrome** — gold banner (demo data is fictional); sidebar Family home, Messages, Privacy, Setup guide; Sign out at the bottom; **How to use this site** in the corner. There is no staff search box

If no student appears, ask the school to invite this email as a guardian on the student profile.`,
    },
    {
      id: "overview",
      title: `What ${APP_NAME} is for`,
      hrefs: ["/guide", "/privacy"],
      keywords: ["purpose", "start", "begin", "product", "iep progress", "sped"],
      body: `${APP_NAME} helps special education teams transcribe IEP goals, log in-the-moment progress, and send home reports families can read. Charts and “on track” badges describe **data** against the written mastery rule. They are not IEP team decisions.

The gold banner means demonstration data is fictional. Do not enter real records while it is on. After sign-in, staff land on [Dashboard](/dashboard); parents land on [Family home](/parent). Use the [Setup guide](/guide) for the six-step path from first sign-in to a defensible record.`,
    },
    {
      id: "signin",
      title: "Sign-in, demo accounts, and school SSO",
      hrefs: ["/sign-in", "/setup"],
      keywords: [
        "sign",
        "login",
        "password",
        "passphrase",
        "demo",
        "sso",
        "microsoft",
        "google",
        "oidc",
        "classlink",
        "account",
        "fictional",
      ],
      body: `Open [Sign in](/sign-in). Demo emails are listed there and share one passphrase. After sign-in, change the demo password on [Account setup](/setup) before any real deployment. SSO-only accounts have no password and use Microsoft, Google, or district OIDC; an administrator can add a temporary password if needed.

Sessions use HTTP-only cookies, expire after eight hours, and sign out after 20 minutes idle (set NEXT_PUBLIC_IDLE_MINUTES=0 to disable). Password accounts can enroll an authenticator on [Account setup](/setup). Unknown SSO emails are rejected unless the school explicitly enables JIT (not for parents). Roles live in this app; the identity provider only proves who the person is. When demonstration mode is off and SSO is configured, password sign-in stays off unless AUTH_CREDENTIALS_ENABLED=true.`,
    },
    {
      id: "roles",
      title: "Roles and who can see what",
      hrefs: ["/team", "/privacy"],
      keywords: [
        "role",
        "roles",
        "access",
        "permission",
        "admin",
        "administrator",
        "educator",
        "provider",
        "parent",
        "guardian",
        "who",
        "see",
        "least privilege",
        "invite",
      ],
      body: `**Administrator** — every student in the organization; invite people, change roles, deactivate accounts; retention, deletion, and the audit log.

**Educator** — students they case-manage; add/edit profiles and goals; log sessions; reports and family messages; CSV of their caseload.

**Related-service provider** — assigned students only; log sessions and reports; cannot create goals.

**Parent / guardian** — linked students only, and only goals marked share-with-family. Family messages and shared reports. No other families.

Open [Team](/team) to see the full capability matrix. Give each person the least access their work requires.`,
    },
    {
      id: "guide",
      title: "Setup guide",
      hrefs: ["/guide"],
      keywords: ["guide", "steps", "onboarding", "first", "walkthrough"],
      body: `The [Setup guide](/guide) is six numbered cards:

1. Review privacy and consent — [Privacy](/privacy)
2. Confirm roles — administrators invite people on [Team](/team)
3. Add a minimum student profile — [Add student](/students/new)
4. Record IEP goals as written — from [Students](/students)
5. Log progress during sessions — trial pad, absent, or declined
6. Write a period report or print a meeting packet — [Reports](/reports)

This demonstration school is already filled with fictional students so you can click every role. Use **How to use this site** for any one screen. I only explain the product. I do not fill in goals or interpret a student.`,
    },
    {
      id: "setup",
      title: "Account setup and password",
      hrefs: ["/setup"],
      keywords: ["setup", "password", "change password", "account", "break-glass"],
      body: `[Account setup](/setup) shows your name, email, and role. Password accounts can change the passphrase (12 or more characters). SSO-only accounts stay on district Microsoft, Google, or OIDC unless an administrator adds a temporary “break-glass” password on Team. After setup, continue to the [setup guide](/guide). Sign out is at the bottom of the sidebar.`,
    },
    {
      id: "dashboard",
      title: "Educator dashboard",
      hrefs: ["/dashboard"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: [
        "dashboard",
        "deadline",
        "reporting",
        "review",
        "minutes",
        "gap",
        "stale",
        "work list",
        "home",
        "attention",
      ],
      body: `Staff [Dashboard](/dashboard) is a work list, not an IEP decision engine. Greeting uses your first name. **Open caseload** goes to [Students](/students).

Four counts: (1) **Upcoming reporting** — active goals with a report due in 14 days, (2) **Needs recent data** — goals without a fresh present-session note, (3) **IEP reviews** — annual reviews due in 30 days, (4) **Minutes gap** — assigned services below this week’s prescribed minutes. Open a row to the student or goal.

Lists under the cards repeat those items with names and dates. Status badges (on track, needs attention, needs data, goal met) are a **data snapshot** against the written mastery rule.`,
    },
    {
      id: "students",
      title: "Student caseload and profiles",
      hrefs: ["/students", "/students/new"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: [
        "student",
        "students",
        "profile",
        "caseload",
        "add",
        "create",
        "preferred",
        "name",
        "grade",
        "school",
        "filter",
        "case manager",
        "guardian",
      ],
      body: `Open [Students](/students) for your permitted caseload. Filter by preferred name, school, or grade (case-insensitive). Cards show goal count and a data-status badge.

Administrators and educators can [Add student](/students/new). Required: preferred name, grade, school, case manager. Optional: annual IEP review date, triennial evaluation date, present-levels snapshot, checkboxes for service providers. Do not add diagnoses, Social Security numbers, or full educational history. Providers cannot add profiles.

On a profile: case manager, providers with this week’s delivered vs prescribed minutes, guardian contacts, IEP calendar (admins/educators can **Save IEP dates** and present levels), **Add IEP goal**, **Build report**, **Meeting packet**, **Meeting room**, goals with **Open goal and chart** / **Log a session**, and a message thread (Family or Staff only). Staff also see the latest privacy-notice acknowledgment.

Demo profiles already include guardian contacts. Parent accounts see a student when that email is linked as a guardian; invite the parent on [Team](/team) using the same email.`,
    },
    {
      id: "goals",
      title: "Recording IEP goals",
      hrefs: ["/students", "/guide"],
      roles: ["ADMINISTRATOR", "EDUCATOR"],
      keywords: [
        "goal",
        "goals",
        "iep",
        "wording",
        "baseline",
        "target",
        "mastery",
        "objective",
        "share",
        "draft",
        "discontinued",
        "service area",
        "measurement",
      ],
      body: `From a student profile, **Add IEP goal**. Copy official wording from the IEP, then write a plain-language summary families can follow. Set baseline, measurable target, numeric target value, unit (for example % accuracy or WCPM), service area (academic, speech and language, occupational therapy, physical therapy, social and self-advocacy, adaptive), measurement method (percent accuracy, frequency, duration, rubric, independent trials, or rate), reporting cadence (weekly, monthly, or quarterly), next report due, start date, and status (draft, active, goal met, discontinued).

**Mastery rule** must match the IEP: consecutive sessions needed (1–10) and the maximum prompt that still counts (independent, gesture, verbal, model, or physical). Optional present levels at goal start. Optional first short-term objective: official wording, summary, and target value. Check **Share this goal with linked parents** so families can see it (on by default).

On an open goal you can edit those fields, add more objectives, see the trend chart, prompt-level chart, session history, and **Log a session**. Changing official wording, baseline, target, or mastery creates a dated version—add a short reason. Reports pin to the version that was current at the period end. Providers view goals; they do not create them. This app never invents goal text.`,
    },
    {
      id: "sessions",
      title: "Logging a session",
      hrefs: ["/today", "/hallway", "/students", "/dashboard"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: [
        "session",
        "log",
        "progress",
        "hallway",
        "today",
        "trial",
        "independent",
        "prompted",
        "incorrect",
        "absent",
        "declined",
        "makeup",
        "minutes",
        "evidence",
        "accommodation",
        "carryover",
        "setting",
        "probe",
      ],
      body: `From [Today](/today), tap **Log in hallway** for huge trial buttons and the next student after save. You can also open a goal and **Log a session**, or **Hallway** on the profile. Choose outcome: Present, Absent, Declined/refused, or Makeup scheduled (date and place). Only **Present** sessions count toward the consecutive mastery streak. Offline hallway saves stay on this device until Wi‑Fi returns—they are never dropped silently.

For trial-based goals (percent accuracy or independent trials), set prompt level first, then tap Independent, Prompted, or Incorrect. Undo last if needed. Frequency and duration goals use +/− counts. Rubric and rate enter a numeric score. Same form: date, setting (classroom, pull-out, group, telehealth, home), minutes delivered, group size, condition (typical supports, without extras, 1:1, small group), and accommodations.

Optional: session notes, home carryover (families can see this), evidence label, and one file up to about 5 MB. You can attach the entry to a short-term objective or the whole annual goal. Charts update from saved present-session data.`,
    },
    {
      id: "charts",
      title: "Charts and data-status badges",
      hrefs: ["/students", "/dashboard"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: [
        "chart",
        "trend",
        "on track",
        "needs attention",
        "needs data",
        "goal met",
        "badge",
        "signal",
        "indicator",
      ],
      body: `Each goal page shows a trend chart of present-session scores and a status badge:

**Goal met** — recent consecutive sessions meet the written mastery rule (data snapshot, not an IEP vote).
**On track** — scores are moving toward the target.
**Needs attention** — scores slowed/declined or a report date is close; review with the IEP team.
**Needs recent data** — no fresh present-session note.

The goal page also stacks **prompt levels over time** (independent, gesture, verbal, model, physical). That chart is share of trials, not a recommendation to change the prompt hierarchy.

These labels never choose an IEP progress code. Staff pick that code on the period report.`,
    },
    {
      id: "reports",
      title: "Progress reports and period comments",
      hrefs: ["/reports", "/reports/studio"],
      keywords: [
        "report",
        "reports",
        "studio",
        "period",
        "progress",
        "code",
        "print",
        "narrative",
        "sufficient",
        "insufficient",
        "comment",
      ],
      body: `Open [Report studio](/reports/studio) for the whole caseload × period grid (missing vs written). Click **Write** to enter the IEP progress code and narrative. The data-status badge is reference only. You can bulk-mark remaining goals **not yet introduced** (type NOT_INTRODUCED). Save staff-authored snippets to paste—never generated per student. [Reports](/reports) still opens one student: print preview or period comments.

Parents open the same report from [Family home](/parent). Use **Print** in the browser—the gold banner, sidebar, and this assistant hide. Staff can **File PDF** to store a report as an evidence-class file (authenticated download, not a public URL). Codes are professional judgment, not chatbot output.`,
    },
    {
      id: "meeting",
      title: "IEP meeting packet and meeting room",
      hrefs: ["/reports"],
      keywords: [
        "meeting",
        "packet",
        "annual",
        "print",
        "iep meeting",
        "preview",
        "projector",
        "meeting room",
        "attendance",
        "pdf",
      ],
      body: `From a student profile (or Family home), open **Meeting packet**. It pulls session data, charts, progress codes, family-visible messages, and service-minute summaries into a printable packet. **Meeting room** is the projector view: large type, one goal per screen, last five present sessions, the staff-written period code, and family messages. Use **N** and **P** (or Next/Previous). Sidebar and this assistant hide. Staff can check attendance names only. **File PDF** stores the packet as an evidence-class file. The room does not suggest a progress code, services, or placement.`,
    },
    {
      id: "search",
      title: "Search",
      hrefs: ["/search", "/students"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: ["search", "find", "lookup", "wcpm", "reading", "header", "filter"],
      body: `Staff search from the header (or [Search](/search)). Matching is case-insensitive. Students match preferred name, school, or grade. Goals match official wording, plain-language summary, measurable target, service area, or student name across **your whole permitted caseload**—not only students whose name already matched.

On [Students](/students) you can also filter by school and grade. Results never include records outside your role.`,
    },
    {
      id: "messages",
      title: "Messages",
      hrefs: ["/messages"],
      keywords: ["message", "messages", "thread", "family", "staff", "note", "contact", "inbox"],
      body: `[Messages](/messages) lists one thread per student with an unread badge. Open a thread to mark it read. Staff can post a **family** note (parents see it) or a **staff-only** note. Family messages can email assigned staff (no student records in the mail). Parents only see family messages for linked students.

Send a new note from the thread, the student profile, or [Family home](/parent). Keep extra identifiers and other families’ information out of the thread.`,
    },
    {
      id: "family",
      title: "Family portal",
      hrefs: ["/parent"],
      roles: ["PARENT"],
      keywords: [
        "family",
        "parent",
        "guardian",
        "portal",
        "home",
        "child",
        "children",
        "switch",
        "shared",
        "tabs",
      ],
      body: `[Family home](/parent) is the parent landing page. You see shared goals with everyday-language progress and data-status badges, recent family messages, **Open progress report**, **Meeting packet**, optional **Weekly email**, and **Privacy and consent**. If more than one child is linked, use the name tabs at the top. You cannot see other families or staff-only notes.

Write a message from this page or [Messages](/messages). If no student appears, ask the school to connect this email as a guardian. Acknowledge the notice on [Privacy](/privacy). You do not log sessions, create goals, search the school, or manage Team.`,
    },
    {
      id: "team",
      title: "Team and permissions",
      hrefs: ["/team"],
      roles: ["ADMINISTRATOR"],
      keywords: ["team", "invite", "deactivate", "people", "staff", "permissions", "matrix", "password"],
      body: `[Team](/team) is for administrators. Read the capability matrix, then add a person: name, email, role (administrator, educator, related-service provider, or parent/guardian). Password is optional once school SSO is on; SSO-only people show “school SSO.” Change someone’s role or **Deactivate** so they cannot sign in.

Parents see a student when their email is a guardian contact on that profile. Providers must be checked on the profile. Use the same email as the district account for SSO. If SMTP is configured, the new person gets an invite email with no student records. Educators cannot open Team—ask an administrator.`,
    },
    {
      id: "privacy",
      title: "Privacy, consent, retention, and audit",
      hrefs: ["/privacy", "/privacy-notice"],
      keywords: [
        "privacy",
        "ferpa",
        "consent",
        "retention",
        "delete",
        "audit",
        "export",
        "csv",
        "archive",
        "notice",
      ],
      body: `[Privacy](/privacy) holds the notice: preferred name, school, grade, assigned staff, guardian contacts, IEP goal text, progress scores, session notes, optional evidence, and messages. Sessions use HTTP-only cookies (eight hours). Passwords are hashed. Views and changes go to an audit log. Production should use HTTPS. There is also a public [privacy notice](/privacy-notice) page.

Parents acknowledge **for each linked student**. If the school bumps the notice version, they acknowledge again. Administrators set retention days (default 2,555, about seven years; 30–3650), run a retention dry-run or purge of archived records past that window, download CSV, download one student’s ZIP file for a records request, archive a profile (leaves the active caseload, stays in audit until deletion), or permanently delete by selecting the student and typing the preferred name. Educators and providers with export permission see **Download CSV** for their caseload only. Only administrators see the full audit history and student-file ZIP. ${APP_NAME} does not send student records to generative AI to train models. FERPA-oriented practice is not a legal certification.`,
    },
    {
      id: "export",
      title: "CSV and student-file export",
      hrefs: ["/privacy"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: ["export", "csv", "download", "spreadsheet", "ferpa", "records request", "zip"],
      body: `Authorized staff open [Privacy](/privacy) and choose **Download CSV export** (or /api/export). The file includes preferred name, grade, school, goal summaries, and progress for students you are allowed to see. Administrators also download a **student education record ZIP** for one student (profile, goals, progress, messages, meeting attendance names, filed-document metadata, consents, audit). Educators export their caseload CSV; providers export assigned students. Parents have no export. Do not email the file to personal accounts.`,
    },
    {
      id: "evidence",
      title: "Session evidence files",
      hrefs: ["/students"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: ["evidence", "upload", "file", "attachment", "work sample", "photo"],
      body: `When logging a present session you may attach one evidence file (about 5 MB) and a short label such as “weekly probe 4.” Hosted deploys store files in private object storage. When demonstration mode is off, disk uploads are refused—configure Supabase Storage or a private Blob store first. Keep one app replica until storage is private. Evidence stays with the progress entry; it is not training data for AI.`,
    },
    {
      id: "navigation",
      title: "Menus, search bar, print, and sign out",
      hrefs: ["/dashboard", "/parent", "/guide"],
      keywords: [
        "sidebar",
        "menu",
        "hamburger",
        "sign out",
        "logout",
        "banner",
        "skip",
        "print",
        "chrome",
        "header",
      ],
      body: `A gold banner at the top appears only in demonstration mode and reminds you this site uses fictional data. Skip to main content is the first focusable link.

The dark sidebar lists only screens your role can open: staff see Dashboard, Today, Students, Minutes, Reports, Messages, Privacy, and Setup guide; administrators also see Team; parents see Family home instead of Dashboard and Students. On a phone, open the menu with the button next to the header. Staff have a search field in the header. Your name and role sit at the bottom of the sidebar with **Sign out**.

**How to use this site** (this assistant) stays in the lower-right corner. Browser **Print** hides the banner, sidebar, and assistant so reports and meeting packets print cleanly. **Meeting room** hides the sidebar and assistant so the projector stays readable.`,
    },
    {
      id: "minutes",
      title: "Service minutes on the dashboard",
      hrefs: ["/minutes", "/dashboard", "/students"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: [
        "minutes",
        "prescribed",
        "delivered",
        "gap",
        "service minutes",
        "minutes gap",
        "uncovered",
        "dashboard",
        "ledger",
        "makeup",
      ],
      body: `[Minutes](/minutes) is the week ledger: prescribed vs delivered, plus absent, declined, and makeup scheduled. Color is descriptive (“12 of 30 minutes”). It does not say a service should change. Use **Schedule makeup** to open hallway and mark Makeup scheduled with a date and place.

Each provider line on a student profile can have weekly prescribed minutes. [Dashboard](/dashboard) **Minutes gap** counts services still below this week’s prescription.`,
    },
    {
      id: "objectives",
      title: "Short-term objectives",
      hrefs: ["/students"],
      roles: ["ADMINISTRATOR", "EDUCATOR"],
      keywords: ["objective", "objectives", "short-term", "benchmark"],
      body: `When you add an IEP goal you may include a first short-term objective (official wording, plain-language summary, target value). On the open goal page, administrators and educators can add more objectives.

When you **Log a session**, you can attach the entry to one objective or to the whole annual goal. Charts still use the scores you save. This app does not write objective text.`,
    },
    {
      id: "today",
      title: "Today and hallway",
      hrefs: ["/today", "/hallway"],
      roles: ["ADMINISTRATOR", "EDUCATOR", "PROVIDER"],
      keywords: ["today", "hallway", "worklist", "offline", "pwa", "ipad", "queue"],
      body: `[Today](/today) lists students still owed a session or minutes this week. **Log in hallway** opens huge trial buttons. After save, hallway opens the next student. Install the app from the browser if you want a home-screen icon; the start page is Today.

If the hallway Wi‑Fi drops, the session stays in a queue on this device and syncs when you are back online. A failed sync stays visible. Optional device PIN is only for a shared cart—it does not replace sign-in.`,
    },
    {
      id: "digest",
      title: "Family weekly email",
      hrefs: ["/parent"],
      keywords: [
        "digest",
        "weekly",
        "email",
        "friday",
        "opt in",
        "unsubscribe",
        "kitchen",
        "carryover",
      ],
      body: `On [Family home](/parent), a linked guardian can opt in to a Friday weekly email for that student. It is off by default. The mail lists shared goals, last week’s present-session scores, and home-carryover notes staff already typed. It does not rewrite the child’s data with a model and does not include official IEP wording or disability labels.

The subject is “Weekly update for [preferred name]” only. Each mail says who can see it and includes an unsubscribe link. Staff do not send this by clicking a button—the daily cron sends it on Friday (or when DIGEST_SEND=1 for a test). SMTP must be configured.`,
    },
    {
      id: "assistant",
      title: "This how-to assistant",
      hrefs: ["/guide"],
      keywords: ["chatbot", "assistant", "help", "how to use", "bot"],
      body: `This panel explains every signed-in screen from the product handbook. Optional Hugging Face rephrasing uses only your question and that handbook—never student rows from the database. I will not write IEP goals, recommend minutes or placement, or interpret a named student.

Ask “what can this app do?” for the full map for your role. Suggested chips cover common tasks. Follow-up questions stay in this thread.`,
    },
  ];
}
