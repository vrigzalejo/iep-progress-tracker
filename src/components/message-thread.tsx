import { sendMessageAction } from "@/app/actions";
import { ThreadScroller } from "@/components/thread-scroller";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { MESSAGE_VISIBILITY_LABELS } from "@/lib/constants";
import type { FamilyLocale } from "@/lib/family-locale";
import { groupMessagesByDay, type ThreadMessage } from "@/lib/message-thread";
import { cn, formatThreadDay, formatTime } from "@/lib/utils";

type ThreadCopy = {
  you: string;
  empty: string;
  write: string;
  placeholder: string;
  send: string;
  who: string;
  familyHint: string;
  staffHint: string;
  today: string;
  yesterday: string;
};

const COPY: Record<FamilyLocale, ThreadCopy> = {
  en: {
    you: "You",
    empty: "No messages yet. Keep notes short and about this student only.",
    write: "Write a message",
    placeholder: "A short update the family or team can use.",
    send: "Send",
    who: "Who can see this",
    familyHint: "Linked guardians can read this.",
    staffHint: "Not shown in the family portal.",
    today: "Today",
    yesterday: "Yesterday",
  },
  es: {
    you: "Usted",
    empty: "Todavía no hay mensajes. Escriba notas cortas y solo sobre este niño.",
    write: "Escribir al equipo",
    placeholder: "Una nota corta que el equipo pueda usar.",
    send: "Enviar",
    who: "Quién puede ver esto",
    familyHint: "Los tutores vinculados pueden leer esto.",
    staffHint: "No aparece en el portal familiar.",
    today: "Hoy",
    yesterday: "Ayer",
  },
} as const;

export function MessageThread({
  messages,
  currentUserId,
  studentId,
  returnTo,
  isStaffUser,
  locale = "en",
  compact = false,
  composerId = "message-body",
  labels,
}: {
  messages: ThreadMessage[];
  currentUserId: string;
  studentId: string;
  returnTo: string;
  isStaffUser: boolean;
  locale?: FamilyLocale;
  compact?: boolean;
  composerId?: string;
  labels?: Partial<ThreadCopy>;
}) {
  const copy = { ...COPY[locale], ...labels };
  const groups = groupMessagesByDay(messages);

  return (
    <div className="flex flex-col">
      <ThreadScroller
        resetKey={`${messages.length}-${messages.at(-1)?.id ?? "empty"}`}
        className={cn(
          "rounded-xl border border-border bg-paper/60 px-3 py-4",
          compact ? "max-h-72" : "max-h-[min(24rem,46vh)] min-h-56",
        )}
      >
        {messages.length === 0 ? (
          <p className="px-2 text-sm text-muted">{copy.empty}</p>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => {
              const first = group.items[0];
              if (!first) return null;
              return (
              <section key={group.key} className="space-y-3">
                <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
                  {formatThreadDay(first.createdAt, copy, locale)}
                </p>
                <ul className="space-y-3">
                  {group.items.map((message) => {
                    const mine = message.fromUser.id === currentUserId;
                    const staffOnly = message.visibility === "STAFF";
                    return (
                      <li
                        key={message.id}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[min(100%,28rem)] rounded-2xl px-3 py-2 shadow-sm",
                            mine && !staffOnly && "bg-forest text-white",
                            mine && staffOnly && "bg-forest-deep text-white",
                            !mine && !staffOnly && "border border-border bg-white text-ink",
                            !mine && staffOnly && "border border-[#e2d19a] bg-[#f7efd6] text-ink",
                          )}
                        >
                          <p
                            className={cn(
                              "text-xs font-semibold",
                              mine ? "text-white" : "text-muted",
                            )}
                          >
                            {mine ? copy.you : message.fromUser.name}
                            {isStaffUser && staffOnly ? ` · ${MESSAGE_VISIBILITY_LABELS.STAFF}` : ""}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
                          <p className={cn("mt-1 text-[11px]", mine ? "text-white/70" : "text-muted")}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
              );
            })}
          </div>
        )}
      </ThreadScroller>

      <form action={sendMessageAction} className="mt-4 space-y-3">
        <input type="hidden" name="studentId" value={studentId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <Label htmlFor={composerId}>{copy.write}</Label>
        <Textarea
          id={composerId}
          name="body"
          required
          maxLength={2000}
          rows={3}
          className="min-h-24"
          placeholder={copy.placeholder}
        />
        {isStaffUser ? (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{copy.who}</legend>
            <div className="flex flex-wrap gap-2">
              <label className="relative flex min-h-11 cursor-pointer items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold shadow-sm has-[:checked]:border-forest has-[:checked]:bg-forest has-[:checked]:text-white">
                <input
                  type="radio"
                  name="visibility"
                  value="FAMILY"
                  defaultChecked
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {MESSAGE_VISIBILITY_LABELS.FAMILY}
              </label>
              <label className="relative flex min-h-11 cursor-pointer items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold shadow-sm has-[:checked]:border-[#e2d19a] has-[:checked]:bg-[#f7efd6] has-[:checked]:text-gold">
                <input type="radio" name="visibility" value="STAFF" className="absolute inset-0 cursor-pointer opacity-0" />
                {MESSAGE_VISIBILITY_LABELS.STAFF}
              </label>
            </div>
            <p className="mt-2 text-xs text-muted">
              {copy.familyHint} {copy.staffHint}
            </p>
          </fieldset>
        ) : null}
        <Button type="submit">{copy.send}</Button>
      </form>
    </div>
  );
}
