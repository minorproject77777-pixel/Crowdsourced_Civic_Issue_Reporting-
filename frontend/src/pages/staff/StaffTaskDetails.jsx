import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, User, Phone, Camera, CheckCircle2 } from 'lucide-react';
import { staffService } from '../../services/staffService';
import { issueService } from '../../services/issueService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import IssueMap from '../../components/IssueMap';

const API_ORIGIN = (import.meta.env.API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function StaffTaskDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [task, setTask] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remark, setRemark] = useState('');
  const [progressFile, setProgressFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    staffService.getTaskById(id).then((res) => {
      setTask(res.task);
      setHistory(res.history);
    }).catch((err) => toast.error(getErrorMessage(err))).finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleAccept() {
    try {
      await staffService.acceptTask(id);
      toast.success('Task accepted — work marked as started.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleProgressSubmit(e) {
    e.preventDefault();
    if (!remark.trim() && !progressFile) {
      toast.error('Add a remark or a photo before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (remark.trim()) formData.append('remark', remark.trim());
      if (progressFile) {
        formData.append('image', progressFile);
        formData.append('imageType', 'progress');
      }
      await issueService.addProgress(id, formData);
      toast.success('Progress update added.');
      setRemark('');
      setProgressFile(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete() {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('imageType', 'after');
      if (progressFile) formData.append('image', progressFile);
      if (remark.trim()) formData.append('remark', remark.trim());
      if (progressFile || remark.trim()) await issueService.addProgress(id, formData);
      await issueService.changeStatus(id, { status: 'RESOLVED' });
      toast.success('Task marked as completed and sent for review.');
      setRemark('');
      setProgressFile(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner full />;
  if (!task) return null;

  const canComplete = ['ASSIGNED', 'IN_PROGRESS'].includes(task.status);

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/staff/tasks" className="text-sm font-medium text-marigold-dark hover:underline">← Back to tasks</Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-marigold-dark">{task.issueId}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-800">{task.title}</h1>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      <div className="mt-6 panel">
        <p className="text-sm leading-relaxed text-ink-700">{task.description}</p>
        <div className="mt-4 grid gap-2 text-sm text-ink-600 sm:grid-cols-2">
          <span className="flex items-center gap-1.5"><MapPin size={14} /> {task.address}</span>
          <span className="flex items-center gap-1.5"><User size={14} /> {task.reportedBy?.name}</span>
          {task.reportedBy?.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {task.reportedBy.phone}</span>}
        </div>
      </div>

      <div className="mt-6">
        <IssueMap issues={[task]} height="240px" center={[task.location.coordinates[1], task.location.coordinates[0]]} />
      </div>

      {task.images?.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-display text-base font-semibold text-ink-800">Photos</h2>
          <div className="flex gap-2 overflow-x-auto">
            {task.images.map((img, i) => (
              <div key={i} className="shrink-0">
                <img src={`${API_ORIGIN}${img.url}`} alt={img.type} className="h-24 w-24 rounded-md object-cover" />
                <p className="mt-1 text-center text-[10px] capitalize text-slate">{img.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {task.status === 'ASSIGNED' && (
        <div className="mt-6 panel border-marigold/40 bg-marigold/5">
          <p className="text-sm font-medium text-ink-800">This task is waiting for you to accept it.</p>
          <button onClick={handleAccept} className="btn-accent mt-3">Accept & start work</button>
        </div>
      )}

      {canComplete && (
        <div className="mt-6 panel">
          <h2 className="font-display text-base font-semibold text-ink-800">Add progress update</h2>
          <form onSubmit={handleProgressSubmit} className="mt-3 space-y-3">
            <textarea
              className="input-field"
              rows={3}
              placeholder="Describe the work done so far..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-ink-200 px-3.5 py-2 text-sm text-ink-700 hover:border-marigold">
              <Camera size={15} /> {progressFile ? progressFile.name : 'Attach a photo'}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setProgressFile(e.target.files[0])}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={submitting} className="btn-outline">Save update</button>
              <button type="button" onClick={handleComplete} disabled={submitting} className="btn-accent">
                <CheckCircle2 size={16} /> Mark task completed
              </button>
            </div>
          </form>
        </div>
      )}

      {task.staffRemarks?.length > 0 && (
        <div className="mt-6 panel">
          <h2 className="font-display text-base font-semibold text-ink-800">Remarks log</h2>
          <div className="mt-3 space-y-3">
            {task.staffRemarks.map((r, i) => (
              <div key={i} className="border-l-2 border-ink-100 pl-3">
                <p className="text-sm text-ink-700">{r.text}</p>
                <p className="mt-0.5 text-xs text-slate">{new Date(r.addedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {history?.length > 0 && (
        <div className="mt-6 panel">
          <h2 className="font-display text-base font-semibold text-ink-800">History</h2>
          <div className="mt-3 space-y-2">
            {history.map((h) => (
              <div key={h._id} className="flex items-center justify-between text-xs text-slate">
                <span>{h.fromStatus ? `${h.fromStatus.replace('_', ' ')} → ` : ''}<span className="font-medium text-ink-700">{h.toStatus.replace('_', ' ')}</span></span>
                <span>{new Date(h.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
