import Link from "next/link";
import { requireStaff, getMinutesLedger } from "@/lib/queries";
import { SERVICE_AREA_LABELS, type ServiceArea } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Service minutes" };

export default async function MinutesPage() {
  const user = await requireStaff();
  const { rows, weekStart } = await getMinutesLedger(user);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Service minutes this week</h1>
          <p className="mt-2 text-muted">
            Week of {formatDate(weekStart)}. Numbers compare prescribed minutes to what you logged.
            They do not decide whether services should change.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/today">Today’s worklist</Link>
        </Button>
      </header>
      {rows.length === 0 ? (
        <p>No prescribed weekly minutes are on file yet.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={`${row.studentId}-${row.serviceArea}`}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      <Link href={`/students/${row.studentId}`} className="hover:underline">
                        {row.studentName}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted">
                      {SERVICE_AREA_LABELS[row.serviceArea as ServiceArea] ?? row.serviceArea} ·{" "}
                      {row.providerName}
                    </p>
                  </div>
                  <Badge tone={row.gap > 0 ? "gold" : "forest"}>
                    {row.delivered} of {row.prescribed} minutes
                  </Badge>
                </div>
                <p className="mt-2 text-sm">
                  Absent {row.absent} · Declined {row.declined} · Makeup scheduled {row.makeupScheduled}
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted">
                        {row.days.map((day) => (
                          <th key={day.date} className="px-2 py-1 font-medium">
                            {day.date.slice(5)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {row.days.map((day) => (
                          <td key={day.date} className="px-2 py-1">
                            {day.presentMinutes || day.absent || day.declined || day.makeup
                              ? `${day.presentMinutes}m${day.absent ? ` / ${day.absent} abs` : ""}${
                                  day.makeup ? ` / ${day.makeup} mu` : ""
                                }`
                              : "—"}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                {row.gap > 0 ? (
                  <Button asChild size="sm" className="mt-3">
                    <Link href={`/hallway?studentId=${row.studentId}`}>Schedule makeup</Link>
                  </Button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
