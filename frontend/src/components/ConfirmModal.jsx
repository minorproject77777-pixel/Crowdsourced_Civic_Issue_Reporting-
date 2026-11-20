export default function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-ink-800">{title}</h3>
        {description && <p className="mt-2 text-sm text-slate">{description}</p>}
        <div className="mt-6 flex justify-end gap-2.5">
          <button onClick={onCancel} className="btn-outline">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={danger ? 'inline-flex items-center justify-center rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-white hover:bg-signal/90' : 'btn-accent'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
