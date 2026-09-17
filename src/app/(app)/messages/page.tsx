import Link from "next/link";
import { requireUser, listMessageThreads } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { isStaff } from "@/lib/permissions";
import { MESSAGE_VISIBILITY_LABELS } from "@/lib/constants";
import { nameInitial } from "@/lib/message-thread";
import { cn, formatDate, formatTime } from "@/lib/utils";

export const metadata = { title: "Messages" };

function inboxStamp(value: Date) {
  const now = new Date();
  const sameDay =
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate();
  return sameDay ? formatTime(value) : formatDate(value);
}

export default async function MessagesPage() {
  const user = await requireUser();
  const threads = await listMessageThreads(user);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24 sm:pb-0">
      <header>
        <h1 className="font-serif text-3xl">Messages</h1>
        <p className="mt-2 text-muted">
          One thread per student.
          {isStaff(user.role)
            ? " Staff-only notes never appear in the family portal. Opening a thread marks it read."
            : " You only see the family thread."}
        </p>
      </header>
      {threads.length === 0 ? (
        <p>No students are available to message.</p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          {threads.map((thread) => {
            const preview = thread.latest?.body ?? "No messages yet — start the thread.";
            const when = thread.latest
              ? inboxStamp(thread.latest.createdAt)
              : null;
            return (
              <li key={thread.studentId} className="border-b border-border last:border-b-0">
                <Link
                  href={`/messages/${thread.studentId}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-paper"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                      thread.unread > 0 ? "bg-forest text-white" : "bg-[#e6f1ec] text-forest",
                    )}
                    aria-hidden="true"
                  >
                    {nameInitial(thread.studentName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className={cn("truncate", thread.unread > 0 ? "font-semibold" : "font-medium")}>
                        {thread.studentName}
                      </p>
                      {when ? <p className="shrink-0 text-xs text-muted">{when}</p> : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {thread.latest ? (
                        <>
                          {thread.latest.fromUser.name}: {preview}
                        </>
                      ) : (
                        preview
                      )}
                    </p>
                    {isStaff(user.role) && thread.latest?.visibility === "STAFF" ? (
                      <Badge tone="gold" className="mt-2">
                        {MESSAGE_VISIBILITY_LABELS.STAFF}
                      </Badge>
                    ) : null}
                  </div>
                  {thread.unread > 0 ? <Badge tone="gold">{thread.unread} unread</Badge> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
