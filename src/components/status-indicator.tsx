import { SIGNAL_HINTS, SIGNAL_LABELS, type DataSignal } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONES: Record<DataSignal, "forest" | "sky" | "terracotta" | "gold"> = {
  GOAL_MET: "forest",
  ON_TRACK: "sky",
  NEEDS_ATTENTION: "terracotta",
  NEEDS_DATA: "gold",
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
  const badge = (
    <Badge tone={TONES[signal]} className={className}>
      {SIGNAL_LABELS[signal]}
    </Badge>
  );
  if (!showHint) return badge;
  return (
    <div className={cn("space-y-1")}>
      {badge}
      <p className="max-w-xs text-sm text-muted">{SIGNAL_HINTS[signal]}</p>
    </div>
  );
}
