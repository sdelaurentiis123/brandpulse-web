# BrandPulse Web Companion

Next.js companion site for the BrandPulse mobile app. Reads the same Supabase
project (`cuxybfuptpgbfcnwkpqr`) and layers deeper analytics + a Claude-powered
chat on top.

## Setup

```sh
cp .env.local.example .env.local
# edit .env.local and fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   ANTHROPIC_API_KEY

npm install
```

### One-time: apply the chat migration

Run `supabase/migrations/20260417_chat.sql` against the Supabase project (SQL
editor or `supabase db push`). This creates two new tables (`chat_sessions`,
`chat_messages`) with RLS policies — the only writes this app performs outside
of auth.

### Dev

```sh
npm run dev
```

Open <http://localhost:3000> → redirects to `/login`. Sign in with the same
credentials as the mobile app. Your tracked entities populate the sidebar
dropdown automatically.

## Architecture

- **Next.js 16 (App Router)** with RSC pages calling typed Supabase query
  helpers in `lib/supabase/queries.ts`.
- **Supabase SSR auth** via `@supabase/ssr`. Session refreshed in
  `middleware.ts`; unauthenticated routes redirect to `/login`.
- **Entity context** lives in a `bp_entity` cookie. The sidebar `EntitySelect`
  posts to `/api/entity` and calls `router.refresh()` so every server component
  re-reads with the new entity.
- **Chat**: `/api/chat` is a Server-Sent-Events endpoint that persists each
  user/assistant turn to Supabase and streams `claude-opus-4-7` replies with
  the post corpus injected into the system prompt.
- **Chat rail** (`components/chat/chat-rail.tsx`) — collapsible right panel
  available on every page except `/chat` itself.
- **Chat page** (`/chat`) — full-width version of the same `ChatSurface`
  component.

## Deploy

Target is Vercel. Set the three env vars in project settings:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`ANTHROPIC_API_KEY`. Apply the chat migration against production Supabase
first.
