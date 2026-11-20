const STYLES = {
  LOW: 'bg-moss/15 text-moss',
  MEDIUM: 'bg-marigold/20 text-marigold-dark',
  HIGH: 'bg-signal/15 text-signal',
  CRITICAL: 'bg-signal text-white',
};

export default function PriorityBadge({ priority, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[priority] || ''} ${className}`}>
      {priority}
    </span>
  );
}
