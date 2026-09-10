"use client";

import Link from "next/link";
import { Bot, Send, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { clipHelpHistory } from "@/lib/help-chat";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const ADMIN_PROMPTS = [
  "What can this app do?",
  "How do I add a school campus?",
  "How do I invite someone by email?",
  "How do I reset a forgotten password?",
  "How do I open the evidence gallery?",
  "How do I filter search by service area?",
  "How do I open meeting room on the projector?",
  "How does the Friday family email work?",
];

const STAFF_PROMPTS = [
  "What can this app do?",
  "How do I add a student profile?",
  "How do I record an IEP goal?",
  "How do I log a session with trials?",
  "How do I open the evidence gallery?",
  "How do I filter search by service area?",
  "How do I print a meeting packet?",
  "How do I reset a forgotten password?",
];

const FAMILY_PROMPTS = [
  "What can I see in the family portal?",
  "How do I switch the site to Spanish?",
  "How do I open home practice cards?",
  "How do I message the team?",
  "How do I switch between children?",
  "How do I opt in to the weekly email digest?",
  "How do I install the app on my phone?",
  "How do I acknowledge the privacy notice?",
];

function formatInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) return <span key={index}>{part}</span>;
    const href = match[2];
    if (!href.startsWith("/") || href.startsWith("//")) {
      return <span key={index}>{match[1]}</span>;
    }
    return (
      <Link key={index} href={href} className="font-semibold text-forest underline">
        {match[1]}
      </Link>
    );
  });
}

function HelpRichText({ text }: { text: string }) {
  const blocks = text.split("\n").filter((line) => line.length > 0);
  return (
    <div className="space-y-2">
      {blocks.map((line, index) => (
        <p key={`${index}-${line.slice(0, 24)}`}>{formatInline(line)}</p>
      ))}
    </div>
  );
}

export function HelpChat({ role }: { role: Role }) {
  const titleId = useId();
  const dialogId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const welcome =
    role === "PARENT"
      ? `Start on Family home: switch English/Español, shared goals, progress report, meeting packet, home practice cards, optional Friday weekly email (off by default), messages, and Privacy. On a phone, Add to Home Screen. Ask “what can this app do?” for the full map. I will not write IEP goals or interpret a student’s record.`
      : role === "ADMINISTRATOR"
        ? `The six-step tutorial is on Setup guide: Privacy, Team and Schools (invite with a set-password link if mail is on), add a student, record goals as written (optional Spanish summary you type), log on Today or Hallway (next student after save; evidence gallery on the profile), then report studio, Meeting room, or File PDF. Forgot password is on the sign-in screen. Families who opt in get a Friday email—staff do not click send. Ask “what can this app do?” for every screen. I will not write IEP goals or interpret a student’s record.`
        : `The six-step tutorial is on Setup guide: Privacy, roles, add a student, record goals as written (optional Spanish summary you type), log on Today or Hallway (next student after save; evidence gallery on the profile), then report studio, Meeting room, or File PDF. Forgot password is on the sign-in screen. Families who opt in get a Friday email of scores and home carryover—staff do not click send. Ask “what can this app do?” for every ${ROLE_LABELS[role]} screen. I will not write IEP goals or interpret a student’s record.`;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcome,
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prompts =
    role === "PARENT" ? FAMILY_PROMPTS : role === "ADMINISTRATOR" ? ADMIN_PROMPTS : STAFF_PROMPTS;
  const userTurns = messages.filter((message) => message.role === "user").length;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(question: string) {
    const asked = question.trim();
    if (!asked || pending) return;
    setError("");
    setInput("");
    const history = clipHelpHistory(
      messages
        .filter((message) => message.id !== "welcome")
        .map((message) => ({ role: message.role, content: message.content })),
    );
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: asked };
    setMessages((current) => [...current, userMessage]);
    setPending(true);
    try {
      const response = await fetch("/api/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: asked, history }),
      });
      const payload = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !payload.text) {
        setError(payload.error || "The how-to assistant could not answer just now.");
        return;
      }
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: payload.text! },
      ]);
    } catch {
      setError("The how-to assistant could not answer just now.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function onInputKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(input);
    }
  }

  return (
    <div className="no-print">
      {open ? (
        <section
          id={dialogId}
          className="fixed inset-x-0 bottom-0 top-12 z-40 flex flex-col overflow-hidden border-t border-border bg-surface shadow-lg sm:inset-auto sm:bottom-24 sm:right-4 sm:top-auto sm:h-[min(32rem,calc(100vh-7rem))] sm:w-[min(24rem,calc(100vw-2rem))] sm:rounded-xl sm:border"
          aria-labelledby={titleId}
          aria-modal="true"
          role="dialog"
        >
          <header className="flex items-start justify-between gap-3 border-b border-border bg-forest-deep px-4 py-3 text-white">
            <div>
              <h2 id={titleId} className="font-serif text-lg">
                How to use this site
              </h2>
              <p className="text-sm text-white/80">Detailed how-tos for every screen. Not IEP advice.</p>
            </div>
            <button
              type="button"
              className="rounded-md p-2 hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Close how-to assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[95%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user" ? "ml-auto bg-forest text-white" : "bg-paper text-ink",
                )}
              >
                {message.role === "assistant" ? <HelpRichText text={message.content} /> : message.content}
              </div>
            ))}
            {pending ? <p className="text-sm text-muted">Looking that up…</p> : null}
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            {userTurns < 2 ? (
              <div className="flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="max-w-full rounded-full border border-border bg-white px-3 py-1 text-left text-sm text-forest hover:bg-paper"
                    onClick={() => void send(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <form onSubmit={onSubmit} className="border-t border-border p-3">
            <label htmlFor={inputId} className="sr-only">
              Question about using the site
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id={inputId}
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onInputKey}
                rows={2}
                maxLength={600}
                placeholder="Ask about any screen or feature"
                className="min-h-11 flex-1 resize-none rounded-md border border-border bg-white px-3 py-2 text-base text-ink"
              />
              <Button type="submit" size="icon" disabled={pending || !input.trim()} aria-label="Send question">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>
      ) : null}
      <Button
        type="button"
        className="fixed right-4 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-40 shadow-md sm:bottom-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        <Bot className="h-4 w-4" />
        {open ? "Hide help" : "How to use this site"}
      </Button>
    </div>
  );
}
