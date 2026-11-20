import { Link } from 'react-router-dom';
import { MapPinned } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-ink-700 text-marigold">
        <MapPinned size={22} />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink-800">404</h1>
      <p className="mt-2 text-slate">This page doesn't exist, or has been moved.</p>
      <Link to="/" className="btn-accent mt-6">Back to home</Link>
    </div>
  );
}
