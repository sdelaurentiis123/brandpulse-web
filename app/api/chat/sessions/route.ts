import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getChatMessages,
  getChatSessions,
  getSessionMessageCounts,
} from "@/lib/supabase/queries";

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
}
