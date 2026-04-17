"use client";

import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export interface BpxTrendPoint {
  date: string;
  bpx: number;
}

export function BpxTrendChart({ data }: { data: BpxTrendPoint[] }) {
  return (
    <div className="rounded-lg border border-border bg-white pl-0 pr-4 pt-5 pb-3">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="bpxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.12} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={[0, 100]}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="bpx"
            stroke="var(--brand)"
            strokeWidth={2}
            fill="url(#bpxGrad)"
            name="BPX"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
