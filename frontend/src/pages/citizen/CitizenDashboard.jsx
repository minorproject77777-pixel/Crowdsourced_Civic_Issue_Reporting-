import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Loader, CheckCircle2, Award, Plus, Bell } from 'lucide-react';
import { issueService } from '../../services/issueService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([issueService.mine(), notificationService.list()])
      .then(([issuesRes, notifRes]) => {
        setIssues(issuesRes.issues);
        setNotifications(notifRes.notifications.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner full label="Loading your dashboard..." />;

  const stats = {
    total: issues.length,
    pending: issues.filter((i) => ['REPORTED', 'UNDER_REVIEW'].includes(i.status)).length,
    inProgress: issues.filter((i) => ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status)).length,
    resolved: issues.filter((i) => i.status === 'RESOLVED').length,
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-slate">Here's what's happening with your reports.</p>
        </div>
        <Link to="/report" className="btn-accent">
          <Plus size={16} /> Report an Issue
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Reports" value={stats.total} icon={FileText} accent="ink" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="marigold" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Loader} accent="marigold" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} accent="moss" />
        <StatCard label="Civic Points" value={user.civicPoints} icon={Award} accent="signal" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-800">Recent complaints</h2>
            <Link to="/my-issues" className="text-sm font-semibold text-marigold-dark hover:underline">View all →</Link>
          </div>
          {issues.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No complaints yet"
              description="Report your first civic issue to get started."
              action={<Link to="/report" className="btn-accent">Report an Issue</Link>}
            />
          ) : (
            <div className="card divide-y divide-ink-100">
              {issues.slice(0, 6).map((issue) => (
                <Link key={issue._id} to={`/issues/${issue.issueId}`} className="flex items-center justify-between gap-4 p-4 hover:bg-ink-50/50">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-marigold-dark">{issue.issueId}</p>
                    <p className="truncate text-sm font-medium text-ink-800">{issue.title}</p>
                    <p className="mt-0.5 text-xs text-slate">{new Date(issue.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={issue.status} className="shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-800">Notifications</h2>
            <Link to="/notifications" className="text-sm font-semibold text-marigold-dark hover:underline">View all →</Link>
          </div>
          {notifications.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate">No notifications yet.</div>
          ) : (
            <div className="card divide-y divide-ink-100">
              {notifications.map((n) => (
                <div key={n._id} className="flex items-start gap-2.5 p-3.5">
                  <Bell size={14} className={`mt-0.5 shrink-0 ${n.isRead ? 'text-ink-200' : 'text-marigold'}`} />
                  <div>
                    <p className="text-sm text-ink-700">{n.message}</p>
                    <p className="mt-0.5 text-xs text-slate">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
