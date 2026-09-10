import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

export function AppIconMark({ size }: { size: number }): ReactNode {
  const safe = Number.isFinite(size) && size > 0 ? size : 32;
  const dot = Math.round(safe * 0.28);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#123d31",
      }}
    >
      <div
        style={{
          width: `${dot}px`,
          height: `${dot}px`,
          borderRadius: "999px",
          background: "#e8c27a",
        }}
      />
    </div>
  );
}

export function renderAppIcon(size: number) {
  const safe = Number.isFinite(size) && size > 0 ? size : 32;
  return new ImageResponse(<AppIconMark size={safe} />, { width: safe, height: safe });
}
