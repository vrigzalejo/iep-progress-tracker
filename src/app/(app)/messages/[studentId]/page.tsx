import Link from "next/link";
import { MessageThread } from "@/components/message-thread";
import { Alert, FormError } from "@/components/ui/alert";
import { requireUser, getStudentDetail, markStudentMessagesRead } from "@/lib/queries";
import { isStaff } from "@/lib/permissions";

export const metadata = { title: "Message thread" };

export default async function MessageThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { studentId } = await params;
  const query = await searchParams;
  const student = await getStudentDetail(user, studentId);
  await markStudentMessagesRead(user, student.id);
  const staff = isStaff(user.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24 sm:pb-0">
      <p className="text-sm">
        <Link href="/messages" className="font-semibold text-forest hover:underline">
          ← Messages
        </Link>
      </p>
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-forest">Messages</p>
        <h1 className="font-serif text-3xl">{student.preferredName}</h1>
        <p className="mt-1 text-muted">
          {staff
            ? "Unread notes are marked read when you open this page. Staff-only notes never appear for families."
            : "You only see the family thread. Staff-only notes never appear here."}
        </p>
      </header>
      {query.saved ? (
        <Alert title="Message sent" tone="success">
          {staff
            ? "Assigned staff and, if you chose the family thread, linked guardians can read it."
            : "The team can read it on the family thread."}
        </Alert>
      ) : null}
      <FormError error={query.error} />
      <MessageThread
        messages={student.messages}
        currentUserId={user.id}
        studentId={student.id}
        returnTo={`/messages/${student.id}`}
        isStaffUser={staff}
      />
    </div>
  );
}
