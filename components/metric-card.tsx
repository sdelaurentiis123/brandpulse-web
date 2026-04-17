import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  sub,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "brand" | "positive" | "negative" | "default";
  className?: string;
}) {
  const accentClass = {
    brand: "text-[color:var(--brand)]",
    positive: "text-[color:var(--positive)]",
    negative: "text-[color:var(--negative)]",
    default: "text-foreground",
  }[accent ?? "default"];

  return (
    <div
      className={cn(
        "flex-1 min-w-[140px] rounded-lg border border-border bg-white px-6 py-5",
        className
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-tertiary)] mb-2">
        {label}
      </div>
      <div
        className={cn(
          "text-[28px] font-semibold leading-none tracking-tight",
          accentClass
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 text-xs text-[color:var(--text-secondary)]">
          {sub}
        </div>
      )}
    </div>
  );
}
