import Link from "next/link";
import { sendMessageAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { requireUser, getStudentDetail, markStudentMessagesRead } from "@/lib/queries";
import { isStaff } from "@/lib/permissions";
import { MESSAGE_VISIBILITY_LABELS, type MessageVisibility } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Message thread" };

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await requireUser();
  const { studentId } = await params;
  const student = await getStudentDetail(user, studentId);
  await markStudentMessagesRead(user, student.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm">
        <Link href="/messages" className="text-forest hover:underline">
          ← Messages
        </Link>
      </p>
      <h1 className="font-serif text-3xl">Thread for {student.preferredName}</h1>
      <p className="text-muted">
        Unread notes are marked read when you open this page. Staff-only notes never appear for
        families.
      </p>
      <Card>
        <CardTitle>Conversation</CardTitle>
        <ul className="mt-4 space-y-3">
          {student.messages.map((message) => (
            <li key={message.id} className="rounded-lg bg-paper px-3 py-2">
              <p className="text-xs text-muted">
                {message.fromUser.name} · {formatDate(message.createdAt)}
                {isStaff(user.role) ? (
                  <>
                    {" "}
                    · {MESSAGE_VISIBILITY_LABELS[message.visibility as MessageVisibility]}
                  </>
                ) : null}
              </p>
              <p>{message.body}</p>
            </li>
          ))}
          {student.messages.length === 0 ? (
            <li className="text-sm text-muted">No messages yet.</li>
          ) : null}
        </ul>
        <form action={sendMessageAction} className="mt-4 space-y-3">
          <input type="hidden" name="studentId" value={student.id} />
          <input type="hidden" name="returnTo" value={`/messages/${student.id}`} />
          <Label htmlFor="body">Write a message</Label>
          <Textarea id="body" name="body" required maxLength={2000} />
          {isStaff(user.role) ? (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Who can see this</legend>
              <label className="flex min-h-11 items-center gap-2">
                <input type="radio" name="visibility" value="FAMILY" defaultChecked className="h-4 w-4" />
                Family thread
              </label>
              <label className="flex min-h-11 items-center gap-2">
                <input type="radio" name="visibility" value="STAFF" className="h-4 w-4" />
                Staff only
              </label>
            </fieldset>
          ) : null}
          <Button type="submit">Send message</Button>
        </form>
      </Card>
    </div>
  );
}
