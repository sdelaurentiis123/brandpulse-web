import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ENTITY_COOKIE } from "@/lib/entity";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { entity?: string };
  const entity = (body.entity ?? "").trim();
  if (!entity) {
    return NextResponse.json({ ok: false, error: "missing entity" }, { status: 400 });
  }
  const store = await cookies();
  store.set(ENTITY_COOKIE, entity, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ ok: true });
}
