"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PromptSharePoint } from "@/lib/workflow";

export function PromptLevelChart({ points }: { points: PromptSharePoint[] }) {
  if (points.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted">
        Prompt-level shares appear after present sessions with trials.
      </p>
    );
  }

  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label="Share of trials by prompt level over time. This is not a recommendation to change the prompt hierarchy."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#e4dfd4" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#4d5a53", fontSize: 12 }} />
          <YAxis tick={{ fill: "#4d5a53", fontSize: 12 }} domain={[0, 100]} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#d4cec2" }} />
          <Bar dataKey="independent" stackId="p" fill="#1b5c48" name="Independent" />
          <Bar dataKey="gesture" stackId="p" fill="#4d8f73" name="Gesture" />
          <Bar dataKey="verbal" stackId="p" fill="#1d5270" name="Verbal" />
          <Bar dataKey="model" stackId="p" fill="#c9a227" name="Model" />
          <Bar dataKey="physical" stackId="p" fill="#a85a44" name="Physical" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
