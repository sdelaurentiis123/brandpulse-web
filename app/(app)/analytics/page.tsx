import { getEntitySelection } from "@/lib/entity";
import { getBpxTrend } from "@/lib/supabase/queries";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { NoEntity } from "@/components/no-entity";
import { VolumeBarChart } from "@/components/charts/volume-bar-chart";
import { SentimentMomentumChart } from "@/components/charts/sentiment-momentum-chart";
import { BpxComponentsChart } from "@/components/charts/bpx-components-chart";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function AnalyticsPage() {
  const { selected } = await getEntitySelection();

  if (!selected) {
    return (
      <>
        <PageHeader title="Analytics" />
        <NoEntity />
      </>
    );
  }

  const trend = await getBpxTrend(selected, 30);
  const data = trend.map((r) => ({
    date: fmtDate(r.fetched_at),
    sentiment: r.sentiment_index ?? 0,
    momentum: r.momentum ?? 0,
    volume: r.volume_total ?? 0,
  }));

  if (data.length === 0) {
    return (
      <>
        <PageHeader title={selected} subtitle="Analytics" />
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-[color:var(--text-secondary)]">
          No snapshot data yet.
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={selected} subtitle="Analytics" />

      <SectionHeader title="Volume and Engagement" />
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <VolumeBarChart data={data} />
        <SentimentMomentumChart data={data} />
      </div>

      <SectionHeader title="BPX Components" />
      <BpxComponentsChart data={data} />
    </>
  );
}
