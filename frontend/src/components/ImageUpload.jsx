import { useRef } from 'react';
import { Camera, X } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILES = 5;
const MAX_SIZE_MB = 5;

export default function ImageUpload({ files, onChange, error }) {
  const inputRef = useRef(null);

  function handleFiles(fileList) {
    const incoming = Array.from(fileList);
    const valid = [];

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) continue;
      valid.push(file);
    }

    const combined = [...files, ...valid].slice(0, MAX_FILES);
    onChange(combined);
  }

  function removeFile(index) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-8 text-center transition-colors hover:border-marigold"
      >
        <Camera size={24} className="text-ink-400" />
        <p className="text-sm font-medium text-ink-700">Click to upload or drag photos here</p>
        <p className="text-xs text-slate">JPG, JPEG, PNG or WEBP · up to {MAX_FILES} photos · 5MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-signal">{error}</p>}

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {files.map((file, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-md border border-ink-100">
              <img src={URL.createObjectURL(file)} alt={`upload-${i}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
