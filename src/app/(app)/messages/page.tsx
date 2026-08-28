import Link from "next/link";
import { requireUser, listVisibleStudents } from "@/lib/queries";
import { Card, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/db";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser();
  const students = await listVisibleStudents(user);
  const messages = await prisma.message.findMany({
    where: { studentId: { in: students.map((student) => student.id) } },
    include: {
      fromUser: { select: { name: true } },
      student: { select: { preferredName: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-serif text-3xl">Messages</h1>
      <p className="text-muted">Conversations stay attached to a student record.</p>
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li key={message.id}>
              <Card>
                <CardTitle className="text-lg">
                  <Link href={`/students/${message.student.id}`} className="hover:underline">
                    {message.student.preferredName}
                  </Link>
                </CardTitle>
                <p className="mt-1 text-xs text-muted">
                  {message.fromUser.name} · {formatDate(message.createdAt)}
                </p>
                <p className="mt-2">{message.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
