"use client";

import { useState } from "react";

export function CollapsibleBriefing({
  text,
  dateLabel,
}: {
  text: string;
  dateLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 280;
  const shown = expanded || !isLong ? text : text.slice(0, 280).trimEnd() + "…";

  return (
    <div className="mb-8 rounded-lg border border-[color:var(--border-muted)] bg-[color:var(--surface)] p-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-tertiary)]">
          Daily Briefing{dateLabel ? ` — ${dateLabel}` : ""}
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[11px] font-medium text-[color:var(--brand)] hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
      <p className="max-w-[720px] text-sm leading-relaxed text-foreground whitespace-pre-wrap">
        {shown}
      </p>
    </div>
  );
}
