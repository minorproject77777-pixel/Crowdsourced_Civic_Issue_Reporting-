import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Award, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { issueService } from '../../services/issueService';
import { authService } from '../../services/authService';

const BADGE_THRESHOLDS = [
  { points: 0, name: 'Civic Contributor' },
  { points: 100, name: 'Community Helper' },
  { points: 300, name: 'City Champion' },
];

function nextBadgeInfo(points) {
  const next = BADGE_THRESHOLDS.find((b) => b.points > points);
  return next ? { name: next.name, remaining: next.points - points } : null;
}

export default function Profile() {
  const { user, refreshUser, setUser } = useAuth();
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { name: user.name, phone: user.phone || '', ward: user.ward || '' },
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    issueService.mine().then((res) => {
      setStats({
        total: res.issues.length,
        resolved: res.issues.filter((i) => i.status === 'RESOLVED').length,
        upvotesGiven: undefined,
      });
    });
  }, []);

  async function onSubmit(data) {
    try {
      const res = await authService.updateProfile(data);
      setUser(res.user);
      localStorage.setItem('civicfix_user', JSON.stringify(res.user));
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const next = nextBadgeInfo(user.civicPoints);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Profile</h1>

      <div className="mt-6 panel flex flex-wrap items-center gap-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 text-xl font-semibold text-ink-700">
          {user.name?.[0]?.toUpperCase()}
        </span>
        <div className="flex-1">
          <p className="font-display text-lg font-semibold text-ink-800">{user.name}</p>
          <p className="text-sm text-slate">{user.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-3 py-1 text-xs font-semibold text-marigold-dark">
            <Award size={13} /> {user.badge}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold text-ink-800">{user.civicPoints}</p>
          <p className="text-xs text-slate">civic points</p>
        </div>
      </div>

      {next && (
        <p className="mt-2 text-center text-xs text-slate">
          {next.remaining} more points to reach <span className="font-semibold text-ink-700">{next.name}</span>
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="panel flex items-center gap-3">
          <FileText size={20} className="text-ink-500" />
          <div>
            <p className="font-display text-xl font-semibold text-ink-800">{stats?.total ?? '—'}</p>
            <p className="text-xs text-slate">Reports filed</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3">
          <CheckCircle2 size={20} className="text-moss" />
          <div>
            <p className="font-display text-xl font-semibold text-ink-800">{stats?.resolved ?? '—'}</p>
            <p className="text-xs text-slate">Resolved</p>
          </div>
        </div>
      </div>

      <div className="mt-6 panel">
        <h2 className="font-display text-base font-semibold text-ink-800">Edit details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Full name</label>
            <input className="input-field" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Phone</label>
            <input className="input-field" {...register('phone')} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Ward / Area</label>
            <input className="input-field" {...register('ward')} />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-accent">
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="mt-6 panel">
        <h2 className="font-display text-base font-semibold text-ink-800">Badges</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {BADGE_THRESHOLDS.map((b) => {
            const earned = user.civicPoints >= b.points;
            return (
              <div
                key={b.name}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                  earned ? 'bg-marigold/15 text-marigold-dark' : 'bg-ink-50 text-ink-300'
                }`}
              >
                <Award size={13} /> {b.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
