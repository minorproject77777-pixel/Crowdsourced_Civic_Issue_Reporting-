import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, ShieldCheck, Loader, CheckCircle2, AlertOctagon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminService } from '../../services/adminService';
import { analyticsService } from '../../services/analyticsService';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORY_COLORS = ['#14213D', '#E8A23D', '#3F7A5C', '#C4453D', '#8697BD', '#F4C27C', '#6EA485', '#E2837C', '#3A5182', '#5B6472'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getStatistics(),
      analyticsService.getCategories(),
      analyticsService.getTrends(6),
    ])
      .then(([statsRes, catRes, trendsRes]) => {
        setStats(statsRes.statistics);
        setCategories(catRes.categories);
        setTrends(trendsRes.trends);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner full label="Loading dashboard..." />;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Admin Dashboard</h1>
      <p className="mt-1.5 text-slate">Municipal overview across all complaints and departments.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total Issues" value={stats.totalIssues} icon={FileText} accent="ink" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="marigold" />
        <StatCard label="Verified" value={stats.verified} icon={ShieldCheck} accent="ink" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Loader} accent="marigold" />
        <StatCard label="Resolved" value={stats.resolvedIssues} icon={CheckCircle2} accent="moss" />
        <StatCard label="Critical" value={stats.criticalIssues} icon={AlertOctagon} accent="signal" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h2 className="font-display text-base font-semibold text-ink-800">Monthly trends</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis dataKey="month" fontSize={12} stroke="#5B6472" />
                <YAxis fontSize={12} stroke="#5B6472" />
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
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={(d) => d.category}>
                  {categories.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link to="/admin/issues" className="panel text-center hover:border-marigold">
          <p className="font-display text-sm font-semibold text-ink-800">Manage Issues</p>
          <p className="mt-1 text-xs text-slate">Verify, assign and track complaints</p>
        </Link>
        <Link to="/admin/analytics" className="panel text-center hover:border-marigold">
          <p className="font-display text-sm font-semibold text-ink-800">View Analytics</p>
          <p className="mt-1 text-xs text-slate">Resolution rates, trends and performance</p>
        </Link>
        <Link to="/admin/map" className="panel text-center hover:border-marigold">
          <p className="font-display text-sm font-semibold text-ink-800">Issue Map</p>
          <p className="mt-1 text-xs text-slate">See all complaints geographically</p>
        </Link>
      </div>
    </div>
  );
}
