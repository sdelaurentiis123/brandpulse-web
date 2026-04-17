"use client";

interface TooltipPayloadItem {
  name?: string | number;
  value?: number | string;
}

interface TooltipLikeProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipPayloadItem[];
}

export function ChartTooltip(props: TooltipLikeProps) {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3.5 py-2.5 shadow-lg"
      style={{ background: "#1A1A1A", color: "#fff" }}
    >
      <div className="text-[11px] text-neutral-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-[13px] font-medium">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : String(p.value)}
        </div>
      ))}
    </div>
  );
}
