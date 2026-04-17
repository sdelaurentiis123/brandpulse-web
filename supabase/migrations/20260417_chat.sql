-- BrandPulse web companion: chat persistence tables
-- Apply via the Supabase SQL editor or `supabase db push`.

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_name text not null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_entity_updated_idx
  on public.chat_sessions (user_id, entity_name, updated_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_created_idx
  on public.chat_messages (session_id, created_at);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat_sessions own" on public.chat_sessions;
create policy "chat_sessions own" on public.chat_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "chat_messages own" on public.chat_messages;
create policy "chat_messages own" on public.chat_messages
  for all
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = chat_messages.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = chat_messages.session_id
        and s.user_id = auth.uid()
    )
  );
