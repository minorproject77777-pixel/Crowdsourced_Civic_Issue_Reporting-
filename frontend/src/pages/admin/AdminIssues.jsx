import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, UserPlus, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { issueService } from '../../services/issueService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUSES = ['REPORTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'REJECTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PAGE_SIZE = 15;

export default function AdminIssues() {
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  function loadAll() {
    setLoading(true);
    Promise.all([adminService.getAllIssues(), adminService.getDepartments(), adminService.getUsers({ role: 'staff' })])
      .then(([issuesRes, deptRes, staffRes]) => {
        setIssues(issuesRes.issues);
        setDepartments(deptRes.departments);
        setStaffUsers(staffRes.users);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  const categories = useMemo(() => [...new Set(issues.map((i) => i.category))], [issues]);

  const filtered = useMemo(() => {
    let result = issues.filter((i) => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (categoryFilter && i.category !== categoryFilter) return false;
      if (priorityFilter && i.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.issueId.toLowerCase().includes(q) && !i.title.toLowerCase().includes(q) && !i.address.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    result = [...result].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === 'createdAt') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [issues, statusFilter, categoryFilter, priorityFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  async function quickStatusChange(issue, status) {
    try {
      await issueService.changeStatus(issue._id, { status });
      toast.success(`${issue.issueId} moved to ${status.replace('_', ' ')}.`);
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function quickPriorityChange(issue, priority) {
    try {
      await issueService.changeStatus(issue._id, { priority });
      toast.success(`${issue.issueId} priority set to ${priority}.`);
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleReject(issue) {
    const reason = window.prompt('Reason for rejecting this complaint:');
    if (!reason) return;
    try {
      await issueService.changeStatus(issue._id, { status: 'REJECTED', note: reason });
      toast.success(`${issue.issueId} rejected.`);
      loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) return <LoadingSpinner full label="Loading issues..." />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Manage Issues</h1>
        <button onClick={loadAll} className="btn-outline"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input className="input-field pl-9" placeholder="Search ID, title, location..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input-field w-auto" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-field w-auto" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold text-slate">
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('issueId')}>Issue ID</th>
              <th className="px-4 py-3">Issue</th>
              <th className="px-4 py-3">Category</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('priority')}>Priority</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('status')}>Status</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('createdAt')}>Reported</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {pageItems.map((issue) => (
              <tr key={issue._id} className="hover:bg-ink-50/40">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-marigold-dark">{issue.issueId}</td>
                <td className="max-w-[220px] px-4 py-3">
                  <p className="truncate font-medium text-ink-800">{issue.title}</p>
                  <p className="truncate text-xs text-slate">{issue.address}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600">{issue.category}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <select
                    value={issue.priority}
                    onChange={(e) => quickPriorityChange(issue, e.target.value)}
                    className="rounded border-none bg-transparent text-xs font-semibold focus:ring-1 focus:ring-marigold"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={issue.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate">{new Date(issue.createdAt).toLocaleDateString()}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-600">{issue.department?.name || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-600">{issue.assignedTo?.name || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link to={`/issues/${issue.issueId}`} className="text-ink-500 hover:text-ink-800" title="View"><Eye size={15} /></Link>
                    <button onClick={() => setAssignTarget(issue)} className="text-ink-500 hover:text-ink-800" title="Assign"><UserPlus size={15} /></button>
                    {issue.status === 'REPORTED' && (
                      <button onClick={() => quickStatusChange(issue, 'VERIFIED')} className="text-xs font-semibold text-moss hover:underline">Verify</button>
                    )}
                    {['VERIFIED', 'ASSIGNED', 'IN_PROGRESS'].includes(issue.status) && issue.status !== 'RESOLVED' && (
                      <button onClick={() => quickStatusChange(issue, 'RESOLVED')} className="text-xs font-semibold text-moss hover:underline">Resolve</button>
                    )}
                    {!['REJECTED', 'RESOLVED'].includes(issue.status) && (
                      <button onClick={() => handleReject(issue)} className="text-xs font-semibold text-signal hover:underline">Reject</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate">No issues match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate">
          <span>Page {page} of {totalPages} · {filtered.length} issues</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-outline px-3 py-1.5 disabled:opacity-40">Previous</button>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn-outline px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {assignTarget && (
        <AssignModal
          issue={assignTarget}
          departments={departments}
          staffUsers={staffUsers}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => { setAssignTarget(null); loadAll(); }}
        />
      )}
    </div>
  );
}

function AssignModal({ issue, departments, staffUsers, onClose, onAssigned }) {
  const toast = useToast();
  const [departmentId, setDepartmentId] = useState(issue.department?._id || '');
  const [staffId, setStaffId] = useState(issue.assignedTo?._id || '');
  const [saving, setSaving] = useState(false);

  const filteredStaff = staffUsers.filter((s) => !departmentId || String(s.department?._id || s.department) === String(departmentId));

  async function handleAssign() {
    if (!departmentId) return toast.error('Please select a department.');
    if (!staffId) return toast.error('Please select a staff member.');
    setSaving(true);
    try {
      await issueService.assign(issue._id, { departmentId, staffId });
      toast.success(`${issue.issueId} assigned.`);
      onAssigned();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-ink-800">Assign {issue.issueId}</h3>
        <p className="mt-1 text-sm text-slate">{issue.title}</p>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Department</label>
          <select className="input-field" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setStaffId(''); }}>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Staff member</label>
          <select className="input-field" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">Select staff member</option>
            {filteredStaff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          {departmentId && filteredStaff.length === 0 && (
            <p className="mt-1 text-xs text-signal">No staff members are assigned to this department.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={handleAssign} disabled={saving || !staffId} className="btn-accent">{saving ? 'Assigning...' : 'Assign'}</button>
        </div>
      </div>
    </div>
  );
}
