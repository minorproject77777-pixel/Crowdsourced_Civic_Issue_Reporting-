const STYLES = {
  REPORTED: 'bg-slate/10 text-slate',
  UNDER_REVIEW: 'bg-ink-100 text-ink-600',
  VERIFIED: 'bg-ink-100 text-ink-700',
  ASSIGNED: 'bg-marigold/15 text-marigold-dark',
  IN_PROGRESS: 'bg-marigold/20 text-marigold-dark',
  RESOLVED: 'bg-moss/15 text-moss',
  REOPENED: 'bg-signal/15 text-signal',
  REJECTED: 'bg-signal/10 text-signal/80',
};

const LABELS = {
  REPORTED: 'Reported',
  UNDER_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  REOPENED: 'Reopened',
  REJECTED: 'Rejected',
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] || 'bg-ink-100 text-ink-600'} ${className}`}
    >
      {LABELS[status] || status}
    </span>
  );
}
