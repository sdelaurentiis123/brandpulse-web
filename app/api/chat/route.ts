import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getChatMessages,
  getContextBundleForChat,
  normalizeEntity,
} from "@/lib/supabase/queries";
import { CHAT_MODEL, getAnthropicClient } from "@/lib/anthropic";
import type { ChatContextBundle } from "@/lib/supabase/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  entity: string;
  sessionId?: string | null;
  userMessage: string;
}

function buildSystemPrompt(entity: string, ctx: ChatContextBundle): string {
  const snap = ctx.snapshot;
  const snapshotLines = snap
    ? [
        `  fetched_at: ${snap.fetched_at}`,
        `  bpx: ${snap.bpx}`,
        `  sentiment_index: ${snap.sentiment_index}`,
        `  momentum: ${snap.momentum}`,
        `  volume_total: ${snap.volume_total}`,
        `  volume_ratio: ${snap.volume_ratio}`,
        `  per_platform: twitter ${snap.twitter_count}/${snap.twitter_sentiment}, reddit ${snap.reddit_count}/${snap.reddit_sentiment}, tiktok ${snap.tiktok_count}/${snap.tiktok_sentiment}, news ${snap.news_count}/${snap.news_sentiment}`,
        snap.top_thread_headline
          ? `  top_thread: ${snap.top_thread_headline}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "  (no snapshot available)";

  const narrativeLines = ctx.narratives.length
    ? ctx.narratives
        .slice(0, 8)
        .map((n) => {
          const latest = n.updates[0];
          return `  - [${n.thread_id}] ${n.headline} (sentiment: ${n.sentiment ?? "?"}; latest: ${latest?.date ?? "—"} / ${latest?.sentiment_score ?? "?"})`;
        })
        .join("\n")
    : "  (no active narratives)";

  const postLines = ctx.recentPosts
    .slice(0, 40)
    .map((p) => {
      const date = p.post_date ? new Date(p.post_date).toISOString().slice(0, 10) : "—";
      const title = (p.title ?? "").replace(/\s+/g, " ").slice(0, 140);
      return `  ${date} | ${p.source} | ${p.sentiment ?? "?"} ${p.sentiment_score ?? ""} | ${p.engagement ?? 0} eng | ${title}`;
    })
    .join("\n");

  return [
    `You are the BrandPulse analyst assistant for ${entity}.`,
    "You speak concisely and cite the data below when answering. Do not invent metrics.",
    "All sentiment is ENTITY-RELATIVE — a post attacking a rival scores POSITIVE for the entity.",
    "BPX is an exponentially smoothed composite (alpha=0.7). TikTok is excluded from BPX but included in volume.",
    "",
    "Latest snapshot:",
    snapshotLines,
    "",
    "Active narratives:",
    narrativeLines,
    "",
    "Recent posts (newest first):",
    postLines || "  (none)",
  ].join("\n");
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { entity, userMessage } = body;
  if (!entity || !userMessage?.trim()) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const entityKey = normalizeEntity(entity);

  // Resolve or create the session.
  let sessionId = body.sessionId ?? null;
  if (sessionId) {
    const { data: existing, error } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !existing) sessionId = null;
  }
  if (!sessionId) {
    const title =
      userMessage.trim().slice(0, 40) +
      (userMessage.trim().length > 40 ? "…" : "");
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, entity_name: entityKey, title })
      .select("id")
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: `could not create session: ${error?.message}` },
        { status: 500 }
      );
    }
    sessionId = data.id as string;
  }

  // Persist the user turn before calling the model.
  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: userMessage,
  });

  const [prior, context] = await Promise.all([
    getChatMessages(sessionId),
    getContextBundleForChat(entity),
  ]);

  const history = prior.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const client = getAnthropicClient();
  const system = buildSystemPrompt(entity, context);
  const resolvedSessionId = sessionId;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      write("session", { sessionId: resolvedSessionId });

      let assembled = "";
      try {
        const response = await client.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 1024,
          system,
          messages: history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        });

        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            assembled += text;
            write("delta", { text });
          }
        }

        await supabase.from("chat_messages").insert({
          session_id: resolvedSessionId,
          role: "assistant",
          content: assembled,
        });
        await supabase
          .from("chat_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", resolvedSessionId);

        write("done", { content: assembled });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        write("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
