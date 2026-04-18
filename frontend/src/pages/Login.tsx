// frontend/src/pages/Login.tsx
import { FC, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';

const SignInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const SignUpSchema = SignInSchema.extend({
  fullName: z.string().min(2, 'Enter your full name'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type SignInData = z.infer<typeof SignInSchema>;
type SignUpData = z.infer<typeof SignUpSchema>;

const Login: FC = () => {
  const { user, signInWithEmail, signUpWithEmail } = useAuthStore();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const signInForm = useForm<SignInData>({ resolver: zodResolver(SignInSchema) });
  const signUpForm = useForm<SignUpData>({ resolver: zodResolver(SignUpSchema) });

  if (user) return <Navigate to="/" replace />;

  const handleSignIn = async (data: SignInData) => {
    setServerError('');
    try {
      await signInWithEmail(data.email, data.password);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    setServerError('');
    setSuccessMsg('');
    try {
      await signUpWithEmail(data.email, data.password, data.fullName);
      setSuccessMsg('Account created! Check your email to confirm before signing in.');
      signUpForm.reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-transparent via-violet-500/40 to-transparent" />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-600/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">PostPilot</h1>
          <p className="mt-1 text-sm text-zinc-400">Schedule smarter. Grow faster.</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">

          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-8">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setServerError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === t
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Server feedback */}
          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {serverError}
            </div>
          )}
          {successMsg && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
              {successMsg}
            </div>
          )}

          {/* Sign In Form */}
          {tab === 'signin' && (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="si-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Email
                </label>
                <input
                  id="si-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...signInForm.register('email')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                />
                {signInForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{signInForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="si-password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <input
                  id="si-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...signInForm.register('password')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                />
                {signInForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">{signInForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={signInForm.formState.isSubmitting}
                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-600/25"
              >
                {signInForm.formState.isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {tab === 'signup' && (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="su-name" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <input
                  id="su-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  {...signUpForm.register('fullName')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                />
                {signUpForm.formState.errors.fullName && (
                  <p className="mt-1.5 text-xs text-red-400">{signUpForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="su-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Email
                </label>
                <input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...signUpForm.register('email')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                />
                {signUpForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="su-password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <input
                  id="su-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...signUpForm.register('password')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                />
                {signUpForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">{signUpForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="su-confirm" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="su-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...signUpForm.register('confirm')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                />
                {signUpForm.formState.errors.confirm && (
                  <p className="mt-1.5 text-xs text-red-400">{signUpForm.formState.errors.confirm.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={signUpForm.formState.isSubmitting}
                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-600/25"
              >
                {signUpForm.formState.isSubmitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          By continuing, you agree to PostPilot's Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default Login;
