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

const STAFF_PROMPTS = [
  "How do I log a session?",
  "Where do I write a progress report?",
  "Who can see student records?",
  "How does search work?",
];

const FAMILY_PROMPTS = [
  "What can I see in the family portal?",
  "How do I message the team?",
  "How do I switch between children?",
];

function HelpRichText({ text }: { text: string }) {
  const blocks = text.split("\n").filter((line) => line.length > 0);
  return (
    <div className="space-y-2">
      {blocks.map((line, index) => (
        <p key={`${index}-${line.slice(0, 24)}`}>{linkify(line)}</p>
      ))}
    </div>
  );
}

function linkify(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
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

export function HelpChat({ role }: { role: Role }) {
  const titleId = useId();
  const dialogId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `I can explain how to use this site as a ${ROLE_LABELS[role]}. Ask about screens, roles, or the usual workflow. I will not write IEP goals or interpret a student's record.`,
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prompts = role === "PARENT" ? FAMILY_PROMPTS : STAFF_PROMPTS;

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
          className="fixed bottom-20 right-4 z-40 flex h-[min(32rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
          aria-labelledby={titleId}
          aria-modal="true"
          role="dialog"
        >
          <header className="flex items-start justify-between gap-3 border-b border-border bg-forest-deep px-4 py-3 text-white">
            <div>
              <h2 id={titleId} className="font-serif text-lg">
                How to use this site
              </h2>
              <p className="text-sm text-white/80">Answers from the product guide. Not IEP advice.</p>
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
            {messages.length < 3 ? (
              <div className="flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-border bg-white px-3 py-1 text-left text-sm text-forest hover:bg-paper"
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
                placeholder="Ask how a screen works"
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
        className="fixed bottom-4 right-4 z-40 shadow-md"
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
