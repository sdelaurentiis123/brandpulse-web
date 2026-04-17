export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
      {subtitle && (
        <div className="mt-1 text-[13px] text-[color:var(--text-tertiary)]">
          {subtitle}
        </div>
      )}
    </div>
  );
}
