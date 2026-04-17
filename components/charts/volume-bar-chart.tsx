"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export function VolumeBarChart({
  data,
}: {
  data: Array<{ date: string; volume: number }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-white pl-0 pr-4 pt-5 pb-3">
      <div className="mb-3 pl-4 text-[13px] font-semibold">Post Volume</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
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
          <Bar dataKey="volume" fill="var(--brand)" radius={[3, 3, 0, 0]} name="Volume" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
