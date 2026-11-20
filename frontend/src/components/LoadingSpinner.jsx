export default function LoadingSpinner({ label = 'Loading...', full = false }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${full ? 'py-24' : 'py-10'}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-marigold" />
      <span className="text-sm text-slate">{label}</span>
    </div>
  );
}
