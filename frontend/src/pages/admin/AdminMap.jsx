import { useEffect, useMemo, useState } from 'react';
import { adminService } from '../../services/adminService';
import IssueMap from '../../components/IssueMap';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUSES = ['REPORTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'REJECTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const LEGEND = [
  { label: 'Critical', color: '#C4453D' },
  { label: 'High', color: '#E8A23D' },
  { label: 'Medium', color: '#EAD25D' },
  { label: 'Low', color: '#3F7A5C' },
  { label: 'Resolved', color: '#9AA1AC' },
];

export default function AdminMap() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    adminService.getAllIssues().then((res) => setIssues(res.issues)).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => [...new Set(issues.map((i) => i.category))], [issues]);

  const filtered = issues.filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (priorityFilter && i.priority !== priorityFilter) return false;
    if (categoryFilter && i.category !== categoryFilter) return false;
    return true;
  });

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Issue Map</h1>
      <p className="mt-1.5 text-slate">{filtered.length} issues shown across the city.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select className="input-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input-field w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input-field w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <IssueMap issues={filtered} height="600px" />
      </div>
    </div>
  );
}
