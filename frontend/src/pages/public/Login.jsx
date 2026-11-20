import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPinned, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(data) {
    try {
      const user = await login(data.email.trim().toLowerCase(), data.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const from = location.state?.from?.pathname;
      if (from) navigate(from);
      else if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-md bg-ink-700 text-marigold">
            <MapPinned size={20} />
          </Link>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink-800">Welcome back</h1>
          <p className="mt-1 text-sm text-slate">Log in to track your complaints.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="input-field"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
              })}
            />
            {errors.email && <p className="mt-1 text-xs text-signal">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field pr-10"
                placeholder="••••••••"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-signal">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-accent w-full">
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-marigold-dark hover:underline">
            Register
          </Link>
        </p>

        <div className="mt-8 rounded-md border border-ink-100 bg-white p-4 text-xs text-slate">
          <p className="mb-1.5 font-semibold text-ink-700">Demo accounts</p>
          <p>Citizen: citizen@civicfix.com / Citizen@123</p>
          <p>Staff: staff@civicfix.com / Staff@123</p>
          <p>Admin: admin@civicfix.com / Admin@123</p>
        </div>
      </div>
    </div>
  );
}
