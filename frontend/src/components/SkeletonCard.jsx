export default function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-36 bg-ink-100" />
      <div className="space-y-2.5 p-4">
        <div className="h-3.5 w-3/4 rounded bg-ink-100" />
        <div className="h-3 w-1/2 rounded bg-ink-100" />
        <div className="h-3 w-2/3 rounded bg-ink-100" />
      </div>
    </div>
  );
}
