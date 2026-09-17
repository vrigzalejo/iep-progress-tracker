"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ThreadScroller({
  children,
  className,
  resetKey,
}: {
  children: ReactNode;
  className?: string;
  resetKey?: string | number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [resetKey]);

  return (
    <div ref={ref} className={cn("overflow-auto", className)}>
      {children}
    </div>
  );
}
