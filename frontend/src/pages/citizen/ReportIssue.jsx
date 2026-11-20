import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowUp } from 'lucide-react';
import { issueService } from '../../services/issueService';
import { categoryService } from '../../services/categoryService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import LocationPicker from '../../components/LocationPicker';
import StatusBadge from '../../components/StatusBadge';

export default function ReportIssue() {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { category: '', title: '', description: '', address: '', latitude: null, longitude: null },
  });
  const toast = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryLoadFailed, setCategoryLoadFailed] = useState(false);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState(null);
  const [proceedAnyway, setProceedAnyway] = useState(false);
  const [success, setSuccess] = useState(null);
  const [imageError, setImageError] = useState('');
  const [locationError, setLocationError] = useState('');

  const lat = watch('latitude');
  const lng = watch('longitude');

  useEffect(() => {
    categoryService.list()
      .then((res) => setCategories(res.categories.filter((category) => category.isActive).map((category) => category.name)))
      .catch(() => {
        setCategoryLoadFailed(true);
        toast.error('Could not load issue categories. Please refresh and try again.');
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude);
        setValue('longitude', pos.coords.longitude);
        setLocationError('');
        toast.success('Location captured.');
      },
      () => toast.error('Could not access your location. Please select it on the map instead.')
    );
  }

  async function onSubmit(data) {
    if (files.length === 0) {
      setImageError('Please upload at least one photo.');
      toast.error('Please upload at least one photo.');
      return;
    }
    setImageError('');

    if (!data.latitude || !data.longitude) {
      setLocationError('Please select a location using your current location or the map.');
      toast.error('Please select a location using your current location or the map.');
      return;
    }
    setLocationError('');

    // First pass: check for nearby duplicates unless the user already chose to proceed
    if (!proceedAnyway) {
      setCheckingDuplicates(true);
      try {
        const res = await issueService.checkDuplicates({
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.category,
          title: data.title,
          description: data.description,
          address: data.address,
        });
        if (res.duplicates?.length > 0) {
          setDuplicates(res.duplicates);
          setCheckingDuplicates(false);
          return;
        }
      } catch (err) {
        // If the check itself fails, don't block reporting — fall through to submit
      }
      setCheckingDuplicates(false);
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('latitude', data.latitude);
      formData.append('longitude', data.longitude);
      formData.append('address', data.address);
      files.forEach((f) => formData.append('images', f));

      const res = await issueService.create(formData);
      setSuccess(res.issue);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-moss/15 text-moss">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-800">
          Your issue has been successfully reported.
        </h1>
        <p className="mt-2 text-slate">Complaint ID</p>
        <p className="mt-1 font-display text-xl font-semibold text-marigold-dark">{success.issueId}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to={`/issues/${success.issueId}`} className="btn-accent">View complaint</Link>
          <Link to="/dashboard" className="btn-outline">Go to dashboard</Link>
        </div>
      </div>
    );
  }

  if (duplicates) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="mb-6 flex items-start gap-3 rounded-md border border-marigold/40 bg-marigold/5 p-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-marigold-dark" />
          <div>
            <h2 className="font-display text-base font-semibold text-ink-800">A similar issue has already been reported nearby.</h2>
            <p className="mt-1 text-sm text-slate">Take a look before submitting a new report — you can support an existing one instead.</p>
          </div>
        </div>

        <div className="space-y-3">
          {duplicates.map((d) => (
            <div key={d._id} className="card flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-marigold-dark">{d.issueId}</p>
                <p className="truncate text-sm font-medium text-ink-800">{d.title}</p>
                <p className="mt-1 text-xs text-slate">
                  {d.distanceMeters}m away · <ArrowUp size={11} className="inline" /> {d.upvoteCount} upvotes
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusBadge status={d.status} />
                <Link to={`/issues/${d.issueId}`} className="text-xs font-semibold text-marigold-dark hover:underline">
                  View existing issue →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/issues/${duplicates[0].issueId}`} className="btn-accent">Support existing issue</Link>
          <button
            onClick={() => {
              setDuplicates(null);
              setProceedAnyway(true);
              handleSubmit(onSubmit)();
            }}
            className="btn-outline"
          >
            Continue anyway
          </button>
          <button onClick={() => setDuplicates(null)} className="text-sm font-medium text-slate hover:text-ink-700">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink-800 sm:text-3xl">Report an Issue</h1>
      <p className="mt-1.5 text-slate">Give us the details — the more specific, the faster it gets resolved.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Category <span className="text-red-500">*</span></label>
          <select className="input-field" {...register('category', { required: 'Please choose a category' })}>
            <option value="">{loadingCategories ? 'Loading categories...' : 'Select a category'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-signal">{errors.category.message}</p>}
          {categoryLoadFailed && <p className="mt-1 text-xs text-signal">Categories could not be loaded.</p>}
          {!loadingCategories && !categoryLoadFailed && categories.length === 0 && (
            <p className="mt-1 text-xs text-signal">No active categories are available.</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Title <span className="text-red-500">*</span></label>
          <input
            className="input-field"
            placeholder="Short summary, e.g. Large pothole near bus stop"
            {...register('title', { required: 'Title is required', maxLength: { value: 150, message: 'Keep it under 150 characters' } })}
          />
          {errors.title && <p className="mt-1 text-xs text-signal">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Description <span className="text-red-500">*</span></label>
          <textarea
            rows={4}
            className="input-field"
            placeholder="Describe the issue in detail — what's wrong, how long it's been there, any safety concerns."
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && <p className="mt-1 text-xs text-signal">{errors.description.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Photo <span className="text-red-500">*</span></label>
          <ImageUpload
            files={files}
            onChange={(nextFiles) => {
              setFiles(nextFiles);
              if (nextFiles.length > 0) setImageError('');
            }}
            error={imageError}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-ink-700">Location <span className="text-red-500">*</span></label>
            <button type="button" onClick={handleUseCurrentLocation} className="text-xs font-semibold text-marigold-dark hover:underline">
              Use my current location
            </button>
          </div>
          <Controller
            name="latitude"
            control={control}
            render={() => (
              <LocationPicker
                latitude={lat}
                longitude={lng}
                onChange={(pickedLat, pickedLng) => {
                  setValue('latitude', pickedLat);
                  setValue('longitude', pickedLng);
                  setLocationError('');
                }}
              />
            )}
          />
          <p className="mt-1.5 text-xs text-slate">Click on the map to drop a pin, or use your current location.</p>
          {locationError && <p className="mt-1 text-xs text-signal">{locationError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Address <span className="text-red-500">*</span></label>
          <input
            className="input-field"
            placeholder="Street, area, landmark"
            {...register('address', { required: 'Address is required' })}
          />
          {errors.address && <p className="mt-1 text-xs text-signal">{errors.address.message}</p>}
        </div>

        <button type="submit" disabled={submitting || checkingDuplicates || loadingCategories || categories.length === 0} className="btn-accent w-full py-3 text-base">
          {checkingDuplicates ? 'Checking for similar issues...' : submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
