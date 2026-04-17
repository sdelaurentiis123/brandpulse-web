"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function PostsFilters({
  sources,
  active,
}: {
  sources: string[];
  active: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  function set(source: string) {
    const params = new URLSearchParams(search.toString());
    if (source === "All") params.delete("source");
    else params.set("source", source);
    startTransition(() => {
      router.replace(`/posts${params.toString() ? `?${params}` : ""}`);
    });
  }

  return (
    <div className="flex gap-1.5">
      {sources.map((s) => {
        const isActive = active === s || (!active && s === "All");
        return (
          <button
            key={s}
            onClick={() => set(s)}
            disabled={pending}
            className={cn(
              "rounded-full px-3.5 py-1 text-[13px] font-medium transition-colors",
              isActive
                ? "border-[1.5px] border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]"
                : "border border-border bg-white text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-hover)]"
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
