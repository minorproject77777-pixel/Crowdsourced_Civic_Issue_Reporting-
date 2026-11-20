import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, UserPlus, Trash2, ShieldOff, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

const ROLES = ['citizen', 'staff', 'admin'];

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([adminService.getUsers(), adminService.getDepartments()])
      .then(([usersRes, deptRes]) => {
        setUsers(usersRes.users);
        setDepartments(deptRes.departments);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(user) {
    try {
      await adminService.updateUser(user._id, { isActive: !user.isActive });
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}.`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    try {
      await adminService.deleteUser(confirmDelete._id);
      toast.success('User removed.');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirmDelete(null);
    }
  }

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Manage Users</h1>
        <button onClick={() => setShowCreate(true)} className="btn-accent"><UserPlus size={16} /> Add Staff / Admin</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input className="input-field pl-9" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold text-slate">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Civic Points</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map((u) => (
              <tr key={u._id} className="hover:bg-ink-50/40">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-800">{u.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600">{u.email}</td>
                <td className="whitespace-nowrap px-4 py-3 capitalize text-ink-600">{u.role}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600">{u.department?.name || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600">{u.civicPoints}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.isActive ? 'bg-moss/15 text-moss' : 'bg-signal/10 text-signal'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleActive(u)} className="text-ink-500 hover:text-ink-800" title={u.isActive ? 'Deactivate' : 'Activate'}>
                      {u.isActive ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                    </button>
                    <button onClick={() => setConfirmDelete(u)} className="text-signal hover:text-signal/70" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate">No users match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUserModal departments={departments} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={`Remove ${confirmDelete?.name}?`}
        description="This will permanently delete their account."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function CreateUserModal({ departments, onClose, onCreated }) {
  const toast = useToast();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({ defaultValues: { role: 'staff' } });
  const role = watch('role');

  async function onSubmit(data) {
    try {
      await adminService.createStaffOrAdmin(data);
      toast.success(`${data.name} added as ${data.role}.`);
      onCreated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-ink-800">Add staff or admin</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <input className="input-field" placeholder="Full name" {...register('name', { required: true })} />
          <input className="input-field" type="email" placeholder="Email" {...register('email', { required: true })} />
          <input className="input-field" placeholder="Temporary password" {...register('password', { required: true, minLength: 6 })} />
          <select className="input-field" {...register('role')}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          {role === 'staff' && (
            <select className="input-field" {...register('department')}>
              <option value="">Select department</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          )}
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-accent">{isSubmitting ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
