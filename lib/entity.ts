import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTrackedEntities } from "@/lib/supabase/queries";
import type { TrackedEntity } from "@/lib/types/db";

const COOKIE = "bp_entity";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export interface EntitySelection {
  entities: TrackedEntity[];
  selected: string | null;
  selectedDisplay: string | null;
}

export async function getEntitySelection(): Promise<EntitySelection> {
  const user = await getCurrentUser();
  if (!user) return { entities: [], selected: null, selectedDisplay: null };

  const entities = await getTrackedEntities(user.id);
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(COOKIE)?.value;

  const cookieLower = fromCookie?.toLowerCase();
  const selectedEntity =
    (cookieLower &&
      entities.find((e) => e.entity_name.toLowerCase() === cookieLower)) ||
    entities.find((e) => e.is_primary) ||
    entities[0] ||
    null;

  return {
    entities,
    selected: selectedEntity?.entity_name ?? null,
    selectedDisplay:
      selectedEntity?.display_name ?? selectedEntity?.entity_name ?? null,
  };
}

export const ENTITY_COOKIE = COOKIE;
