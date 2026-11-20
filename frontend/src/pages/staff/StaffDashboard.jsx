import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader, CheckCircle2, AlertTriangle } from 'lucide-react';
import { staffService } from '../../services/staffService';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService.getMyTasks().then((res) => {
      setTasks(res.tasks);
      setSummary(res.summary);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner full />;

  const priorityTasks = tasks
    .filter((t) => !['RESOLVED', 'REJECTED'].includes(t.status))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 6);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Welcome, {user.name.split(' ')[0]}</h1>
      <p className="mt-1.5 text-slate">Here are your assigned tasks.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Assigned" value={summary.assigned} icon={ClipboardList} accent="marigold" />
        <StatCard label="In Progress" value={summary.inProgress} icon={Loader} accent="marigold" />
        <StatCard label="Completed" value={summary.completed} icon={CheckCircle2} accent="moss" />
        <StatCard label="Overdue" value={summary.overdue} icon={AlertTriangle} accent="signal" />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-800">Priority tasks</h2>
          <Link to="/staff/tasks" className="text-sm font-semibold text-marigold-dark hover:underline">View all →</Link>
        </div>
        {priorityTasks.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No active tasks" description="You're all caught up." />
        ) : (
          <div className="card divide-y divide-ink-100">
            {priorityTasks.map((task) => (
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
    </div>
  );
}
