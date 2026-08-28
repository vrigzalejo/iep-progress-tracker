import {
  PROGRESS_CODE_HINTS,
  PROGRESS_CODE_LABELS,
  type ProgressCode,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const TONES: Record<ProgressCode, string> = {
  SUFFICIENT: "bg-[#e6f1ec] text-forest-deep border-[#b7d2c6]",
  INSUFFICIENT: "bg-[#f6e6dc] text-terracotta border-[#e4c1ae]",
  GOAL_MET: "bg-[#e4eef4] text-sky border-[#bcd3e0]",
  NOT_INTRODUCED: "bg-[#f7efd6] text-gold border-[#e2d19a]",
};

export function ProgressCodeBadge({
  code,
  showHint = false,
}: {
  code: ProgressCode;
  showHint?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", TONES[code])}>
        {PROGRESS_CODE_LABELS[code]}
      </span>
      {showHint ? <p className="text-sm text-muted">{PROGRESS_CODE_HINTS[code]}</p> : null}
    </div>
  );
}
