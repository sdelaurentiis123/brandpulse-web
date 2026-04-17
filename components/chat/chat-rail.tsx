"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { ChatSurface } from "./chat-surface";

const COOKIE = "bp_chat_open";

function setCookie(value: string) {
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function ChatRail({
  entity,
  entityDisplay,
  userId,
  initialOpen,
}: {
  entity: string | null;
  entityDisplay: string | null;
  userId: string;
  initialOpen: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    setCookie(open ? "1" : "0");
  }, [open]);

  // Hide the rail on /chat — the page itself is the chat surface.
  if (pathname.startsWith("/chat")) return null;
  // Ensure a consistent user key for future per-user rail state if we extend it.
  void userId;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a1a1a] text-white shadow-lg hover:bg-black"
        aria-label="Open chat"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    );
  }

  return (
    <aside className="flex h-screen w-[380px] shrink-0 flex-col border-l border-border bg-white">
      <ChatSurface
        entity={entity}
        entityDisplay={entityDisplay}
        variant="rail"
        onCloseRail={() => setOpen(false)}
      />
    </aside>
  );
}
