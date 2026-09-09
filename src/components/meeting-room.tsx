"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { saveMeetingAttendanceAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressChart } from "@/components/progress-chart";
import { ProgressCodeBadge } from "@/components/progress-code-badge";
import { formatDate } from "@/lib/utils";
import type { ProgressCode } from "@/lib/constants";

type RoomGoal = {
  id: string;
  plainLanguageSummary: string;
  officialWording: string;
  unit: string;
  targetValue: number;
  progressCode: ProgressCode | null;
  narrative: string | null;
  present: {
    recordedAt: string;
    score: number;
    notes: string;
  }[];
};

type FamilyMessage = {
  id: string;
  fromName: string;
  createdAt: string;
  body: string;
};

export function MeetingRoom({
  studentId,
  studentName,
  grade,
  school,
  meetingOn,
  goals,
  familyMessages,
  attendance,
  canTakeAttendance = false,
  extraSlots = 2,
}: {
  studentId: string;
  studentName: string;
  grade: string;
  school: string;
  meetingOn: string;
  goals: RoomGoal[];
  familyMessages: FamilyMessage[];
  attendance: { attendeeName: string; present: boolean }[];
  canTakeAttendance?: boolean;
  extraSlots?: number;
}) {
  const slides = useMemo(() => {
    const items: { id: string; title: string; kind: "intro" | "goal" | "messages" | "attendance" }[] = [
      { id: "intro", title: studentName, kind: "intro" },
      ...goals.map((goal) => ({ id: goal.id, title: goal.plainLanguageSummary, kind: "goal" as const })),
      { id: "messages", title: "Family questions", kind: "messages" },
    ];
    if (canTakeAttendance) items.push({ id: "attendance", title: "Attendance", kind: "attendance" });
    return items;
  }, [canTakeAttendance, goals, studentName]);

  const [index, setIndex] = useState(0);
  const current = slides[index] ?? slides[0];
  const goal = current?.kind === "goal" ? goals.find((item) => item.id === current.id) : null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (event.key === "n" || event.key === "N" || event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((value) => Math.min(value + 1, slides.length - 1));
      }
      if (event.key === "p" || event.key === "P" || event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((value) => Math.max(value - 1, 0));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 text-[#f4f0e6] sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p>
          Meeting room · {studentName}
          <span className="sr-only"> Use N and P to move between goals.</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={`/reports/${studentId}/meeting`}>Back to packet</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIndex((value) => Math.max(value - 1, 0))}
            disabled={index === 0}
          >
            Previous (P)
          </Button>
          <Button
            type="button"
            onClick={() => setIndex((value) => Math.min(value + 1, slides.length - 1))}
            disabled={index === slides.length - 1}
          >
            Next (N)
          </Button>
        </div>
      </div>

      <p className="text-sm text-[#d6c89a]" aria-live="polite">
        {index + 1} of {slides.length} · {current?.title}
      </p>

      {current?.kind === "intro" ? (
        <section>
          <h1 className="font-serif text-5xl leading-tight sm:text-6xl">{studentName}</h1>
          <p className="mt-4 text-2xl">
            Grade {grade} · {school}
          </p>
          <p className="mt-8 max-w-3xl text-xl text-[#d6c89a]">
            This view shows session data the team already recorded. It does not suggest a progress
            code, services, or placement.
          </p>
        </section>
      ) : null}

      {goal ? (
        <section className="space-y-5">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{goal.plainLanguageSummary}</h1>
          <p className="text-xl">{goal.officialWording}</p>
          {goal.progressCode ? (
            <div className="text-lg">
              <p className="mb-2 text-[#d6c89a]">Staff-written period code</p>
              <ProgressCodeBadge code={goal.progressCode} />
            </div>
          ) : (
            <p className="text-xl text-[#d6c89a]">No period code is on file yet. Staff write that on the report.</p>
          )}
          {goal.narrative ? <p className="text-xl">{goal.narrative}</p> : null}
          <div>
            <h2 className="text-lg font-semibold text-[#d6c89a]">Last 5 present sessions</h2>
            {goal.present.length === 0 ? (
              <p className="mt-2 text-xl">No present sessions on file.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xl">
                {goal.present.map((entry) => (
                  <li key={entry.recordedAt}>
                    {formatDate(entry.recordedAt)} · {entry.score} {goal.unit}
                    {entry.notes ? ` · ${entry.notes}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl bg-[#f4f0e6] p-4 text-ink">
            <ProgressChart
              entries={goal.present.map((entry) => ({
                recordedAt: entry.recordedAt,
                score: entry.score,
                sessionOutcome: "PRESENT",
              }))}
              targetValue={goal.targetValue}
              unit={goal.unit}
            />
          </div>
        </section>
      ) : null}

      {current?.kind === "messages" ? (
        <section>
          <h1 className="font-serif text-4xl">Family questions on file</h1>
          {familyMessages.length === 0 ? (
            <p className="mt-4 text-xl">No family messages yet.</p>
          ) : (
            <ul className="mt-6 space-y-4 text-xl">
              {familyMessages.map((message) => (
                <li key={message.id}>
                  <p className="text-[#d6c89a]">
                    {message.fromName} · {formatDate(message.createdAt)}
                  </p>
                  <p className="mt-1">{message.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {current?.kind === "attendance" ? (
        <section>
          <h1 className="font-serif text-4xl">Who is in the room</h1>
          <p className="mt-3 text-xl text-[#d6c89a]">Names only. This is not a recommendation list.</p>
          <form action={saveMeetingAttendanceAction} className="mt-6 space-y-4 text-ink">
            <input type="hidden" name="studentId" value={studentId} />
            <input type="hidden" name="returnTo" value={`/reports/${studentId}/meeting/room?meetingOn=${meetingOn}`} />
            <div>
              <Label htmlFor="meetingOn" className="text-[#f4f0e6]">
                Meeting date
              </Label>
              <Input id="meetingOn" name="meetingOn" type="date" defaultValue={meetingOn} required />
            </div>
            <ul className="space-y-2">
              {attendance.map((row) => (
                <li key={row.attendeeName} className="flex items-center gap-3 rounded-lg bg-[#f4f0e6] px-3 py-2">
                  <input type="hidden" name="attendeeName" value={row.attendeeName} />
                  <input
                    id={`present-${row.attendeeName}`}
                    type="checkbox"
                    name="present"
                    value={row.attendeeName}
                    defaultChecked={row.present}
                    className="h-5 w-5"
                  />
                  <label htmlFor={`present-${row.attendeeName}`} className="text-lg">
                    {row.attendeeName}
                  </label>
                </li>
              ))}
              {Array.from({ length: extraSlots }, (_, slot) => (
                <ExtraAttendeeRow key={`extra-${slot}`} slot={slot} />
              ))}
            </ul>
            <Button type="submit">Save attendance</Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function ExtraAttendeeRow({ slot }: { slot: number }) {
  const [name, setName] = useState("");
  return (
    <li className="flex items-center gap-3 rounded-lg bg-[#f4f0e6] px-3 py-2">
      <input type="hidden" name="attendeeName" value={name} />
      <input
        aria-label={`Additional attendee ${slot + 1}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="min-h-11 flex-1 rounded-md border border-border px-3"
        placeholder="Add a name"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="present" value={name} disabled={!name.trim()} className="h-5 w-5" />
        Present
      </label>
    </li>
  );
}
