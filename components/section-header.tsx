export function SectionHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      {right}
    </div>
  );
}
