import Link from "next/link";
import { getLatestSnapshot } from "@/lib/supabase/queries";
import type { TrackedEntity } from "@/lib/types/db";
import { EntitySelect } from "./entity-select";
import { NavLinks } from "./nav-links";

export async function Sidebar({
  entities,
  selected,
}: {
  entities: TrackedEntity[];
  selected: string | null;
}) {
  const snapshot = selected ? await getLatestSnapshot(selected) : null;
  const lastSync = snapshot
    ? new Date(snapshot.fetched_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  return (
    <nav className="flex w-[200px] shrink-0 flex-col border-r border-border bg-white py-6">
      <Link
        href="/dashboard"
        className="px-5 mb-8 block"
      >
        <div className="text-base font-bold tracking-tight">BrandPulse</div>
        <div className="mt-0.5 text-[11px] tracking-wide text-[color:var(--text-tertiary)]">
          Reputation Intelligence
        </div>
      </Link>

      {entities.length > 0 && (
        <div className="px-3 mb-6">
          <EntitySelect entities={entities} selected={selected ?? undefined} />
        </div>
      )}

      <NavLinks />

      <div className="mt-auto px-5">
        <div className="border-t border-[color:var(--border-muted)] pt-4 space-y-3">
          <div>
            <div className="text-[11px] text-[color:var(--text-tertiary)]">
              Last sync
            </div>
            <div className="mt-0.5 text-xs font-medium text-[color:var(--text-secondary)]">
              {lastSync}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
