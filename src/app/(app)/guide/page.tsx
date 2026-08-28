import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/queries";
import { APP_NAME } from "@/lib/brand";

export const metadata = { title: "Setup guide" };

const STEPS = [
  {
    title: "Review privacy and consent",
    body: "Read the privacy notice with your team. Confirm who may access student records and how long you will keep them.",
    href: "/privacy",
  },
  {
    title: "Confirm roles",
    body: "Administrators invite educators, related-service providers, and family accounts. Each person should have only the access their work requires.",
    href: "/team",
  },
  {
    title: "Add student profiles",
    body: `Enter preferred name, grade, school, case manager, providers, and guardian contacts. Stop there. Extra identifiers do not belong in ${APP_NAME}.`,
    href: "/students/new",
  },
  {
    title: "Record IEP goals as written",
    body: "Copy official wording from the IEP, then write a plain-language summary. Set baseline, target, measurement method, and reporting dates.",
    href: "/students",
  },
  {
    title: "Log progress during sessions",
    body: "Tap independent, prompted, or incorrect trials during the session. Mark absent or declined when the service was not delivered.",
    href: "/dashboard",
  },
  {
    title: "Write the period report and meeting packet",
    body: "Choose an IEP progress code, add a short narrative, and print the family report or annual meeting packet.",
    href: "/reports",
  },
];

export default async function GuidePage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Setup guide</h1>
        <p className="mt-2 text-muted">
          A short path from first sign-in to a defensible progress record. This demonstration school
          is already filled with fictional students so you can click through every role.
        </p>
      </div>
      <ol className="space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Card>
              <p className="text-sm font-semibold text-forest">Step {index + 1}</p>
              <CardTitle className="mt-1">{step.title}</CardTitle>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
              <Link href={step.href} className="mt-3 inline-block font-semibold text-forest underline">
                Open this step
              </Link>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
