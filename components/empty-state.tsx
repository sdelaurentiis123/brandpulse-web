export function EmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-8 text-center">
      <div className="text-sm font-medium">{title}</div>
      {message && (
        <div className="mt-2 text-xs text-[color:var(--text-tertiary)] leading-relaxed max-w-md mx-auto">
          {message}
        </div>
      )}
    </div>
  );
}
