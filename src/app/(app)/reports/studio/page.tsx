import Link from "next/link";
import {
  addReportSnippetAction,
  bulkNotIntroducedAction,
  savePeriodStatementAction,
} from "@/app/actions";
import { requireStaff, getReportStudio } from "@/lib/queries";
import { ProgressCodeBadge } from "@/components/progress-code-badge";
import { StatusIndicator } from "@/components/status-indicator";
import { Alert, FormError } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ConfirmSubmit } from "@/components/confirm-submit";
import {
  PROGRESS_CODE_LABELS,
  PROGRESS_CODES,
  SERVICE_AREA_LABELS,
  type ProgressCode,
  type ServiceArea,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Report studio" };

export default async function ReportStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string; goalId?: string; saved?: string; error?: string }>;
}) {
  const user = await requireStaff();
  const query = await searchParams;
  const { period, periods, snippets, rows } = await getReportStudio(user, query.periodId);
  const missing = rows.filter((row) => !row.written);
  const selected = rows.find((row) => row.goalId === query.goalId) ?? missing[0] ?? rows[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24 sm:pb-0">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Progress report studio</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Caseload × this reporting period. Write the IEP progress code and narrative yourself.
            The data signal is a reference only.
          </p>
        </div>
        {period ? (
          <Button asChild variant="secondary">
            <Link href={`/reports/studio/print?periodId=${period.id}`}>Print completed reports</Link>
          </Button>
        ) : null}
      </header>
      {query.saved === "bulk" ? (
        <Alert title="Marked not yet introduced" tone="success">
          Selected goals without a comment now have a not-yet-introduced statement.
        </Alert>
      ) : null}
      <FormError error={query.error} />
      {periods.length > 0 ? (
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="periodId">Reporting period</Label>
            <Select id="periodId" name="periodId" defaultValue={period?.id}>
              {periods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <Button formAction="/reports/studio" formMethod="get" variant="secondary">
            Switch period
          </Button>
        </form>
      ) : (
        <p>No reporting windows have been set up yet.</p>
      )}
      {!period ? null : (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Caseload</CardTitle>
              {missing.length > 0 ? (
                <Badge tone="gold">{missing.length} missing</Badge>
              ) : (
                <Badge tone="forest">All written</Badge>
              )}
            </div>
            {rows.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No IEP goals are on this caseload yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {groupStudioRows(rows).map((group) => (
                  <li key={group.studentId} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-semibold">{group.studentName}</p>
                    <ul className="mt-2 space-y-2">
                      {group.goals.map((row) => {
                        const active = selected?.goalId === row.goalId;
                        return (
                          <li
                            key={row.goalId}
                            className={cn(
                              "rounded-xl px-3 py-2",
                              active ? "bg-paper" : "hover:bg-paper/70",
                            )}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm">{row.goalSummary}</p>
                                <p className="mt-0.5 text-xs text-muted">
                                  {SERVICE_AREA_LABELS[row.serviceArea as ServiceArea] ?? row.serviceArea}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <StatusIndicator signal={row.signal} />
                                {row.written ? (
                                  <ProgressCodeBadge code={row.progressCode as ProgressCode} />
                                ) : (
                                  <Badge tone="gold">Missing</Badge>
                                )}
                                <Button asChild variant="link">
                                  <Link href={`/reports/studio?periodId=${period.id}&goalId=${row.goalId}`}>
                                    Write
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {selected ? (
            <Card>
              <p className="text-sm font-semibold uppercase tracking-wide text-forest">
                {selected.studentName}
              </p>
              <CardTitle className="mt-1">Period comment</CardTitle>
              <p className="mt-2 text-sm text-muted">{selected.goalSummary}</p>
              <p className="mt-2 text-sm text-muted">
                Data signal is shown as reference only. It does not choose the progress code.
              </p>
              <form action={savePeriodStatementAction} className="mt-4 space-y-3">
                <input type="hidden" name="goalId" value={selected.goalId} />
                <input type="hidden" name="periodId" value={period.id} />
                <input type="hidden" name="studentId" value={selected.studentId} />
                <input
                  type="hidden"
                  name="returnTo"
                  value={`/reports/studio?periodId=${period.id}&goalId=${selected.goalId}`}
                />
                <div>
                  <Label htmlFor="progressCode">Progress code</Label>
                  <Select id="progressCode" name="progressCode" defaultValue={selected.progressCode ?? "SUFFICIENT"}>
                    {PROGRESS_CODES.map((code) => (
                      <option key={code} value={code}>
                        {PROGRESS_CODE_LABELS[code]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="narrative">Period narrative</Label>
                  <Textarea id="narrative" name="narrative" required minLength={10} />
                </div>
                {snippets.length > 0 ? (
                  <p className="text-sm text-muted">
                    District phrases: {snippets.map((snippet) => snippet.label).join(" · ")}. Paste
                    them yourself—this app does not generate student-specific comments.
                  </p>
                ) : null}
                <Button type="submit">Save comment</Button>
              </form>
            </Card>
          ) : null}
          {missing.length > 0 ? (
            <Card>
              <CardTitle>Bulk mark not yet introduced</CardTitle>
              <p className="mt-2 text-sm text-muted">
                Applies only to goals that still have no comment. Type NOT_INTRODUCED to confirm.
              </p>
              <form action={bulkNotIntroducedAction} className="mt-4 space-y-3">
                <input type="hidden" name="periodId" value={period.id} />
                {missing.map((row) => (
                  <input key={row.goalId} type="hidden" name="goalId" value={row.goalId} />
                ))}
                <Label htmlFor="confirm">Confirmation</Label>
                <Input id="confirm" name="confirm" placeholder="NOT_INTRODUCED" required />
                <ConfirmSubmit
                  message="Mark every missing comment as not yet introduced?"
                  label="Mark missing goals not yet introduced"
                />
              </form>
            </Card>
          ) : null}
          <Card>
            <CardTitle>Snippet library</CardTitle>
            <p className="mt-2 text-sm text-muted">
              Staff-authored phrases for this school. Not generated per student.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {snippets.map((snippet) => (
                <li key={snippet.id} className="rounded-lg border border-border p-3">
                  <p className="font-semibold">{snippet.label}</p>
                  <p className="mt-1">{snippet.body}</p>
                </li>
              ))}
            </ul>
            <form action={addReportSnippetAction} className="mt-4 space-y-3">
              <input type="hidden" name="returnTo" value={`/reports/studio?periodId=${period.id}`} />
              <Label htmlFor="label">Snippet name</Label>
              <Input id="label" name="label" required minLength={2} />
              <Label htmlFor="body">Phrase</Label>
              <Textarea id="body" name="body" required minLength={10} />
              <Button type="submit" variant="secondary">
                Save snippet
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}

function groupStudioRows<T extends { studentId: string; studentName: string }>(rows: T[]) {
  const groups: { studentId: string; studentName: string; goals: T[] }[] = [];
  const index = new Map<string, number>();
  for (const row of rows) {
    const existing = index.get(row.studentId);
    if (existing === undefined) {
      index.set(row.studentId, groups.length);
      groups.push({ studentId: row.studentId, studentName: row.studentName, goals: [row] });
    } else {
      groups[existing]?.goals.push(row);
    }
  }
  return groups;
}
