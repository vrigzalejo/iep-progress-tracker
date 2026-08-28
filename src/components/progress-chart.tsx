"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate } from "@/lib/utils";

export function ProgressChart({
  entries,
  targetValue,
  unit,
}: {
  entries: { recordedAt: Date | string; score: number }[];
  targetValue: number;
  unit: string;
}) {
  const data = entries.map((entry) => ({
    date: formatDate(entry.recordedAt),
    score: entry.score,
  }));

  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted">
        No progress points yet. After the first session note, a trend line will appear here.
      </p>
    );
  }

  return (
    <div className="h-72 w-full" role="img" aria-label={`Progress chart in ${unit} with a target of ${targetValue}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#e4dfd4" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#4d5a53", fontSize: 12 }} />
          <YAxis tick={{ fill: "#4d5a53", fontSize: 12 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ borderRadius: 8, borderColor: "#d4cec2" }}
            formatter={(value) => [`${value} ${unit}`, "Score"]}
          />
          <ReferenceLine
            y={targetValue}
            stroke="#1b5c48"
            strokeDasharray="4 4"
            label={{ value: `Target ${targetValue}`, fill: "#1b5c48", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="score" stroke="#1d5270" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
