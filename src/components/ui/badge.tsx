import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & {
  tone?: "neutral" | "forest" | "gold" | "terracotta" | "sky";
}) {
  const tones = {
    neutral: "bg-paper text-ink border-border",
    forest: "bg-[#e6f1ec] text-forest-deep border-[#b7d2c6]",
    gold: "bg-[#f7efd6] text-gold border-[#e2d19a]",
    terracotta: "bg-[#f6e6dc] text-terracotta border-[#e4c1ae]",
    sky: "bg-[#e4eef4] text-sky border-[#bcd3e0]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
