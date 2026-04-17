"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { NarrativeThreadWithUpdates } from "@/lib/types/db";
import { SentimentBadge, scoreToToneStrict } from "./sentiment-badge";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function NarrativesList({
  narratives,
}: {
  narratives: NarrativeThreadWithUpdates[];
}) {
  const [expanded, setExpanded] = useState<string | null>(narratives[0]?.thread_id ?? null);

  return (
    <div className="flex flex-col gap-3">
      {narratives.map((n) => {
        const isOpen = expanded === n.thread_id;
        return (
          <div
            key={n.id}
            className="overflow-hidden rounded-lg border border-border bg-white"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : n.thread_id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[color:var(--surface-hover)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="mb-1 text-sm font-semibold tracking-tight">
                  {n.headline}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-[color:var(--text-tertiary)]">
                    First seen {fmtDate(n.first_seen)}
                  </span>
                  <span className="text-xs text-[color:var(--text-tertiary)]">
                    Updated {fmtDate(n.last_updated)}
                  </span>
                  <SentimentBadge sentiment={n.sentiment} />
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-[color:var(--text-tertiary)]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[color:var(--text-tertiary)]" />
              )}
            </button>
            {isOpen && (
              <div className="border-t border-[color:var(--border-muted)] px-5 pb-4">
                {n.updates.length === 0 ? (
                  <div className="py-4 text-sm text-[color:var(--text-secondary)]">
                    No updates yet.
                  </div>
                ) : (
                  n.updates.map((u, i) => (
                    <div
                      key={u.id}
                      className={
                        "flex gap-4 py-3.5 " +
                        (i < n.updates.length - 1
                          ? "border-b border-[color:var(--border-muted)]"
                          : "")
                      }
                    >
                      <div className="min-w-[56px] text-[13px] font-medium text-[color:var(--text-secondary)]">
                        {fmtDate(u.date)}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 text-[13px] leading-relaxed">
                          {u.summary}
                        </div>
                        <SentimentBadge
                          sentiment={scoreToToneStrict(u.sentiment_score)}
                          score={u.sentiment_score ?? undefined}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
