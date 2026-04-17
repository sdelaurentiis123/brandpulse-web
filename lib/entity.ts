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
}

export async function getEntitySelection(): Promise<EntitySelection> {
  const user = await getCurrentUser();
  if (!user) return { entities: [], selected: null };

  const entities = await getTrackedEntities(user.id);
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(COOKIE)?.value;

  const cookieLower = fromCookie?.toLowerCase();
  const selected =
    (cookieLower &&
      entities.find((e) => e.entity_name.toLowerCase() === cookieLower)
        ?.entity_name) ||
    entities.find((e) => e.is_primary)?.entity_name ||
    entities[0]?.entity_name ||
    null;

  return { entities, selected };
}

export const ENTITY_COOKIE = COOKIE;
