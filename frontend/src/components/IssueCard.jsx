import { Link } from 'react-router-dom';
import { MapPin, ArrowUp, MessageSquare, ImageOff } from 'lucide-react';
import { API_ORIGIN } from '../services/api';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export default function IssueCard({ issue }) {
  const image = issue.images?.[0];
  return (
    <Link
      to={`/issues/${issue.issueId || issue._id}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="relative h-36 w-full overflow-hidden bg-ink-50">
        {image ? (
          <img
            src={`${API_ORIGIN}${image.url}`}
            alt={issue.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-200">
            <ImageOff size={28} />
          </div>
        )}
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          <StatusBadge status={issue.status} />
        </div>
        <div className="absolute right-2.5 top-2.5">
          <PriorityBadge priority={issue.priority} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium text-marigold-dark">{issue.issueId}</p>
        <h3 className="font-display text-sm font-semibold leading-snug text-ink-800 line-clamp-2">{issue.title}</h3>
        <p className="flex items-center gap-1 text-xs text-slate">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{issue.address}</span>
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-slate">
          <span className="rounded bg-ink-50 px-2 py-0.5 font-medium text-ink-600">{issue.category}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUp size={13} /> {issue.upvoteCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={13} /> {issue.commentCount || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
