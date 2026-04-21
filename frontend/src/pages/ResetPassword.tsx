// frontend/src/pages/ResetPassword.tsx
import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

const Schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type FormData = z.infer<typeof Schema>;

const ResetPassword: FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setServerError(error.message);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-600/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Set new password</h1>
          <p className="mt-1 text-sm text-zinc-400">Choose a strong password for your account</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="rp-password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                New Password
              </label>
              <input
                id="rp-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="rp-confirm" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Confirm Password
              </label>
              <input
                id="rp-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('confirm')}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
              />
              {errors.confirm && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirm.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-600/25"
            >
              {isSubmitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
