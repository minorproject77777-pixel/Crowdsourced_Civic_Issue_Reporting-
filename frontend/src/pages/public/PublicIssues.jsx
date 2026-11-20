import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { issueService } from '../../services/issueService';
import { categoryService } from '../../services/categoryService';
import IssueCard from '../../components/IssueCard';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';

const STATUSES = ['REPORTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'REJECTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function PublicIssues() {
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [filters, setFilters] = useState({ search: '', category: '', status: '', priority: '', page: 1 });

  useEffect(() => {
    categoryService.list().then((res) => setCategories(res.categories)).catch(() => {});
  }, []);

  const fetchIssues = useCallback(() => {
    setLoading(true);
    const params = { ...filters };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    issueService
      .list(params)
      .then((res) => {
        setIssues(res.issues);
        setPagination(res.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  function clearFilters() {
    setFilters({ search: '', category: '', status: '', priority: '', page: 1 });
  }

  const activeFilterCount = ['category', 'status', 'priority'].filter((k) => filters[k]).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink-800">Explore Issues</h1>
        <p className="mt-1.5 text-slate">Browse civic issues reported by citizens across the city.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            className="input-field pl-9"
            placeholder="Search by ID, title or location (e.g. CF-1024)"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="btn-outline shrink-0"
        >
          <SlidersHorizontal size={15} />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      {showFilters && (
        <div className="mb-8 grid grid-cols-1 gap-4 rounded-lg border border-ink-100 bg-white p-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate">Category</label>
            <select className="input-field" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate">Status</label>
            <select className="input-field" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate">Priority</label>
            <select className="input-field" value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)}>
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink-700">
              <X size={14} /> Clear all
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No issues found"
          description="Try adjusting your search or filters."
          action={<button onClick={clearFilters} className="btn-outline">Clear filters</button>}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => <IssueCard key={issue._id} issue={issue} />)}
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </>
      )}
    </div>
  );
}
