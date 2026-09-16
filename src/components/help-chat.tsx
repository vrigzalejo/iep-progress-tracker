"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Plus, Send, Square, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { setFamilyLocaleAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { type Role } from "@/lib/constants";
import type { FamilyLocale } from "@/lib/family-locale";
import {
  clipHelpHistory,
  helpArrivedHint,
  helpHrefLabel,
  helpPageLabel,
  helpWelcome,
  isFamilySpanishHelp,
  parseHelpSseBlock,
  promptFromHelpCloser,
  resolveHelpQuestion,
  shortenHelpPrompt,
  suggestedHelpPrompts,
  type HelpStreamEvent,
} from "@/lib/help-chat";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  hrefs?: string[];
  prompts?: string[];
};

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

function HelpRichText({
  text,
  onChoose,
}: {
  text: string;
  onChoose?: (prompt: string) => void;
}) {
  const lines = text.split("\n").filter((line) => line.length > 0);
  const nodes: ReactNode[] = [];
  let steps: string[] = [];

  function flushSteps() {
    if (steps.length === 0) return;
    const items = steps;
    steps = [];
    nodes.push(
      <ol key={`steps-${nodes.length}`} className="list-decimal space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={`${index}-${item.slice(0, 24)}`}>{formatInline(item)}</li>
        ))}
      </ol>,
    );
  }

  for (const line of lines) {
    const step = line.match(/^\d+\.\s+(.*)$/);
    if (step) {
      steps.push(step[1]);
      continue;
    }
    flushSteps();
    const closer = promptFromHelpCloser(line);
    if (closer && onChoose) {
      nodes.push(
        <button
          key={`want-${nodes.length}`}
          type="button"
          className="rounded-full border border-border bg-white px-3 py-1.5 text-left text-sm text-forest hover:bg-paper"
          onClick={() => onChoose(closer)}
        >
          {line.replace(/\*\*/g, "")}
        </button>,
      );
      continue;
    }
    nodes.push(
      <p key={`p-${nodes.length}-${line.slice(0, 24)}`} className="text-sm">
        {formatInline(line)}
      </p>,
    );
  }
  flushSteps();
  return <div className="space-y-2">{nodes}</div>;
}

function ChoiceChips({
  prompts,
  onChoose,
}: {
  prompts: string[];
  onChoose: (prompt: string) => void;
}) {
  if (prompts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="rounded-full border border-border bg-white px-3 py-1.5 text-sm text-forest hover:bg-paper"
          onClick={() => onChoose(prompt)}
        >
          {shortenHelpPrompt(prompt)}
        </button>
      ))}
    </div>
  );
}

export function HelpChat({ role, locale = "en" }: { role: Role; locale?: FamilyLocale }) {
  const titleId = useId();
  const dialogId = useId();
  const inputId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const wasOpen = useRef(false);
  const pathRef = useRef(pathname.split("?")[0] || "/");
  const askedRef = useRef<string[]>([]);
  const page = helpPageLabel(pathname);
  const welcome = helpWelcome(role, pathname);
  const asked = messages.filter((message) => message.role === "user").map((message) => message.content);
  const welcomeChoices = suggestedHelpPrompts(role, pathname, asked);
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const thread: ChatMessage[] = [
    {
      id: "welcome",
      role: "assistant",
      content: welcome,
      prompts: asked.length === 0 ? welcomeChoices : [],
    },
    ...messages,
  ];
  const pathNow = pathname.split("?")[0] || "/";

  useEffect(() => {
    askedRef.current = asked;
  }, [asked]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, welcome, open]);

  useEffect(() => {
    const previous = pathRef.current;
    if (previous === pathNow) return;
    pathRef.current = pathNow;
    if (!open || askedRef.current.length === 0) return;
    const prompts = suggestedHelpPrompts(role, pathNow, askedRef.current);
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: helpArrivedHint(pathNow),
        prompts,
      },
    ]);
  }, [pathNow, open, role]);

  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(question: string) {
    const askedText = question.trim();
    if (!askedText || pending) return;
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setError("");
    setInput("");
    const history = clipHelpHistory(
      messages.map((message) => ({ role: message.role, content: message.content })),
    );
    setPending(true);
    if (role === "PARENT" && locale !== "es") {
      const resolved = resolveHelpQuestion(askedText, history, role, pathname);
      if (isFamilySpanishHelp(resolved) || isFamilySpanishHelp(askedText)) {
        try {
          const formData = new FormData();
          formData.set("locale", "es");
          formData.set("stay", "1");
          await setFamilyLocaleAction(formData);
          router.refresh();
        } catch {
          // Still explain the Español control if the locale save fails.
        }
      }
    }
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: askedText };
    const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages((current) => [...current, userMessage, assistantMessage]);
    let assembled = "";

    function paint(next: string, extras?: { hrefs?: string[]; prompts?: string[] }) {
      assembled = next;
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: next,
                hrefs: extras?.hrefs ?? message.hrefs,
                prompts: extras?.prompts ?? message.prompts,
              }
            : message,
        ),
      );
    }

    try {
      const response = await fetch("/api/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ question: askedText, history, stream: true, pathname }),
        signal: abort.signal,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error || "The how-to assistant could not answer just now.");
        setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
        return;
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.body || !contentType.includes("text/event-stream")) {
        const payload = (await response.json()) as {
          text?: string;
          error?: string;
          hrefs?: string[];
          prompts?: string[];
        };
        if (!payload.text) {
          setError(payload.error || "The how-to assistant could not answer just now.");
          setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
          return;
        }
        paint(payload.text, { hrefs: payload.hrefs, prompts: payload.prompts });
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!abort.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const event = parseHelpSseBlock(frame) as HelpStreamEvent | null;
          if (!event) continue;
          if (event.error) {
            setError(event.error);
            if (!assembled.trim()) {
              setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
            }
            return;
          }
          if (event.delta) paint(assembled + event.delta);
          if (event.done) {
            const extras = { hrefs: event.hrefs, prompts: event.prompts };
            if (event.text && event.text !== assembled) paint(event.text, extras);
            else paint(assembled, extras);
          }
        }
      }
      if (!abort.signal.aborted && !assembled.trim()) {
        setError("The how-to assistant could not answer just now.");
        setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (!assembled.trim()) {
          setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
        }
        return;
      }
      setError("The how-to assistant could not answer just now.");
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id || message.content));
    } finally {
      if (abortRef.current === abort) abortRef.current = null;
      setPending(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setPending(false);
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setError("");
    setInput("");
    setPending(false);
    inputRef.current?.focus();
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
          className="fixed inset-x-0 bottom-0 top-12 z-40 flex flex-col overflow-hidden border-t border-border bg-surface shadow-lg sm:inset-auto sm:bottom-24 sm:right-4 sm:top-auto sm:h-[min(36rem,calc(100vh-7rem))] sm:w-[min(24rem,calc(100vw-2rem))] sm:rounded-xl sm:border"
          aria-labelledby={titleId}
          aria-modal="true"
          aria-busy={pending}
          role="dialog"
        >
          <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-forest-deep px-4 py-3 text-white">
            <h2 id={titleId} className="font-serif text-lg">
              How to use this site
            </h2>
            <div className="flex items-center">
              {asked.length > 0 ? (
                <button
                  type="button"
                  className="rounded-md p-2 hover:bg-white/10"
                  onClick={newChat}
                  aria-label="Start a new how-to chat"
                >
                  <Plus className="h-5 w-5" />
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-md p-2 hover:bg-white/10"
                onClick={() => setOpen(false)}
                aria-label="Close how-to assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>
          <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
            {thread.map((message) => {
              const isLastHelp = message.id === lastAssistant?.id || (message.id === "welcome" && asked.length === 0);
              return (
                <div key={message.id} className="space-y-2">
                  <div
                    className={cn(
                      "max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      message.role === "user" ? "ml-auto bg-forest text-white" : "bg-paper text-ink",
                    )}
                  >
                    {message.role === "assistant" ? (
                      message.content ? (
                        <HelpRichText
                          text={message.content}
                          onChoose={isLastHelp ? (prompt) => void send(prompt) : undefined}
                        />
                      ) : pending ? (
                        <p className="text-muted" aria-live="polite">
                          Typing…
                        </p>
                      ) : null
                    ) : (
                      shortenHelpPrompt(message.content)
                    )}
                  </div>
                  {message.role === "assistant" &&
                  !pending &&
                  isLastHelp &&
                  message.hrefs?.[0] &&
                  message.hrefs[0] !== pathNow &&
                  !pathNow.startsWith(`${message.hrefs[0]}/`) ? (
                    <Link
                      href={message.hrefs[0]}
                      className="inline-flex rounded-full bg-forest px-3 py-1.5 text-sm font-medium text-white hover:bg-forest-deep"
                      onClick={() => setOpen(false)}
                    >
                      Go to {helpHrefLabel(message.hrefs[0])}
                    </Link>
                  ) : null}
                  {message.role === "assistant" && !pending && isLastHelp && message.prompts ? (
                    <ChoiceChips prompts={message.prompts} onChoose={(prompt) => void send(prompt)} />
                  ) : null}
                </div>
              );
            })}
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <form onSubmit={onSubmit} className="border-t border-border p-3">
            <label htmlFor={inputId} className="sr-only">
              Message the how-to assistant
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id={inputId}
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onInputKey}
                rows={1}
                maxLength={600}
                placeholder={asked.length ? "Ask a follow-up" : page ? `Ask about ${page}` : "Ask how to use this site"}
                className="min-h-11 flex-1 resize-none rounded-2xl border border-border bg-white px-3 py-2 text-base text-ink"
              />
              {pending ? (
                <Button type="button" size="icon" variant="secondary" onClick={stop} aria-label="Stop reply">
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              ) : (
                <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message">
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">Explains screens only. Not IEP advice.</p>
          </form>
        </section>
      ) : null}
      <Button
        ref={launcherRef}
        type="button"
        className={cn(
          "fixed right-4 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-40 shadow-md sm:bottom-[max(1rem,env(safe-area-inset-bottom))]",
          open && "max-sm:hidden",
        )}
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
