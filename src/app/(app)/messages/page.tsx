import Link from "next/link";
import { requireUser, listMessageThreads, listVisibleStudents } from "@/lib/queries";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { isStaff } from "@/lib/permissions";
import { MESSAGE_VISIBILITY_LABELS, type MessageVisibility } from "@/lib/constants";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser();
  const threads = await listMessageThreads(user);
  const students = await listVisibleStudents(user);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-serif text-3xl">Messages</h1>
      <p className="text-muted">
        One thread per student.
        {isStaff(user.role)
          ? " Staff-only notes never appear in the family portal. Opening a thread marks it read and can email assigned staff when a family writes."
          : " You only see the family thread."}
      </p>
      {threads.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => (
            <li key={thread.studentId}>
              <Card>
                <CardTitle className="flex items-center justify-between gap-3 text-lg">
                  <Link href={`/messages/${thread.studentId}`} className="hover:underline">
                    {thread.studentName}
                  </Link>
                  {thread.unread > 0 ? <Badge tone="gold">{thread.unread} unread</Badge> : null}
                </CardTitle>
                <p className="mt-1 text-xs text-muted">
                  {thread.latest.fromUser.name} · {formatDate(thread.latest.createdAt)}
                </p>
                {isStaff(user.role) ? (
                  <Badge tone={thread.latest.visibility === "STAFF" ? "gold" : "forest"} className="mt-2">
                    {MESSAGE_VISIBILITY_LABELS[thread.latest.visibility as MessageVisibility]}
                  </Badge>
                ) : null}
                <p className="mt-2 line-clamp-3">{thread.latest.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {students.length > 0 && threads.length < students.length ? (
        <p className="text-sm text-muted">
          Start a thread from a{" "}
          <Link href="/students" className="underline">
            student profile
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
