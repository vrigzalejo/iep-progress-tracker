import { AlertTriangle, CheckCircle2, CircleDashed, TrendingUp } from "lucide-react";
import { SIGNAL_HINTS, SIGNAL_LABELS, type DataSignal } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<DataSignal, typeof CheckCircle2> = {
  GOAL_MET: CheckCircle2,
  ON_TRACK: TrendingUp,
  NEEDS_ATTENTION: AlertTriangle,
  NEEDS_DATA: CircleDashed,
};

const TONES: Record<DataSignal, string> = {
  GOAL_MET: "bg-[#e6f1ec] text-forest-deep border-[#b7d2c6]",
  ON_TRACK: "bg-[#e4eef4] text-sky border-[#bcd3e0]",
  NEEDS_ATTENTION: "bg-[#f6e6dc] text-terracotta border-[#e4c1ae]",
  NEEDS_DATA: "bg-[#f7efd6] text-gold border-[#e2d19a]",
};

export function StatusIndicator({
  signal,
  showHint = false,
  className,
}: {
  signal: DataSignal;
  showHint?: boolean;
  className?: string;
}) {
  const Icon = ICONS[signal];
  return (
    <div className={cn("space-y-1", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
          TONES[signal],
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {SIGNAL_LABELS[signal]}
      </span>
      {showHint ? <p className="text-sm text-muted">{SIGNAL_HINTS[signal]}</p> : null}
    </div>
  );
}
