import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { issueService } from '../../services/issueService';
import IssueCard from '../../components/IssueCard';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

const FILTERS = ['All', 'REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'];

export default function MyIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    issueService.mine().then((res) => setIssues(res.issues)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? issues : issues.filter((i) => i.status === filter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">My Complaints</h1>
        <Link to="/report" className="btn-accent"><Plus size={16} /> Report an Issue</Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              filter === f ? 'bg-ink-700 text-paper' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No complaints found" description="Nothing matches this filter yet." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((issue) => <IssueCard key={issue._id} issue={issue} />)}
        </div>
      )}
    </div>
  );
}
