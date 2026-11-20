import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, FileText, ShieldCheck, UserCog, Wrench, CheckCircle2,
  Trash2, Construction, Droplet, Waves, Lightbulb, AlertOctagon,
} from 'lucide-react';
import { issueService } from '../../services/issueService';
import IssueCard from '../../components/IssueCard';
import SkeletonCard from '../../components/SkeletonCard';

const STEPS = [
  { n: '01', title: 'Report', desc: 'Snap a photo, pin the location, describe the problem.', icon: FileText },
  { n: '02', title: 'Verify', desc: 'A municipal officer reviews and confirms the complaint.', icon: ShieldCheck },
  { n: '03', title: 'Assign', desc: 'The right department and staff member are assigned.', icon: UserCog },
  { n: '04', title: 'Resolve', desc: 'Ground staff fix the issue and log proof of work.', icon: Wrench },
  { n: '05', title: 'Confirm', desc: 'You verify the fix and rate the resolution.', icon: CheckCircle2 },
];

const CATEGORIES = [
  { name: 'Garbage', icon: Trash2 },
  { name: 'Roads', icon: Construction },
  { name: 'Water', icon: Droplet },
  { name: 'Drainage', icon: Waves },
  { name: 'Streetlights', icon: Lightbulb },
  { name: 'Sewage', icon: AlertOctagon },
];

export default function Landing() {
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  useEffect(() => {
    issueService
      .list({ limit: 6, sort: '-createdAt' })
      .then((res) => {
        setRecentIssues(res.issues);
        const resolved = res.issues.filter((i) => i.status === 'RESOLVED').length;
        setStats({
          total: res.pagination.total,
          resolved,
          active: res.issues.filter((i) => !['RESOLVED', 'REJECTED'].includes(i.status)).length,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingIssues(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-ink-700">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center rounded-full bg-marigold/15 px-3 py-1 text-xs font-semibold text-marigold">
              A civic-tech platform for Indian cities
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] text-paper sm:text-5xl">
              Report problems.
              <br />
              Improve your city.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-100">
              Help make your community cleaner, safer and better — report civic issues in minutes and
              track them through to resolution.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/report" className="btn-accent px-6 py-3 text-base">
                Report an Issue <ArrowRight size={17} />
              </Link>
              <Link to="/issues" className="inline-flex items-center justify-center gap-2 rounded-md border border-ink-500 px-6 py-3 text-base font-semibold text-paper hover:bg-ink-600">
                Explore Issues
              </Link>
            </div>
          </div>

          {/* Live stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Issues', value: stats?.total },
              { label: 'Resolved Issues', value: stats?.resolved },
              { label: 'Active Issues', value: stats?.active },
              { label: 'Registered Citizens', value: stats ? '500+' : undefined },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-ink-500 bg-ink-600/40 p-4">
                <p className="font-display text-2xl font-semibold text-paper tabular-nums">
                  {s.value !== undefined ? s.value : '—'}
                </p>
                <p className="mt-0.5 text-xs text-ink-200">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">How it works</h2>
          <p className="mt-2 text-slate">From the moment you report an issue to the moment it's fixed — every step is tracked.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step) => (
            <div key={step.n} className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-ink-50 text-ink-700">
                <step.icon size={20} />
              </div>
              <p className="mt-4 font-display text-xs font-semibold text-marigold-dark">{step.n}</p>
              <h3 className="mt-1 font-display text-base font-semibold text-ink-800">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-ink-100 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">What you can report</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to="/report"
                className="flex flex-col items-center gap-3 rounded-lg border border-ink-100 p-6 text-center transition-colors hover:border-marigold hover:bg-marigold/5"
              >
                <cat.icon size={22} className="text-ink-600" />
                <span className="text-sm font-medium text-ink-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent issues */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Recently reported</h2>
            <p className="mt-2 text-slate">Real complaints from citizens in your community.</p>
          </div>
          <Link to="/issues" className="hidden text-sm font-semibold text-marigold-dark hover:underline sm:block">
            View all →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loadingIssues
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : recentIssues.map((issue) => <IssueCard key={issue._id} issue={issue} />)}
        </div>
      </section>

      {/* Community impact */}
      <section className="bg-ink-700 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-paper sm:text-3xl">Community impact</h2>
          <p className="mt-3 text-ink-100">
            Every report matters. Together, citizens on CivicFix have helped surface and resolve issues across
            neighborhoods that would otherwise go unnoticed.
          </p>
          <Link to="/register" className="btn-accent mt-8 px-6 py-3 text-base">
            Join CivicFix <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
