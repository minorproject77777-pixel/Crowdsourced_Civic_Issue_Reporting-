import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([categoryService.list(), adminService.getDepartments()])
      .then(([catRes, deptRes]) => {
        setCategories(catRes.categories);
        setDepartments(deptRes.departments);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete() {
    try {
      await categoryService.remove(confirmDelete._id);
      toast.success('Category removed.');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirmDelete(null);
    }
  }

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Categories</h1>
        <button onClick={() => setEditing('new')} className="btn-accent"><Plus size={16} /> New Category</button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-semibold text-slate">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Default Department</th>
              <th className="px-4 py-3">Priority Weight</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {categories.map((cat) => (
              <tr key={cat._id} className="hover:bg-ink-50/40">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-800">{cat.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600">{cat.defaultDepartment?.name || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600">{cat.categoryWeight}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cat.isActive ? 'bg-moss/15 text-moss' : 'bg-signal/10 text-signal'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditing(cat)} className="text-ink-500 hover:text-ink-800"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDelete(cat)} className="text-signal hover:text-signal/70"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <CategoryModal category={editing === 'new' ? null : editing} departments={departments} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.name}?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function CategoryModal({ category, departments, onClose, onSaved }) {
  const toast = useToast();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: category
      ? { name: category.name, defaultDepartment: category.defaultDepartment?._id || '', categoryWeight: category.categoryWeight }
      : { name: '', defaultDepartment: '', categoryWeight: 10 },
  });

  async function onSubmit(data) {
    try {
      const payload = { ...data, categoryWeight: Number(data.categoryWeight) };
      if (category) await categoryService.update(category._id, payload);
      else await categoryService.create(payload);
      toast.success(category ? 'Category updated.' : 'Category created.');
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-ink-800">{category ? 'Edit category' : 'New category'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <input className="input-field" placeholder="Category name" {...register('name', { required: true })} />
          <select className="input-field" {...register('defaultDepartment')}>
            <option value="">Select default department</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <div>
            <label className="mb-1 block text-xs text-slate">Priority weight (0-30)</label>
            <input type="number" min={0} max={30} className="input-field" {...register('categoryWeight')} />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-accent">{isSubmitting ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
