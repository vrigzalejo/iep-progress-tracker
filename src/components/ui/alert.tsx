import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Alert({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children?: ReactNode;
  tone?: "info" | "warning" | "success" | "danger";
}) {
  const tones = {
    info: "border-sky bg-[#eef5f8] text-sky",
    warning: "border-gold bg-[#fbf6e8] text-gold",
    success: "border-forest bg-[#eef6f2] text-forest-deep",
    danger: "border-danger bg-[#fbecee] text-danger",
  };
  return (
    <div className={cn("rounded-lg border px-4 py-3", tones[tone])} role="status">
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1 text-sm text-ink">{children}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white px-6 py-10 text-center">
      <h2 className="font-serif text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-muted">{children}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <Alert title="Please check this form" tone="danger">
      {error}
    </Alert>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-[#e6e1d6]", className)} />;
}
