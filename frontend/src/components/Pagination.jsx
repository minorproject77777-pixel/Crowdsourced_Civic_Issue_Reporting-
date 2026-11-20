import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-100 text-ink-600 disabled:opacity-40 hover:border-ink-300"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-slate">…</span>}
          <button
            onClick={() => onChange(p)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
              p === page ? 'bg-ink-700 text-paper' : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-100 text-ink-600 disabled:opacity-40 hover:border-ink-300"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
