import { getEntitySelection } from "@/lib/entity";
import {
  getActiveNarratives,
  getBpxTrend,
  getLatestBriefing,
  getLatestSnapshot,
} from "@/lib/supabase/queries";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { PageHeader } from "@/components/page-header";
import { SentimentBadge } from "@/components/sentiment-badge";
import { BpxTrendChart } from "@/components/charts/bpx-trend-chart";
import { NoEntity } from "@/components/no-entity";
import type { ReputationSnapshot } from "@/lib/types/db";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function platformRows(s: ReputationSnapshot | null) {
  if (!s) return [];
  return [
    { platform: "Twitter", count: s.twitter_count ?? 0, engagement: s.twitter_engagement ?? 0, sentiment: s.twitter_sentiment ?? 0 },
    { platform: "Reddit", count: s.reddit_count ?? 0, engagement: s.reddit_engagement ?? 0, sentiment: s.reddit_sentiment ?? 0 },
    { platform: "TikTok", count: s.tiktok_count ?? 0, engagement: s.tiktok_engagement ?? 0, sentiment: s.tiktok_sentiment ?? 0 },
    { platform: "News", count: s.news_count ?? 0, engagement: s.news_engagement ?? 0, sentiment: s.news_sentiment ?? 0 },
  ];
}

function sentimentLabel(score: number): string {
  if (score > 20) return "positive";
  if (score < -5) return "negative";
  return "mixed";
}

export default async function DashboardPage() {
  const { selected } = await getEntitySelection();
  if (!selected) {
    return (
      <>
        <PageHeader title="Overview" />
        <NoEntity />
      </>
    );
  }

  const [briefing, snapshot, trend, narratives] = await Promise.all([
    getLatestBriefing(selected),
    getLatestSnapshot(selected),
    getBpxTrend(selected, 30),
    getActiveNarratives(selected),
  ]);

  const trendData = trend.map((r) => ({
    date: fmtDate(r.fetched_at),
    bpx: r.bpx ?? 0,
  }));

  const report = briefing?.report_data;
  const topNarrative = narratives[0];
  const briefingDate = briefing?.created_at
    ? new Date(briefing.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <>
      <PageHeader title={selected} subtitle="Overview" />

      {report?.briefing && (
        <div className="mb-8 rounded-lg border border-[color:var(--border-muted)] bg-[color:var(--surface)] p-6">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-tertiary)]">
            Daily Briefing{briefingDate ? ` — ${briefingDate}` : ""}
          </div>
          <p className="max-w-[680px] text-sm leading-relaxed text-foreground">
            {report.briefing}
          </p>
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        <MetricCard
          label="BPX Score"
          value={snapshot?.bpx ?? "—"}
          sub={
            typeof report?.overall?.delta === "number"
              ? `${report.overall.delta > 0 ? "+" : ""}${report.overall.delta} from yesterday`
              : "Latest snapshot"
          }
          accent="brand"
        />
        <MetricCard
          label="Sentiment"
          value={report?.overall?.sentiment ?? (snapshot?.sentiment_index ?? "—")}
          sub="Across all platforms"
        />
        <MetricCard
          label="Volume"
          value={
            snapshot?.volume_total != null
              ? snapshot.volume_total.toLocaleString()
              : report?.overall?.social_volume ?? "—"
          }
          sub="Posts tracked (24h)"
        />
        <MetricCard
          label="Narratives"
          value={narratives.length}
          sub={
            topNarrative
              ? topNarrative.headline.slice(0, 28) +
                (topNarrative.headline.length > 28 ? "…" : "")
              : "No active threads"
          }
        />
      </div>

      <div className="mb-8">
        <SectionHeader title="BPX Index — 30 Day" />
        {trendData.length > 0 ? (
          <BpxTrendChart data={trendData} />
        ) : (
          <div className="rounded-lg border border-border bg-white p-6 text-sm text-[color:var(--text-secondary)]">
            No snapshot data yet.
          </div>
        )}
      </div>

      <SectionHeader title="Platform Breakdown" />
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-4">
        {platformRows(snapshot).map((p) => (
          <div
            key={p.platform}
            className="rounded-lg border border-border bg-white px-5 py-4"
          >
            <div className="mb-3 text-[13px] font-semibold">{p.platform}</div>
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-[11px] text-[color:var(--text-tertiary)]">
                  Posts
                </div>
                <div className="text-lg font-semibold">
                  {p.count.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[color:var(--text-tertiary)]">
                  Engagement
                </div>
                <div className="text-[13px] font-medium text-[color:var(--text-secondary)]">
                  {p.engagement.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[color:var(--text-tertiary)] mb-1">
                  Sentiment
                </div>
                <SentimentBadge
                  sentiment={sentimentLabel(p.sentiment)}
                  score={p.sentiment}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {report?.actions && report.actions.length > 0 && (
        <>
          <SectionHeader title="Recommended Actions" />
          <div className="flex flex-col gap-2">
            {report.actions.map((a, i) => (
              <div
                key={i}
                className="rounded-md bg-[color:var(--surface)] px-4 py-3 text-sm leading-relaxed border-l-[3px] border-[color:var(--brand)]"
              >
                {a}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
