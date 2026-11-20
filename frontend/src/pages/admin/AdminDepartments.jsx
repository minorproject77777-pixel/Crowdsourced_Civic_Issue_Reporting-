import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Pencil, TrendingUp } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminDepartments() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | department object
  const [confirmDelete, setConfirmDelete] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([adminService.getDepartments(), adminService.getDepartmentPerformance()])
      .then(([deptRes, perfRes]) => {
        setDepartments(deptRes.departments);
        setPerformance(perfRes.performance);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete() {
    try {
      await adminService.deleteDepartment(confirmDelete._id);
      toast.success('Department removed.');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirmDelete(null);
    }
  }

  function performanceFor(deptId) {
    return performance.find((p) => String(p.departmentId) === String(deptId));
  }

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Departments</h1>
        <button onClick={() => setEditing('new')} className="btn-accent"><Plus size={16} /> New Department</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const perf = performanceFor(dept._id);
          return (
            <div key={dept._id} className="panel">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink-800">{dept.name}</h3>
                  <p className="mt-1 text-xs text-slate">{dept.description || 'No description'}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${dept.isActive ? 'bg-moss/15 text-moss' : 'bg-signal/10 text-signal'}`}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {dept.headName && <p className="mt-3 text-xs text-ink-600">Head: {dept.headName}</p>}

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-ink-100 pt-3 text-center">
                <div>
                  <p className="font-display text-lg font-semibold text-ink-800">{perf?.total ?? 0}</p>
                  <p className="text-[10px] text-slate">Total</p>
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-moss">{perf?.resolved ?? 0}</p>
                  <p className="text-[10px] text-slate">Resolved</p>
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-ink-800 flex items-center justify-center gap-0.5">
                    <TrendingUp size={13} /> {perf?.resolutionRate ?? 0}%
                  </p>
                  <p className="text-[10px] text-slate">Rate</p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={() => setEditing(dept)} className="flex items-center gap-1 text-xs font-semibold text-ink-600 hover:text-ink-800">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => setConfirmDelete(dept)} className="flex items-center gap-1 text-xs font-semibold text-signal hover:text-signal/70">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <DepartmentModal department={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.name}?`}
        description="Departments with assigned issues cannot be deleted."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function DepartmentModal({ department, onClose, onSaved }) {
  const toast = useToast();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: department || { name: '', description: '', headName: '', contactEmail: '', contactPhone: '' },
  });

  async function onSubmit(data) {
    try {
      if (department) await adminService.updateDepartment(department._id, data);
      else await adminService.createDepartment(data);
      toast.success(department ? 'Department updated.' : 'Department created.');
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-ink-800">{department ? 'Edit department' : 'New department'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <input className="input-field" placeholder="Department name" {...register('name', { required: true })} />
          <textarea className="input-field" rows={2} placeholder="Description" {...register('description')} />
          <input className="input-field" placeholder="Head of department" {...register('headName')} />
          <input className="input-field" placeholder="Contact email" {...register('contactEmail')} />
          <input className="input-field" placeholder="Contact phone" {...register('contactPhone')} />
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-accent">{isSubmitting ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
