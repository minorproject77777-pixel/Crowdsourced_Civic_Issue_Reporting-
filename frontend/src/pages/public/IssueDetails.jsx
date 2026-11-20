import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, ArrowUp, MessageSquare, Calendar, User, ImageOff,
  CheckCircle2, Circle, Star, AlertTriangle,
} from 'lucide-react';
import { issueService } from '../../services/issueService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import IssueMap from '../../components/IssueMap';

const API_ORIGIN = (import.meta.env.API_URL || 'http://localhost:5000/api').replace('/api', '');

const TIMELINE_STEPS = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

export default function IssueDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showVerifyForm, setShowVerifyForm] = useState(null); // 'fixed' | 'not-fixed' | null

  const load = useCallback(() => {
    issueService
      .getById(id)
      .then((res) => setData(res))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpvote() {
    if (!user) return toast.info('Log in to upvote this issue.');
    try {
      const res = data.hasUpvoted ? await issueService.removeUpvote(data.issue._id) : await issueService.upvote(data.issue._id);
      setData((d) => ({ ...d, hasUpvoted: !d.hasUpvoted, issue: { ...d.issue, upvoteCount: res.upvoteCount } }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) return toast.info('Log in to comment.');
    setPosting(true);
    try {
      const res = await issueService.addComment(data.issue._id, commentText.trim());
      setData((d) => ({ ...d, comments: [...d.comments, res.comment] }));
      setCommentText('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <LoadingSpinner full label="Loading issue..." />;
  if (!data) return null;

  const { issue, comments, history, hasUpvoted } = data;
  const isReporter = user && issue.reportedBy?._id === user.id;
  const currentStepIndex = TIMELINE_STEPS.indexOf(issue.status);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-marigold-dark">{issue.issueId}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-800 sm:text-3xl">{issue.title}</h1>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Images */}
          <div className="card overflow-hidden">
            <div className="aspect-video w-full bg-ink-50">
              {issue.images?.length > 0 ? (
                <img
                  src={`${API_ORIGIN}${issue.images[activeImage]?.url}`}
                  alt={issue.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-200">
                  <ImageOff size={40} />
                </div>
              )}
            </div>
            {issue.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {issue.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
                      activeImage === i ? 'border-marigold' : 'border-transparent'
                    }`}
                  >
                    <img src={`${API_ORIGIN}${img.url}`} alt="" className="h-full w-full object-cover" />
                    <span className="sr-only">{img.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="panel">
            <h2 className="font-display text-base font-semibold text-ink-800">Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{issue.description}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate">
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {issue.address}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(issue.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><User size={13} /> {issue.reportedBy?.name || 'Citizen'}</span>
            </div>
          </div>

          {/* Map */}
          <div>
            <h2 className="mb-3 font-display text-base font-semibold text-ink-800">Location</h2>
            <IssueMap issues={[issue]} height="280px" center={[issue.location.coordinates[1], issue.location.coordinates[0]]} />
          </div>

          {/* Status timeline */}
          {!['REJECTED'].includes(issue.status) && (
            <div className="panel">
              <h2 className="font-display text-base font-semibold text-ink-800">Status Timeline</h2>
              <div className="mt-5 flex items-center justify-between">
                {TIMELINE_STEPS.map((step, i) => {
                  const reached = currentStepIndex >= i || issue.status === 'REOPENED';
                  const isReopenedPast = issue.status === 'REOPENED' && step === 'RESOLVED';
                  return (
                    <div key={step} className="flex flex-1 flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        {i > 0 && <div className={`h-0.5 flex-1 ${reached ? 'bg-moss' : 'bg-ink-100'}`} />}
                        {reached && !isReopenedPast ? (
                          <CheckCircle2 size={20} className="shrink-0 text-moss" />
                        ) : isReopenedPast ? (
                          <AlertTriangle size={20} className="shrink-0 text-signal" />
                        ) : (
                          <Circle size={20} className="shrink-0 text-ink-200" />
                        )}
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 ${currentStepIndex > i ? 'bg-moss' : 'bg-ink-100'}`} />
                        )}
                      </div>
                      <p className="mt-2 text-[11px] font-medium text-ink-600">{step.replace('_', ' ')}</p>
                    </div>
                  );
                })}
              </div>
              {issue.status === 'REOPENED' && (
                <p className="mt-4 rounded-md bg-signal/10 px-3 py-2 text-xs text-signal">
                  This issue was reopened: {issue.reopenReason}
                </p>
              )}
              {history?.length > 0 && (
                <div className="mt-5 space-y-2 border-t border-ink-100 pt-4">
                  {history.map((h) => (
                    <div key={h._id} className="flex items-center justify-between text-xs text-slate">
                      <span>
                        {h.fromStatus ? `${h.fromStatus.replace('_', ' ')} → ` : ''}
                        <span className="font-medium text-ink-700">{h.toStatus.replace('_', ' ')}</span>
                        {h.changedBy?.name ? ` by ${h.changedBy.name}` : ''}
                      </span>
                      <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Citizen resolution verification */}
          {isReporter && issue.status === 'RESOLVED' && !issue.citizenVerifiedAt && (
            <div className="panel border-marigold/40 bg-marigold/5">
              <h2 className="font-display text-base font-semibold text-ink-800">This issue has been marked as resolved.</h2>
              <p className="mt-1 text-sm text-slate">Was the issue actually fixed?</p>

              {!showVerifyForm && (
                <div className="mt-4 flex gap-3">
                  <button onClick={() => setShowVerifyForm('fixed')} className="btn-accent">Yes, it's fixed</button>
                  <button
                    onClick={() => setShowVerifyForm('not-fixed')}
                    className="inline-flex items-center justify-center rounded-md border border-signal px-5 py-2.5 text-sm font-semibold text-signal hover:bg-signal/5"
                  >
                    No, still exists
                  </button>
                </div>
              )}

              {showVerifyForm === 'fixed' && (
                <VerifyFixedForm
                  onCancel={() => setShowVerifyForm(null)}
                  onSubmit={async (rating, comment) => {
                    try {
                      const res = await issueService.verifyResolution(issue._id, { confirmed: true, rating, comment });
                      setData((d) => ({ ...d, issue: res.issue }));
                      toast.success('Thanks for confirming! You earned 5 civic points.');
                      setShowVerifyForm(null);
                    } catch (err) {
                      toast.error(getErrorMessage(err));
                    }
                  }}
                />
              )}

              {showVerifyForm === 'not-fixed' && (
                <ReportStillExistsForm
                  onCancel={() => setShowVerifyForm(null)}
                  onSubmit={async (reason) => {
                    try {
                      const res = await issueService.verifyResolution(issue._id, { confirmed: false, reasonIfNotFixed: reason });
                      setData((d) => ({ ...d, issue: res.issue }));
                      toast.info('The issue has been reopened for further action.');
                      setShowVerifyForm(null);
                    } catch (err) {
                      toast.error(getErrorMessage(err));
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Comments */}
          <div className="panel">
            <h2 className="font-display text-base font-semibold text-ink-800">
              Comments <span className="text-slate font-normal">({comments.length})</span>
            </h2>
            <div className="mt-4 space-y-4">
              {comments.length === 0 && <p className="text-sm text-slate">No comments yet. Be the first to comment.</p>}
              {comments.map((c) => (
                <div key={c._id} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700">
                    {c.author?.name?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink-800">{c.author?.name || 'Citizen'}</p>
                      <p className="text-xs text-slate">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-700">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="mt-5 flex gap-2">
              <input
                className="input-field flex-1"
                placeholder={user ? 'Add a comment...' : 'Log in to comment'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!user}
              />
              <button type="submit" disabled={posting || !user} className="btn-outline shrink-0">
                Post
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="panel">
            <button
              onClick={handleUpvote}
              className={`flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
                hasUpvoted ? 'border-marigold bg-marigold/10 text-marigold-dark' : 'border-ink-100 text-ink-700 hover:border-marigold'
              }`}
            >
              <ArrowUp size={16} /> {hasUpvoted ? 'Upvoted' : 'Upvote'} · {issue.upvoteCount}
            </button>
            <p className="mt-2 text-center text-xs text-slate">
              {issue.upvoteCount} citizen{issue.upvoteCount === 1 ? '' : 's'} affected
            </p>
          </div>

          <div className="panel space-y-3 text-sm">
            <h3 className="font-display font-semibold text-ink-800">Issue details</h3>
            <div className="flex justify-between"><span className="text-slate">Category</span><span className="font-medium text-ink-700">{issue.category}</span></div>
            <div className="flex justify-between"><span className="text-slate">Department</span><span className="font-medium text-ink-700">{issue.department?.name || 'Not assigned'}</span></div>
            <div className="flex justify-between"><span className="text-slate">Assigned to</span><span className="font-medium text-ink-700">{issue.assignedTo?.name || 'Not assigned'}</span></div>
            <div className="flex justify-between"><span className="text-slate">Comments</span><span className="font-medium text-ink-700 flex items-center gap-1"><MessageSquare size={13} />{comments.length}</span></div>
            {issue.citizenRating && (
              <div className="flex justify-between">
                <span className="text-slate">Citizen rating</span>
                <span className="flex items-center gap-0.5 font-medium text-ink-700">
                  {issue.citizenRating} <Star size={13} className="fill-marigold text-marigold" />
                </span>
              </div>
            )}
          </div>

          <Link to="/issues" className="block text-center text-sm font-medium text-marigold-dark hover:underline">
            ← Back to all issues
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerifyFixedForm({ onSubmit, onCancel }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  return (
    <div className="mt-4 space-y-3">
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-700">Rate the resolution</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} type="button">
              <Star size={22} className={n <= rating ? 'fill-marigold text-marigold' : 'text-ink-200'} />
            </button>
          ))}
        </div>
      </div>
      <textarea
        className="input-field"
        rows={2}
        placeholder="Any feedback? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={() => onSubmit(rating, comment)} className="btn-accent">Submit feedback</button>
        <button onClick={onCancel} className="btn-outline">Cancel</button>
      </div>
    </div>
  );
}

function ReportStillExistsForm({ onSubmit, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="mt-4 space-y-3">
      <textarea
        className="input-field"
        rows={3}
        placeholder="Please describe what still needs fixing..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={() => reason.trim() && onSubmit(reason.trim())}
          disabled={!reason.trim()}
          className="inline-flex items-center justify-center rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-white hover:bg-signal/90 disabled:opacity-50"
        >
          Reopen this issue
        </button>
        <button onClick={onCancel} className="btn-outline">Cancel</button>
      </div>
    </div>
  );
}
