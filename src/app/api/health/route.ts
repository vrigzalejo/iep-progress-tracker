import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evidenceBackend } from "@/lib/evidence-storage";
import { isDemoMode } from "@/lib/runtime";
import { isCredentialsSignInEnabled } from "@/lib/sso";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      demo: isDemoMode(),
      evidence: evidenceBackend(),
      credentials: isCredentialsSignInEnabled(),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
