import { getEntitySelection } from "@/lib/entity";
import { PageHeader } from "@/components/page-header";
import { NoEntity } from "@/components/no-entity";
import { ChatSurface } from "@/components/chat/chat-surface";

export default async function ChatPage() {
  const { selected } = await getEntitySelection();

  if (!selected) {
    return (
      <>
        <PageHeader title="Chat" />
        <NoEntity />
      </>
    );
  }

  return (
    <>
      <PageHeader title={selected} subtitle="Chat" />
      <div className="h-[calc(100vh-10rem)] min-h-[520px]">
        <ChatSurface entity={selected} variant="page" />
      </div>
    </>
  );
}
