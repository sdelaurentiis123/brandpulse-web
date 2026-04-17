"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, History, Plus, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessageView {
  id?: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

export interface ChatSessionView {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatSurfaceHandle {
  newChat: () => void;
  openHistory: () => void;
}

interface ChatSurfaceProps {
  entity: string | null;
  entityDisplay?: string | null;
  variant?: "rail" | "page";
  onTitleChange?: (title: string) => void;
  className?: string;
  onCloseRail?: () => void;
}

const SUGGESTED = [
  "Why did BPX drop this week?",
  "Summarize the active narratives",
  "Which platform is most negative?",
];

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const ChatSurface = forwardRef<ChatSurfaceHandle, ChatSurfaceProps>(
  function ChatSurface(
    {
      entity,
      entityDisplay,
      variant = "rail",
      onTitleChange,
      className,
      onCloseRail,
    },
    ref
  ) {
    const entityLabel = entityDisplay ?? entity;
    const [sessions, setSessions] = useState<ChatSessionView[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessageView[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [migrationMissing, setMigrationMissing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    // Set to true when sendMessage creates a new session so the activeId
    // effect below doesn't race the stream and overwrite optimistic messages.
    const skipNextFetchRef = useRef(false);

    const activeSession = useMemo(
      () => sessions.find((s) => s.id === activeId) ?? null,
      [sessions, activeId]
    );

    const title = activeSession?.title ?? "New conversation";
    useEffect(() => {
      onTitleChange?.(title);
    }, [title, onTitleChange]);

    useImperativeHandle(ref, () => ({
      newChat: () => handleNewChat(),
      openHistory: () => setShowHistory(true),
    }));

    const reloadSessions = useCallback(
      async (selectFirst = false) => {
        if (!entity) {
          setSessions([]);
          setActiveId(null);
          setMessages([]);
          setLoadingSessions(false);
          return;
        }
        setLoadingSessions(true);
        try {
          const res = await fetch(
            `/api/chat/sessions?entity=${encodeURIComponent(entity)}`
          );
          if (!res.ok) {
            setSessions([]);
            return;
          }
          const json = (await res.json()) as {
            sessions?: ChatSessionView[];
            migrationMissing?: boolean;
          };
          setMigrationMissing(Boolean(json.migrationMissing));
          const list = json.sessions ?? [];
          setSessions(list);
          if (selectFirst || !activeId) {
            const first = list[0]?.id ?? null;
            setActiveId(first);
          }
        } catch {
          setSessions([]);
        } finally {
          setLoadingSessions(false);
        }
      },
      [entity, activeId]
    );

    useEffect(() => {
      void reloadSessions(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entity]);

    useEffect(() => {
      if (!activeId) {
        setMessages([]);
        return;
      }
      // Skip a refetch immediately after we created a session during sendMessage —
      // the optimistic state + stream are the source of truth in that turn.
      if (skipNextFetchRef.current) {
        skipNextFetchRef.current = false;
        return;
      }
      let cancelled = false;
      (async () => {
        const res = await fetch(
          `/api/chat/sessions?sessionId=${encodeURIComponent(activeId)}`
        );
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          messages: Array<{ id: string; role: "user" | "assistant"; content: string }>;
        };
        if (cancelled) return;
        setMessages(
          json.messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))
        );
      })();
      return () => {
        cancelled = true;
      };
    }, [activeId]);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length, isStreaming]);

    useEffect(() => {
      if (!showHistory) inputRef.current?.focus();
    }, [showHistory, activeId]);

    const handleNewChat = () => {
      setActiveId(null);
      setMessages([]);
      setShowHistory(false);
      setInput("");
    };

    const handleDelete = async (id: string) => {
      await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    };

    const sendMessage = async () => {
      const text = input.trim();
      if (!text || isStreaming || !entity) return;
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";

      const optimisticUser: ChatMessageView = { role: "user", content: text };
      const assistantPlaceholder: ChatMessageView = {
        role: "assistant",
        content: "",
        pending: true,
      };
      setMessages((prev) => [...prev, optimisticUser, assistantPlaceholder]);
      setIsStreaming(true);
      // If this send is creating a brand-new session, the activeId effect
      // would otherwise refetch (and wipe) our optimistic messages as soon
      // as the server's "session" event lands. Tell it to skip once.
      if (!activeId) skipNextFetchRef.current = true;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            entity,
            sessionId: activeId,
            userMessage: text,
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`chat failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assembled = "";
        let sessionId = activeId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const raw of events) {
            if (!raw.trim()) continue;
            const lines = raw.split("\n");
            const eventLine = lines.find((l) => l.startsWith("event: "));
            const dataLine = lines.find((l) => l.startsWith("data: "));
            if (!eventLine || !dataLine) continue;
            const event = eventLine.slice(7).trim();
            const data = JSON.parse(dataLine.slice(6));

            if (event === "session") {
              sessionId = data.sessionId as string;
              setActiveId(sessionId);
            } else if (event === "delta") {
              assembled += data.text as string;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assembled,
                  pending: true,
                };
                return copy;
              });
            } else if (event === "done") {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: (data.content as string) || assembled,
                };
                return copy;
              });
            } else if (event === "error") {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: `Error: ${data.message}`,
                };
                return copy;
              });
            }
          }
        }

        await reloadSessions();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `Error: ${message}`,
          };
          return copy;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    };

    const containerClass =
      variant === "rail"
        ? "flex h-full flex-col"
        : "flex h-full flex-col rounded-lg border border-border bg-white";

    return (
      <div className={cn(containerClass, className)}>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {showHistory && (
              <button
                onClick={() => setShowHistory(false)}
                className="flex p-1 text-[color:var(--text-secondary)] hover:text-foreground"
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight">
                {showHistory ? "Chat History" : title}
              </div>
              {!showHistory && entity && (
                <div className="mt-0.5 text-[11px] text-[color:var(--text-tertiary)]">
                  {entityLabel} context
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {!showHistory && (
              <>
                <HeaderBtn onClick={handleNewChat} title="New chat">
                  <Plus className="h-3.5 w-3.5" />
                </HeaderBtn>
                <HeaderBtn
                  onClick={() => setShowHistory(true)}
                  title="History"
                >
                  <History className="h-3.5 w-3.5" />
                </HeaderBtn>
              </>
            )}
            {onCloseRail && (
              <HeaderBtn onClick={onCloseRail} title="Close">
                <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
              </HeaderBtn>
            )}
          </div>
        </div>

        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-2">
            <button
              onClick={handleNewChat}
              className="mb-1 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-transparent px-3 py-2.5 text-[13px] font-medium text-[color:var(--brand)] hover:bg-[color:var(--brand-soft)]"
            >
              <Plus className="h-3.5 w-3.5" />
              New conversation
            </button>
            {loadingSessions && (
              <div className="px-3 py-2 text-xs text-[color:var(--text-tertiary)]">
                Loading…
              </div>
            )}
            {sessions.map((s) => {
              const isActive = s.id === activeId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveId(s.id);
                    setShowHistory(false);
                  }}
                  className={cn(
                    "mb-0.5 flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 transition-colors",
                    isActive
                      ? "bg-[color:var(--brand-soft)]"
                      : "hover:bg-[color:var(--surface-hover)]"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "truncate text-[13px] font-medium tracking-tight",
                        isActive ? "text-[color:var(--brand)]" : "text-foreground"
                      )}
                    >
                      {s.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[color:var(--text-tertiary)]">
                      {fmtRelative(s.updated_at)} · {s.message_count} messages
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(s.id);
                    }}
                    className="rounded p-1 opacity-30 transition-opacity hover:opacity-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[color:var(--negative)]" />
                  </button>
                </div>
              );
            })}
            {!loadingSessions && sessions.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-[color:var(--text-tertiary)]">
                No conversations yet.
              </div>
            )}
          </div>
        ) : (
          <>
            {migrationMissing && (
              <div className="shrink-0 border-b border-[color:var(--border-muted)] bg-[color:var(--mixed-soft)] px-4 py-2 text-[12px] leading-snug text-[color:var(--mixed)]">
                Chat history disabled — apply{" "}
                <code className="rounded bg-white/60 px-1 py-0.5">
                  supabase/migrations/20260417_chat.sql
                </code>{" "}
                to enable persistence.
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="py-10 text-center">
                  <div className="text-sm leading-relaxed text-[color:var(--text-tertiary)]">
                    Ask anything about {entityLabel ?? "the selected entity"}&apos;s
                    reputation data, narrative threads, or sentiment trends.
                  </div>
                  <div className="mt-5 flex flex-col gap-1.5">
                    {SUGGESTED.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(q)}
                        className="rounded-md border border-border bg-white px-3.5 py-2 text-left text-[13px] text-[color:var(--text-secondary)] hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={m.id ?? i}
                  className={cn(
                    "mb-4 flex flex-col",
                    m.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {m.role === "assistant" && (
                    <div className="mb-1 ml-0.5 text-[11px] font-medium text-[color:var(--text-tertiary)]">
                      BrandPulse
                    </div>
                  )}
                  {m.pending && m.content.length === 0 ? (
                    <div className="flex gap-1.5 rounded-[14px_14px_14px_4px] bg-[color:var(--surface)] px-4 py-3">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full bg-[color:var(--text-tertiary)]"
                          style={{
                            animation: `bpPulse 1.2s ease-in-out ${d * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "max-w-[90%] whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-relaxed tracking-tight",
                        m.role === "user"
                          ? "rounded-[14px_14px_4px_14px] bg-[#1a1a1a] text-white"
                          : "rounded-[14px_14px_14px_4px] bg-[color:var(--surface)] text-foreground"
                      )}
                    >
                      {m.content}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 border-t border-[color:var(--border-muted)] px-4 pb-4 pt-3">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-[color:var(--surface)] py-2 pl-3.5 pr-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 80) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    entity
                      ? "Ask about reputation data…"
                      : "Select an entity to start chatting"
                  }
                  rows={1}
                  disabled={!entity}
                  className="flex-1 resize-none border-0 bg-transparent py-1 text-[13px] leading-snug outline-none disabled:opacity-50"
                  style={{ minHeight: 20, maxHeight: 80 }}
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || isStreaming || !entity}
                  aria-label="Send"
                  className={cn(
                    "flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-colors",
                    input.trim() && !isStreaming && entity
                      ? "bg-[#1a1a1a]"
                      : "bg-border"
                  )}
                  style={{ height: 30, width: 30 }}
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);

function HeaderBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center rounded-md p-1.5 text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-hover)]"
    >
      {children}
    </button>
  );
}
