import type { Article } from "@/lib/types/db";
import { cn } from "@/lib/utils";

type Tone = "positive" | "negative" | "mixed" | "neutral";

function classify(a: Article): Tone {
  const s = (a.sentiment ?? "").toLowerCase();
  if (s === "positive" || s === "negative" || s === "mixed") return s;
  return "neutral";
}

const TONE_COLOR: Record<Tone, string> = {
  positive: "var(--positive)",
  negative: "var(--negative)",
  mixed: "var(--mixed)",
  neutral: "var(--text-tertiary)",
};

const TONE_SOFT: Record<Tone, string> = {
  positive: "var(--positive-soft)",
  negative: "var(--negative-soft)",
  mixed: "var(--mixed-soft)",
  neutral: "var(--neutral-soft)",
};

export function PostsInsights({ posts }: { posts: Article[] }) {
  if (posts.length === 0) return null;

  const counts: Record<Tone, number> = { positive: 0, negative: 0, mixed: 0, neutral: 0 };
  const engagementByTone: Record<Tone, number> = { positive: 0, negative: 0, mixed: 0, neutral: 0 };
  for (const p of posts) {
    const t = classify(p);
    counts[t] += 1;
    engagementByTone[t] += p.engagement ?? 0;
  }

  const totalPosts = posts.length;
  const totalEngagement = (Object.values(engagementByTone) as number[]).reduce(
    (a, b) => a + b,
    0
  );
  const scores = posts
    .map((p) => p.sentiment_score)
    .filter((s): s is number => typeof s === "number");
  const avgScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  // Engagement-weighted sentiment: which tone dominates reach?
  let dominantTone: Tone = "neutral";
  let dominantShare = 0;
  (Object.keys(engagementByTone) as Tone[]).forEach((t) => {
    const share = totalEngagement > 0 ? engagementByTone[t] / totalEngagement : 0;
    if (share > dominantShare) {
      dominantShare = share;
      dominantTone = t;
    }
  });

  const topByEngagement = [...posts]
    .sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0))
    .slice(0, 3);

  const order: Tone[] = ["positive", "mixed", "neutral", "negative"];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Sentiment distribution */}
      <div className="rounded-lg border border-border bg-white p-5">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-tertiary)]">
          Sentiment Mix
        </div>
        <div className="mb-3 text-[28px] font-semibold leading-none tracking-tight">
          {avgScore > 0 ? "+" : ""}
          {avgScore.toFixed(1)}
        </div>
        <div className="mb-3 text-xs text-[color:var(--text-secondary)]">
          Average score across {totalPosts} posts
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface)]">
          {order.map((t) => {
            const pct = (counts[t] / totalPosts) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={t}
                className="h-full"
                style={{ width: `${pct}%`, background: TONE_COLOR[t] }}
                title={`${t}: ${counts[t]} (${pct.toFixed(0)}%)`}
              />
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
          {order.map((t) => (
            <div key={t}>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: TONE_COLOR[t] }}
                />
                <span className="capitalize text-[color:var(--text-tertiary)]">
                  {t}
                </span>
              </div>
              <div className="mt-0.5 text-[13px] font-semibold">{counts[t]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement-weighted insight */}
      <div
        className="rounded-lg border border-border bg-white p-5"
        style={{
          background: `linear-gradient(0deg, ${TONE_SOFT[dominantTone]} 0%, white 60%)`,
        }}
      >
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-tertiary)]">
          Who&apos;s Driving Reach
        </div>
        <div
          className="mb-3 text-[28px] font-semibold capitalize leading-none tracking-tight"
          style={{ color: TONE_COLOR[dominantTone] }}
        >
          {dominantTone}
        </div>
        <div className="mb-3 text-xs text-[color:var(--text-secondary)]">
          {dominantTone === "neutral"
            ? "Mixed signal across sentiment"
            : `${(dominantShare * 100).toFixed(0)}% of all engagement came from ${dominantTone} posts`}
        </div>
        <div className="space-y-1.5">
          {order.map((t) => {
            const eng = engagementByTone[t];
            const share = totalEngagement > 0 ? (eng / totalEngagement) * 100 : 0;
            return (
              <div key={t} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-[11px] capitalize text-[color:var(--text-tertiary)]">
                  {t}
                </span>
                <div className="relative flex-1 overflow-hidden rounded bg-[color:var(--surface)]">
                  <div
                    className="h-1.5 rounded"
                    style={{ width: `${share}%`, background: TONE_COLOR[t] }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-[11px] text-[color:var(--text-secondary)]">
                  {eng.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top posts by engagement */}
      <div className="rounded-lg border border-border bg-white p-5">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-tertiary)]">
          Top Posts by Engagement
        </div>
        <div className="space-y-3">
          {topByEngagement.map((p, i) => {
            const tone = classify(p);
            return (
              <a
                key={p.id}
                href={p.url ?? undefined}
                target="_blank"
                rel="noreferrer noopener"
                className="block group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-4 shrink-0 text-[11px] font-semibold text-[color:var(--text-tertiary)]">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium group-hover:text-[color:var(--brand)]">
                      {p.title ?? "(untitled)"}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-[color:var(--text-tertiary)]">
                      <span>{p.source}</span>
                      <span>·</span>
                      <span>{(p.engagement ?? 0).toLocaleString()} eng</span>
                      <span>·</span>
                      <span
                        className={cn("capitalize font-medium")}
                        style={{ color: TONE_COLOR[tone] }}
                      >
                        {tone}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
