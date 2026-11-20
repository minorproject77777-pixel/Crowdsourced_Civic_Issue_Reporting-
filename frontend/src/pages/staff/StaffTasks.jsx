import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { staffService } from '../../services/staffService';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const FILTERS = ['All', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

export default function StaffTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    staffService.getMyTasks().then((res) => setTasks(res.tasks)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Assigned Tasks</h1>

      <div className="mt-4 mb-6 flex flex-wrap gap-2">
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

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tasks found" description="Nothing matches this filter." />
      ) : (
        <div className="card divide-y divide-ink-100">
          {filtered.map((task) => (
            <Link key={task._id} to={`/staff/tasks/${task._id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-ink-50/50">
              <div className="min-w-0">
                <p className="text-xs font-medium text-marigold-dark">{task.issueId}</p>
                <p className="truncate text-sm font-medium text-ink-800">{task.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate">{task.address}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
