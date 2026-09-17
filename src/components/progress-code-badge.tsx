import {
  PROGRESS_CODE_HINTS,
  PROGRESS_CODE_LABELS,
  type ProgressCode,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

const TONES: Record<ProgressCode, "forest" | "terracotta" | "sky" | "gold"> = {
  SUFFICIENT: "forest",
  INSUFFICIENT: "terracotta",
  GOAL_MET: "sky",
  NOT_INTRODUCED: "gold",
};

export function ProgressCodeBadge({
  code,
  showHint = false,
}: {
  code: ProgressCode;
  showHint?: boolean;
}) {
  const badge = <Badge tone={TONES[code]}>{PROGRESS_CODE_LABELS[code]}</Badge>;
  if (!showHint) return badge;
  return (
    <div className="space-y-1">
      {badge}
      <p className="text-sm text-muted">{PROGRESS_CODE_HINTS[code]}</p>
    </div>
  );
}
