import { createSupabaseServerClient } from "./server";
import type {
  Article,
  ChatMessage,
  ChatSession,
  NarrativeThread,
  NarrativeThreadWithUpdates,
  NarrativeUpdate,
  ReportRow,
  ReputationSnapshot,
  TrackedEntity,
} from "@/lib/types/db";

// Entity names are stored inconsistently across tables (tracked_entities uses
// TitleCase; articles/reports/snapshots/narratives use lowercase). All reads
// match case-insensitively; all writes we control normalize to lowercase.
export function normalizeEntity(name: string): string {
  return name.trim().toLowerCase();
}

export async function getTrackedEntities(
  userId: string
): Promise<TrackedEntity[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tracked_entities")
    .select("*")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("entity_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TrackedEntity[];
}

export async function getLatestBriefing(
  entityName: string
): Promise<ReportRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .ilike("entity_name", entityName)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] ?? null) as ReportRow | null;
}

export async function getBpxTrend(
  entityName: string,
  limit = 30
): Promise<ReputationSnapshot[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reputation_snapshots")
    .select("*")
    .ilike("entity_name", entityName)
    .order("fetched_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as ReputationSnapshot[]).slice().reverse();
}

export async function getLatestSnapshot(
  entityName: string
): Promise<ReputationSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reputation_snapshots")
    .select("*")
    .ilike("entity_name", entityName)
    .order("fetched_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] ?? null) as ReputationSnapshot | null;
}

export async function getActiveNarratives(
  entityName: string
): Promise<NarrativeThreadWithUpdates[]> {
  const supabase = await createSupabaseServerClient();
  const { data: threads, error: tErr } = await supabase
    .from("narrative_threads")
    .select("*")
    .ilike("entity_name", entityName)
    .eq("status", "active")
    .order("last_updated", { ascending: false });
  if (tErr) throw tErr;
  const threadIds = (threads ?? []).map((t) => (t as NarrativeThread).thread_id);
  if (threadIds.length === 0) return [];

  const { data: updates, error: uErr } = await supabase
    .from("narrative_updates")
    .select("*")
    .ilike("entity_name", entityName)
    .in("thread_id", threadIds)
    .order("date", { ascending: false });
  if (uErr) throw uErr;

  const grouped = new Map<string, NarrativeUpdate[]>();
  (updates ?? []).forEach((u) => {
    const row = u as NarrativeUpdate;
    const arr = grouped.get(row.thread_id) ?? [];
    arr.push(row);
    grouped.set(row.thread_id, arr);
  });

  return (threads ?? []).map((t) => {
    const thread = t as NarrativeThread;
    return { ...thread, updates: grouped.get(thread.thread_id) ?? [] };
  });
}

export async function getPosts(
  entityName: string,
  opts: { source?: string; limit?: number } = {}
): Promise<Article[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("articles")
    .select("*")
    .ilike("entity_name", entityName)
    .eq("type", "post")
    .order("post_date", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.source && opts.source !== "All") q = q.eq("source", opts.source);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Article[];
}

export interface ChatContextBundle {
  snapshot: ReputationSnapshot | null;
  narratives: NarrativeThreadWithUpdates[];
  recentPosts: Article[];
}

export async function getContextBundleForChat(
  entityName: string
): Promise<ChatContextBundle> {
  const [snapshot, narratives, recentPosts] = await Promise.all([
    getLatestSnapshot(entityName),
    getActiveNarratives(entityName),
    getPosts(entityName, { limit: 50 }),
  ]);
  return { snapshot, narratives, recentPosts };
}

// ── Chat persistence ─────────────────────────────────────

export async function getChatSessions(
  userId: string,
  entityName: string
): Promise<ChatSession[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("entity_name", normalizeEntity(entityName))
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ChatSession[];
}

export async function getChatMessages(
  sessionId: string
): Promise<ChatMessage[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function getSessionMessageCounts(
  sessionIds: string[]
): Promise<Record<string, number>> {
  if (sessionIds.length === 0) return {};
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("session_id")
    .in("session_id", sessionIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    const id = (r as { session_id: string }).session_id;
    counts[id] = (counts[id] ?? 0) + 1;
  });
  return counts;
}
