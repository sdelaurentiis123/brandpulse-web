import { getEntitySelection } from "@/lib/entity";
import { getPosts } from "@/lib/supabase/queries";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { NoEntity } from "@/components/no-entity";
import { EmptyState } from "@/components/empty-state";
import { SentimentBadge } from "@/components/sentiment-badge";
import { PostsFilters } from "@/components/posts-filters";
import { PostsInsights } from "@/components/posts-insights";

const SOURCES = ["All", "Twitter", "Reddit", "TikTok", "News"] as const;

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { selected, selectedDisplay } = await getEntitySelection();
  const { source = "All" } = await searchParams;

  if (!selected) {
    return (
      <>
        <PageHeader title="Posts" />
        <NoEntity />
      </>
    );
  }

  // Insights reflect the full post corpus; the filter only affects the table
  // so users can always see the big picture even when drilling into one source.
  const allPosts = await getPosts(selected, { limit: 200 });
  const posts =
    source === "All" ? allPosts : allPosts.filter((p) => p.source === source);

  return (
    <>
      <PageHeader title={selectedDisplay ?? selected} subtitle="Posts" />

      {allPosts.length > 0 && <PostsInsights posts={allPosts} />}

      <SectionHeader
        title="Post Explorer"
        right={
          <span className="text-[13px] text-[color:var(--text-tertiary)]">
            {posts.length} of {allPosts.length} posts
          </span>
        }
      />

      <PostsFilters sources={SOURCES as unknown as string[]} active={source} />

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-white">
        <div
          className="grid gap-3 border-b border-border bg-[color:var(--surface)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-tertiary)]"
          style={{ gridTemplateColumns: "72px 1fr 90px 56px 80px 52px" }}
        >
          <div>Source</div>
          <div>Title</div>
          <div>Sentiment</div>
          <div>Score</div>
          <div>Engage.</div>
          <div>Date</div>
        </div>
        {posts.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[color:var(--text-secondary)]">
            {source === "All"
              ? `No posts ingested for ${selectedDisplay ?? selected} yet.`
              : `No ${source} posts match this filter.`}
          </div>
        ) : (
          posts.map((p, i) => (
            <a
              key={p.id}
              href={p.url ?? undefined}
              target="_blank"
              rel="noreferrer noopener"
              className={
                "grid items-center gap-3 px-4 py-3 hover:bg-[color:var(--surface-hover)] transition-colors " +
                (i < posts.length - 1 ? "border-b border-[color:var(--border-muted)]" : "")
              }
              style={{ gridTemplateColumns: "72px 1fr 90px 56px 80px 52px" }}
            >
              <div className="text-xs font-medium text-[color:var(--text-secondary)]">
                {p.source}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">
                  {p.title ?? "(untitled)"}
                </div>
                {p.reach && (
                  <div className="mt-0.5 text-[11px] text-[color:var(--text-tertiary)]">
                    {p.reach}
                  </div>
                )}
              </div>
              <SentimentBadge sentiment={p.sentiment} />
              <div
                className="text-[13px] font-semibold"
                style={{
                  color:
                    (p.sentiment_score ?? 0) > 0
                      ? "var(--positive)"
                      : (p.sentiment_score ?? 0) < 0
                        ? "var(--negative)"
                        : "var(--neutral-badge)",
                }}
              >
                {p.sentiment_score != null
                  ? (p.sentiment_score > 0 ? "+" : "") + p.sentiment_score
                  : "—"}
              </div>
              <div className="text-xs text-[color:var(--text-secondary)]">
                {p.engagement?.toLocaleString() ?? "—"}
              </div>
              <div className="text-[11px] text-[color:var(--text-tertiary)]">
                {fmtDate(p.post_date)}
              </div>
            </a>
          ))
        )}
      </div>
    </>
  );
}
