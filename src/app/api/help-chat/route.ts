import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  answerHelpQuestion,
  encodeHelpSse,
  parseHelpChatRequest,
  streamHelpAnswer,
} from "@/lib/help-chat";
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

  const wantsStream =
    (json && typeof json === "object" && "stream" in json && (json as { stream?: unknown }).stream === true) ||
    (request.headers.get("accept") ?? "").includes("text/event-stream");

  if (!wantsStream) {
    const result = await answerHelpQuestion(parsed.question, role as Role, parsed.history, parsed.pathname);
    return NextResponse.json({
      text: result.text,
      hrefs: result.hrefs,
      prompts: result.prompts,
      refused: result.refused,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamHelpAnswer(
          parsed.question,
          role as Role,
          parsed.history,
          parsed.pathname,
        )) {
          controller.enqueue(encoder.encode(encodeHelpSse(event)));
        }
      } catch {
        controller.enqueue(
          encoder.encode(
            encodeHelpSse({ error: "The how-to assistant could not answer just now.", done: true }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
