import { requireUser, getStudentDetail, listMeetingAttendance } from "@/lib/queries";
import { MeetingRoom } from "@/components/meeting-room";
import { meetingOnParam, uniqueAttendeeNames, utcMeetingOn } from "@/lib/meeting";
import { isStaff } from "@/lib/permissions";
import type { ProgressCode } from "@/lib/constants";

export const metadata = { title: "IEP meeting room" };

export default async function MeetingRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ meetingOn?: string }>;
}) {
  const user = await requireUser();
  const { studentId } = await params;
  const { meetingOn: meetingOnRaw } = await searchParams;
  const student = await getStudentDetail(user, studentId);
  const meetingOn = utcMeetingOn(meetingOnRaw);
  const saved = isStaff(user.role)
    ? await listMeetingAttendance(user, studentId, meetingOn)
    : [];
  const suggested = uniqueAttendeeNames([
    student.caseManager.name,
    ...student.providers.map((link) => link.user.name),
    ...student.guardians.map((guardian) => guardian.name),
    ...saved.map((row) => row.attendeeName),
  ]);
  const attendance = suggested.map((name) => ({
    attendeeName: name,
    present: saved.find((row) => row.attendeeName === name)?.present ?? false,
  }));

  return (
    <MeetingRoom
      studentId={student.id}
      studentName={student.preferredName}
      grade={student.grade}
      school={student.school}
      meetingOn={meetingOnParam(meetingOn)}
      canTakeAttendance={isStaff(user.role)}
      attendance={attendance}
      familyMessages={student.messages
        .filter((message) => message.visibility === "FAMILY")
        .slice(-8)
        .map((message) => ({
          id: message.id,
          fromName: message.fromUser.name,
          createdAt: message.createdAt.toISOString(),
          body: message.body,
        }))}
      goals={student.goals.map((goal) => {
        const statement = goal.periodStatements[0];
        return {
          id: goal.id,
          plainLanguageSummary: goal.plainLanguageSummary,
          officialWording: goal.officialWording,
          unit: goal.unit,
          targetValue: goal.targetValue,
          progressCode: (statement?.progressCode as ProgressCode | undefined) ?? null,
          narrative: statement?.narrative ?? null,
          present: goal.entries
            .filter((entry) => entry.sessionOutcome === "PRESENT")
            .slice(-5)
            .map((entry) => ({
              recordedAt: entry.recordedAt.toISOString(),
              score: entry.score,
              notes: entry.notes,
            })),
        };
      })}
    />
  );
}
