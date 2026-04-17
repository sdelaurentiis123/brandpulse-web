import { getEntitySelection } from "@/lib/entity";
import { getActiveNarratives } from "@/lib/supabase/queries";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { NoEntity } from "@/components/no-entity";
import { NarrativesList } from "@/components/narratives-list";

export default async function NarrativesPage() {
  const { selected } = await getEntitySelection();
  if (!selected) {
    return (
      <>
        <PageHeader title="Narratives" />
        <NoEntity />
      </>
    );
  }

  const narratives = await getActiveNarratives(selected);

  return (
    <>
      <PageHeader title={selected} subtitle="Narratives" />
      <SectionHeader
        title="Narrative Threads"
        right={
          <span className="text-[13px] text-[color:var(--text-tertiary)]">
            {narratives.length} active
          </span>
        }
      />
      {narratives.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-[color:var(--text-secondary)]">
          No active narrative threads for {selected} yet.
        </div>
      ) : (
        <NarrativesList narratives={narratives} />
      )}
    </>
  );
}
