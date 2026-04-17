"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TrackedEntity } from "@/lib/types/db";

export function EntitySelect({
  entities,
  selected,
}: {
  entities: TrackedEntity[];
  selected?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleChange(next: string | null) {
    if (!next) return;
    await fetch("/api/entity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entity: next }),
    });
    startTransition(() => {
      router.refresh();
    });
  }

  if (entities.length === 0) return null;

  return (
    <Select value={selected} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="w-full bg-[color:var(--surface)]">
        <SelectValue placeholder="Select entity" />
      </SelectTrigger>
      <SelectContent>
        {entities.map((e) => (
          <SelectItem key={e.id} value={e.entity_name}>
            {e.display_name ?? e.entity_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
