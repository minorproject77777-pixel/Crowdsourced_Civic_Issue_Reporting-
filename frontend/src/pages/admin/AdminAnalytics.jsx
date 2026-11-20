import { useEffect, useState } from 'react';
import {
  FileText, CheckCircle2, Clock, RotateCcw, TrendingUp, Timer, AlertOctagon, Users,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

export default function AdminAnalytics() {
  const [range, setRange] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [areas, setAreas] = useState([]);
  const [trends, setTrends] = useState([]);
  const [staffPerf, setStaffPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsService.getOverview({ range }),
      analyticsService.getCategories(),
      analyticsService.getDepartments(),
      analyticsService.getAreas(),
      analyticsService.getTrends(6),
      analyticsService.getStaffPerformance(),
    ])
      .then(([ov, cat, dept, area, tr, staff]) => {
        setOverview(ov.overview);
        setCategories(cat.categories);
        setDepartments(dept.departments);
        setAreas(area.areas);
        setTrends(tr.trends);
        setStaffPerf(staff.staffPerformance);
      })
      .finally(() => setLoading(false));
  }, [range]);

  if (loading || !overview) return <LoadingSpinner full label="Crunching the numbers..." />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Analytics</h1>
          <p className="mt-1.5 text-slate">All figures are computed live from the database.</p>
        </div>
        <div className="flex gap-1 rounded-md border border-ink-100 bg-white p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${range === r.value ? 'bg-ink-700 text-paper' : 'text-slate hover:bg-ink-50'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Complaints" value={overview.totalComplaints} icon={FileText} accent="ink" />
        <StatCard label="Resolved" value={overview.resolvedComplaints} icon={CheckCircle2} accent="moss" />
        <StatCard label="Pending" value={overview.pendingComplaints} icon={Clock} accent="marigold" />
        <StatCard label="Reopened" value={overview.reopenedComplaints} icon={RotateCcw} accent="signal" />
        <StatCard label="Resolution Rate" value={`${overview.resolutionRate}%`} icon={TrendingUp} accent="moss" />
        <StatCard label="Avg Resolution Time" value={`${overview.avgResolutionTimeHours}h`} icon={Timer} accent="ink" />
        <StatCard label="Critical Issues" value={overview.criticalIssues} icon={AlertOctagon} accent="signal" />
        <StatCard label="New Citizens" value={overview.newCitizenParticipation} icon={Users} accent="ink" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h2 className="font-display text-base font-semibold text-ink-800">Monthly trends</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis dataKey="month" fontSize={11} stroke="#5B6472" />
                <YAxis fontSize={11} stroke="#5B6472" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reported" stroke="#14213D" strokeWidth={2} name="Reported" />
                <Line type="monotone" dataKey="resolved" stroke="#3F7A5C" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h2 className="font-display text-base font-semibold text-ink-800">Issues by category</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis type="number" fontSize={11} stroke="#5B6472" />
                <YAxis type="category" dataKey="category" fontSize={11} stroke="#5B6472" width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#14213D" radius={[0, 3, 3, 0]} />
                <Bar dataKey="resolved" fill="#3F7A5C" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h2 className="font-display text-base font-semibold text-ink-800">Department performance</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis dataKey="department" fontSize={10} stroke="#5B6472" />
                <YAxis fontSize={11} stroke="#5B6472" />
                <Tooltip />
                <Bar dataKey="total" fill="#8697BD" radius={[3, 3, 0, 0]} name="Total" />
                <Bar dataKey="resolved" fill="#3F7A5C" radius={[3, 3, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h2 className="font-display text-base font-semibold text-ink-800">Area / ward-wise issues</h2>
          <div className="mt-4 max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate">
                  <th className="py-1.5">Ward</th>
                  <th className="py-1.5">Total</th>
                  <th className="py-1.5">Resolved</th>
                  <th className="py-1.5">Rate</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => (
                  <tr key={a.ward} className="border-t border-ink-50">
                    <td className="py-2 text-ink-700">{a.ward}</td>
                    <td className="py-2 text-ink-600">{a.total}</td>
                    <td className="py-2 text-moss">{a.resolved}</td>
                    <td className="py-2 text-ink-600">{a.resolutionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 panel">
        <h2 className="font-display text-base font-semibold text-ink-800">Staff performance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-slate">
                <th className="py-2">Staff</th>
                <th className="py-2">Assigned</th>
                <th className="py-2">Completed</th>
                <th className="py-2">Avg Resolution (hrs)</th>
              </tr>
            </thead>
            <tbody>
              {staffPerf.map((s) => (
                <tr key={s.staffId} className="border-b border-ink-50">
                  <td className="py-2.5 font-medium text-ink-700">{s.name}</td>
                  <td className="py-2.5 text-ink-600">{s.totalAssigned}</td>
                  <td className="py-2.5 text-moss">{s.completed}</td>
                  <td className="py-2.5 text-ink-600">{s.avgResolutionHours}</td>
                </tr>
              ))}
              {staffPerf.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate">No assigned tasks yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
