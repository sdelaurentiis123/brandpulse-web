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
import { VolumeBarChart } from "@/components/charts/volume-bar-chart";
import { SentimentMomentumChart } from "@/components/charts/sentiment-momentum-chart";
import { BpxComponentsChart } from "@/components/charts/bpx-components-chart";
import { CollapsibleBriefing } from "@/components/collapsible-briefing";
import { NoEntity } from "@/components/no-entity";
import { EmptyState } from "@/components/empty-state";
import type { ReputationSnapshot } from "@/lib/types/db";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function dayRangeLabel(trend: ReputationSnapshot[]): string {
  if (trend.length === 0) return "";
  const days = new Set(trend.map((r) => r.fetched_at.slice(0, 10)));
  const n = days.size;
  if (n <= 1) return `${trend.length} snapshots, 1 day`;
  return `${trend.length} snapshots over ${n} days`;
}

export default async function DashboardPage() {
  const { selected, selectedDisplay } = await getEntitySelection();
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

  const chartData = trend.map((r) => ({
    date: fmtDate(r.fetched_at),
    bpx: r.bpx ?? 0,
    sentiment: r.sentiment_index ?? 0,
    momentum: r.momentum ?? 0,
    volume: r.volume_total ?? 0,
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

  const hasAnyData =
    !!briefing || !!snapshot || trend.length > 0 || narratives.length > 0;

  if (!hasAnyData) {
    return (
      <>
        <PageHeader title={selectedDisplay ?? selected} subtitle="Overview" />
        <EmptyState
          title={`No data yet for ${selectedDisplay ?? selected}`}
          message="BrandPulse hasn't ingested any posts, snapshots, or narratives for this entity. Data will appear here after the next ingestion run."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={selectedDisplay ?? selected} subtitle="Overview" />

      {report?.briefing && (
        <CollapsibleBriefing text={report.briefing} dateLabel={briefingDate} />
      )}

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="BPX Score"
          value={report?.overall?.score ?? snapshot?.bpx ?? "—"}
          sub={
            typeof report?.overall?.delta === "number"
              ? `${report.overall.delta > 0 ? "+" : ""}${report.overall.delta} from yesterday`
              : typeof report?.overall?.delta === "string"
                ? "Change vs yesterday"
                : "Latest snapshot"
          }
          accent="brand"
        />
        <MetricCard
          label="Volume"
          value={
            report?.overall?.social_volume != null
              ? typeof report.overall.social_volume === "number"
                ? report.overall.social_volume.toLocaleString()
                : report.overall.social_volume
              : snapshot?.volume_total != null
                ? snapshot.volume_total.toLocaleString()
                : "—"
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

      {chartData.length > 0 && (
        <div className="mb-8">
          <SectionHeader
            title="BPX Trend"
            right={
              <span className="text-[13px] text-[color:var(--text-tertiary)]">
                {dayRangeLabel(trend)}
              </span>
            }
          />
          <BpxTrendChart data={chartData} />
        </div>
      )}

      {snapshot && (
        <>
          <SectionHeader title="Platform Breakdown" />
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    <div className="mb-1 text-[11px] text-[color:var(--text-tertiary)]">
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
        </>
      )}

      {chartData.length > 1 && (
        <>
          <SectionHeader title="Volume and Engagement" />
          <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <VolumeBarChart data={chartData} />
            <SentimentMomentumChart data={chartData} />
          </div>

          <SectionHeader title="BPX Components" />
          <div className="mb-8">
            <BpxComponentsChart data={chartData} />
          </div>
        </>
      )}

      {report?.actions && report.actions.length > 0 && (
        <>
          <SectionHeader title="Recommended Actions" />
          <div className="flex flex-col gap-2">
            {report.actions.map((a, i) => {
              if (typeof a === "string") {
                return (
                  <div
                    key={i}
                    className="rounded-md bg-[color:var(--surface)] px-4 py-3 text-sm leading-relaxed border-l-[3px] border-[color:var(--brand)]"
                  >
                    {a}
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className="rounded-md bg-[color:var(--surface)] px-4 py-3 leading-relaxed border-l-[3px] border-[color:var(--brand)]"
                >
                  <div className="text-sm font-semibold">{a.title}</div>
                  {a.reasoning && (
                    <div className="mt-1.5 text-[13px] text-[color:var(--text-secondary)]">
                      {a.reasoning}
                    </div>
                  )}
                  {a.sources && a.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      {a.sources.map((src, j) => (
                        <span
                          key={j}
                          className="rounded bg-white border border-border px-1.5 py-0.5 text-[color:var(--text-secondary)]"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
