import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/sidebar";
import { ChatRail } from "@/components/chat/chat-rail";
import { EntityProvider } from "@/components/entity-context";
import { getCurrentUser, getEntitySelection } from "@/lib/entity";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { entities, selected, selectedDisplay } = await getEntitySelection();
  const cookieStore = await cookies();
  const chatOpen = cookieStore.get("bp_chat_open")?.value !== "0";

  return (
    <EntityProvider entity={selected}>
      <div className="flex min-h-screen bg-[color:var(--surface)]">
        <Sidebar entities={entities} selected={selected} />

        <main className="flex-1 min-w-0 overflow-auto">
          <div
            className="mx-auto px-9 py-8"
            style={{ maxWidth: 960 }}
          >
            {children}
          </div>
        </main>

        <ChatRail
          entity={selected}
          entityDisplay={selectedDisplay}
          userId={user.id}
          initialOpen={chatOpen}
        />
      </div>
    </EntityProvider>
  );
}
