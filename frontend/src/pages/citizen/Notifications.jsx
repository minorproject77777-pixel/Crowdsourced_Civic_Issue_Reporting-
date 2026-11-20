import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    notificationService.list().then((res) => setNotifications(res.notifications)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function markAllRead() {
    await notificationService.markAllAsRead();
    load();
  }

  async function markRead(id) {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  }

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm font-semibold text-marigold-dark hover:underline">
            <CheckCheck size={15} /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You'll see updates about your complaints here." />
      ) : (
        <div className="card divide-y divide-ink-100">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`flex items-start justify-between gap-3 p-4 ${!n.isRead ? 'bg-marigold/5 cursor-pointer' : ''}`}
            >
              <div className="flex items-start gap-3">
                <Bell size={16} className={`mt-0.5 shrink-0 ${n.isRead ? 'text-ink-200' : 'text-marigold'}`} />
                <div>
                  <p className="text-sm text-ink-800">{n.message}</p>
                  <p className="mt-1 text-xs text-slate">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {n.issue?.issueId && (
                <Link
                  to={`/issues/${n.issue.issueId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-xs font-semibold text-marigold-dark hover:underline"
                >
                  View →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
