import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/queries";
import { APP_NAME } from "@/lib/brand";

export const metadata = { title: "Setup guide" };

const STEPS: {
  title: string;
  body: string;
  links: { href: string; label: string }[];
}[] = [
  {
    title: "Review privacy and consent",
    body: "Read the privacy notice with your team. Confirm who may access student records and how long you will keep them.",
    links: [{ href: "/privacy", label: "Open Privacy" }],
  },
  {
    title: "Confirm roles and campuses",
    body: "Administrators invite educators, related-service providers, and family accounts on Team. Add campus names on Schools so new profiles pick from a list. Each person should have only the access their work requires.",
    links: [
      { href: "/team", label: "Open Team" },
      { href: "/schools", label: "Open Schools" },
    ],
  },
  {
    title: "Add student profiles",
    body: `Enter preferred name, grade, a school from the campus list, case manager, providers, and guardian contacts. Stop there. Extra identifiers do not belong in ${APP_NAME}.`,
    links: [{ href: "/students/new", label: "Add a student" }],
  },
  {
    title: "Record IEP goals as written",
    body: "Copy official wording from the IEP, then write a plain-language summary. Set baseline, target, measurement method, and reporting dates.",
    links: [{ href: "/students", label: "Open Students" }],
  },
  {
    title: "Log progress during sessions",
    body: "Open Today for sessions still owed this week, or Hallway to log trials between bells. Tap independent, prompted, or incorrect. Mark absent or declined when the service was not delivered.",
    links: [
      { href: "/today", label: "Open Today" },
      { href: "/hallway", label: "Open Hallway" },
    ],
  },
  {
    title: "Write the period report and run the meeting",
    body: "In report studio, choose an IEP progress code and a short narrative. Print the family report or meeting packet, open Meeting room on a projector, or file a PDF. Families who opt in get a Friday email of scores and staff-written home carryover only.",
    links: [
      { href: "/reports/studio", label: "Open report studio" },
      { href: "/reports", label: "Open Reports" },
    ],
  },
];

export default async function GuidePage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Setup guide</h1>
        <p className="mt-2 text-muted">
          {user.role === "PARENT"
            ? "Families start on Family home: shared goals, messages, reports, and an optional weekly email. The numbered steps below are for staff. Use How to use this site in the corner for any one screen."
            : "A short path from first sign-in to a defensible progress record. This demonstration school is already filled with fictional students so you can click through every role. Use How to use this site in the corner if you want a question answered from this guide."}
        </p>
      </div>
      <ol className="space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Card>
              <p className="text-sm font-semibold text-forest">Step {index + 1}</p>
              <CardTitle className="mt-1">{step.title}</CardTitle>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {step.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-block font-semibold text-forest underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
