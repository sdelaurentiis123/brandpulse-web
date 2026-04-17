import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getChatMessages,
  getChatSessions,
  getSessionMessageCounts,
} from "@/lib/supabase/queries";

function isMissingTable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  return e.code === "PGRST205" || (e.message ?? "").includes("Could not find the table");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");
  const sessionId = searchParams.get("sessionId");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    if (sessionId) {
      const messages = await getChatMessages(sessionId);
      return NextResponse.json({ messages });
    }

    if (!entity) {
      return NextResponse.json({ error: "missing entity" }, { status: 400 });
    }

    const sessions = await getChatSessions(user.id, entity);
    const counts = await getSessionMessageCounts(sessions.map((s) => s.id));
    return NextResponse.json({
      sessions: sessions.map((s) => ({
        ...s,
        message_count: counts[s.id] ?? 0,
      })),
    });
  } catch (err) {
    if (isMissingTable(err)) {
      // Migration not applied yet — return empty state instead of 500.
      return NextResponse.json(
        {
          sessions: [],
          messages: [],
          migrationMissing: true,
          hint: "Run supabase/migrations/20260417_chat.sql against the Supabase project to enable chat persistence.",
        },
        { status: 200 }
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
