import { cn } from "@/lib/utils";

type Tone = "positive" | "negative" | "mixed" | "neutral";

function resolveTone(input?: string | null): Tone {
  const s = (input ?? "").toLowerCase();
  if (s === "positive" || s === "negative" || s === "mixed") return s;
  return "neutral";
}

export function SentimentBadge({
  sentiment,
  score,
  className,
}: {
  sentiment?: string | null;
  score?: number | null;
  className?: string;
}) {
  const tone = resolveTone(sentiment);
  const toneClass = {
    positive: "bg-[color:var(--positive-soft)] text-[color:var(--positive)]",
    negative: "bg-[color:var(--negative-soft)] text-[color:var(--negative)]",
    mixed: "bg-[color:var(--mixed-soft)] text-[color:var(--mixed)]",
    neutral: "bg-[color:var(--neutral-soft)] text-[color:var(--neutral-badge)]",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium tracking-tight",
        toneClass,
        className
      )}
    >
      {tone}
      {typeof score === "number" && ` ${score > 0 ? "+" : ""}${score}`}
    </span>
  );
}

export function scoreToTone(score: number | null | undefined): Tone {
  if (typeof score !== "number") return "neutral";
  if (score > 20) return "positive";
  if (score < -5) return "negative";
  if (score < 10 && score > -10) return "mixed";
  return "mixed";
}

export function scoreToToneStrict(score: number | null | undefined): Tone {
  if (typeof score !== "number") return "neutral";
  if (score > 10) return "positive";
  if (score < -10) return "negative";
  return "mixed";
}
