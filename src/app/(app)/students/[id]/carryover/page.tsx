import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { requireUser, getStudentDetail } from "@/lib/queries";
import { isStaff } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { familyCopy } from "@/lib/family-copy";
import { FAMILY_LOCALE_COOKIE, familyGoalSummary, resolveFamilyLocale } from "@/lib/family-locale";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Home practice cards" };

export default async function CarryoverCardsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const student = await getStudentDetail(user, id);
  if (!student) notFound();
  const locale =
    user.role === "PARENT"
      ? resolveFamilyLocale(
          (await cookies()).get(FAMILY_LOCALE_COOKIE)?.value,
          student.guardians.find((guardian) => guardian.userId === user.id)?.familyLocale,
        )
      : "en";
  const copy = familyCopy(locale);
  const cards = student.goals
    .filter((goal) => user.role !== "PARENT" || goal.sharedWithGuardians)
    .map((goal) => {
      const carryover = [...goal.entries].reverse().find((entry) => entry.homeCarryover);
      return carryover?.homeCarryover
        ? {
            goalId: goal.id,
            summary: familyGoalSummary(goal, locale),
            text: carryover.homeCarryover,
            date: carryover.recordedAt,
          }
        : null;
    })
    .filter((card): card is NonNullable<typeof card> => Boolean(card));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest">{copy.homeCards}</p>
          <h1 className="font-serif text-3xl">{student.preferredName}</h1>
          <p className="text-muted">
            Staff-written practice only. This product does not invent home activities.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={isStaff(user.role) ? `/students/${student.id}` : `/parent?studentId=${student.id}`}>
              Back
            </Link>
          </Button>
          <PrintButton />
        </div>
      </div>
      {cards.length === 0 ? (
        <p className="text-muted">No home-carryover notes are on file yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          {cards.map((card) => (
            <li
              key={card.goalId}
              className="break-inside-avoid rounded-xl border border-border bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-forest">
                {student.preferredName}
              </p>
              <p className="mt-2 font-serif text-xl">{card.summary}</p>
              <p className="mt-3 text-sm">
                <strong>{copy.tryAtHome}</strong> {card.text}
              </p>
              <p className="mt-4 text-xs text-muted">{formatDate(card.date)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
