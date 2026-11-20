export default function StatCard({ label, value, icon: Icon, accent = 'ink' }) {
  const accentStyles = {
    ink: 'bg-ink-50 text-ink-700',
    marigold: 'bg-marigold/15 text-marigold-dark',
    moss: 'bg-moss/15 text-moss',
    signal: 'bg-signal/15 text-signal',
  };
  return (
    <div className="panel flex items-center gap-4">
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${accentStyles[accent]}`}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="font-display text-2xl font-semibold text-ink-800 tabular-nums">{value}</p>
        <p className="text-xs text-slate">{label}</p>
      </div>
    </div>
  );
}
