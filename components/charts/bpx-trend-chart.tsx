"use client";

import {
  AreaChart,
  Area,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { niceDomain } from "./domain";

export interface BpxTrendPoint {
  date: string;
  bpx: number;
}

export function BpxTrendChart({ data }: { data: BpxTrendPoint[] }) {
  const domain = niceDomain(data.map((d) => d.bpx));
  const showZeroLine = domain[0] < 0 && domain[1] > 0;

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
            domain={domain}
            allowDataOverflow={false}
          />
          {showZeroLine && (
            <ReferenceLine y={0} stroke="var(--border-muted)" strokeDasharray="2 4" />
          )}
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
