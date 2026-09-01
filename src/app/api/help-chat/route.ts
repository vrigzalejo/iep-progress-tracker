import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { answerHelpQuestion, parseHelpChatRequest } from "@/lib/help-chat";
import type { Role } from "@/lib/constants";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || !role || !ROLES.includes(role as Role)) {
    return NextResponse.json({ error: "Sign in to use the how-to assistant." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON question." }, { status: 400 });
  }

  const parsed = parseHelpChatRequest(json);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await answerHelpQuestion(parsed.question, role as Role, parsed.history);
  return NextResponse.json({
    text: result.text,
    hrefs: result.hrefs,
    refused: result.refused,
  });
}
