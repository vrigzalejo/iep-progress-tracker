import { NextResponse } from "next/server";
import { progressSchema, trialSchema } from "@/lib/validation";
import { requireStaff, assertStudentAccess } from "@/lib/queries";
import { recordProgressEntry } from "@/lib/record-progress";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireStaff();
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Check the session." },
        { status: 400 },
      );
    }
    const goal = await prisma.iepGoal.findUnique({
      where: { id: parsed.data.goalId },
      select: { studentId: true },
    });
    if (!goal) return NextResponse.json({ ok: false, error: "Goal not found." }, { status: 404 });
    await assertStudentAccess(user, goal.studentId);
    let trials: { result: string; promptLevel: string }[] = [];
    if (parsed.data.trialsJson) {
      const result = trialSchema.array().safeParse(JSON.parse(parsed.data.trialsJson));
      if (result.success) trials = result.data;
    }
    const saved = await recordProgressEntry({ user, data: parsed.data, trials });
    if ("error" in saved) {
      return NextResponse.json({ ok: false, error: saved.error }, { status: 400 });
    }
    revalidatePath("/today");
    revalidatePath("/minutes");
    revalidatePath(`/goals/${saved.goal.id}`);
    return NextResponse.json({ ok: true, entryId: saved.entry.id, studentId: saved.goal.studentId });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save the session." }, { status: 401 });
  }
}
