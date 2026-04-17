"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export function SentimentMomentumChart({
  data,
}: {
  data: Array<{ date: string; sentiment: number; momentum: number }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-white pl-0 pr-4 pt-5 pb-3">
      <div className="mb-3 pl-4 text-[13px] font-semibold">Sentiment vs Momentum</div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
            axisLine={false}
            tickLine={false}
            interval={5}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="sentiment"
            stroke="var(--brand)"
            strokeWidth={2}
            dot={false}
            name="Sentiment"
          />
          <Line
            type="monotone"
            dataKey="momentum"
            stroke="var(--text-tertiary)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 4"
            name="Momentum"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
