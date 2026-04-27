// frontend/src/pages/Billing.tsx
import { FC, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard, CheckCircle2, AlertCircle, Zap, Infinity, Star,
  Calendar, ShieldCheck, XCircle, ExternalLink, AlertTriangle,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useProfile } from '../hooks/useProfile';
import {
  useSubscription, useCreateCheckout, useCancelSubscription, useSyncBilling, useCreatePortal,
} from '../hooks/useBilling';
import { useAuthStore } from '../store/authStore';
import { createCheckoutSession } from '../lib/api/billing';

const PRO_PRICE_ID = import.meta.env.VITE_STRIPE_PRO_PRICE_ID as string;
const UNLIMITED_PRICE_ID = import.meta.env.VITE_STRIPE_UNLIMITED_PRICE_ID as string;

const PLAN_META: Record<string, {
  label: string; price: string; postsPerDay: string;
  color: string; glow: string; icon: FC<{ className?: string }>;
}> = {
  free: {
    label: 'Free', price: '$0', postsPerDay: '2 posts / day',
    color: 'border-white/10', glow: '',
    icon: ({ className }) => <Star className={className} />,
  },
  pro: {
    label: 'Pro', price: '$3', postsPerDay: '8 posts / day',
    color: 'border-violet-500/40', glow: 'shadow-violet-500/10 shadow-2xl',
    icon: ({ className }) => <Zap className={className} />,
  },
  unlimited: {
    label: 'Unlimited', price: '$9', postsPerDay: 'Unlimited posts / day',
    color: 'border-amber-500/40', glow: 'shadow-amber-500/10 shadow-2xl',
    icon: ({ className }) => <Infinity className={className} />,
  },
};

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function CardBrand({ brand }: { brand: string }) {
  const upper = brand.toUpperCase();
  const colors: Record<string, string> = { VISA: 'text-blue-400', MASTERCARD: 'text-orange-400', AMEX: 'text-sky-400' };
  return <span className={`text-xs font-bold tracking-widest ${colors[upper] ?? 'text-zinc-400'}`}>{upper}</span>;
}

interface CancelModalProps {
  periodEnd: number;
  isPending: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}

const CancelModal: FC<CancelModalProps> = ({ periodEnd, isPending, error, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Cancel subscription?</h3>
          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
            Your subscription will remain active until{' '}
            <span className="text-white font-medium">{formatDate(periodEnd)}</span>, then
            your account will revert to the Free plan (2 posts/day).
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isPending}
          className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-sm font-semibold rounded-xl border border-white/10 transition-colors"
        >
          Keep my plan
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 transition-colors"
        >
          {isPending ? 'Cancelling…' : 'Yes, cancel'}
        </button>
      </div>
    </div>
  </div>
);

const Billing: FC = () => {
  const [searchParams] = useSearchParams();
  const billing = searchParams.get('billing');
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const preloadedUrls = useRef<{ [priceId: string]: string }>({});
  const preloading = useRef(false);

  const { data: profile } = useProfile();
  const { data: subData, isLoading: subLoading } = useSubscription();
  const createCheckout = useCreateCheckout();
  const createPortal = useCreatePortal();
  const cancelSub = useCancelSubscription();
  const syncBilling = useSyncBilling();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (billing === 'success') syncBilling.mutate();
  }, [billing]);

  // Pre-create Stripe checkout sessions in the background so clicking is instant
  useEffect(() => {
    const plan = profile?.plan ?? 'free';
    if (plan !== 'free' || !PRO_PRICE_ID || !UNLIMITED_PRICE_ID) return;
    if (preloading.current) return;
    preloading.current = true;

    const token = session?.access_token;
    if (!token) return;

    (async () => {
      try {
        // Sequential — second call finds the Stripe customer created by the first
        const proUrl = await createCheckoutSession(token, PRO_PRICE_ID);
        preloadedUrls.current[PRO_PRICE_ID] = proUrl;
        const unlimitedUrl = await createCheckoutSession(token, UNLIMITED_PRICE_ID);
        preloadedUrls.current[UNLIMITED_PRICE_ID] = unlimitedUrl;
      } catch {
        // Silent — buttons still work via mutation fallback
      }
    })();
  }, [profile?.plan, session?.access_token]);

  const handleUpgrade = (priceId: string) => {
    const preloaded = preloadedUrls.current[priceId];
    if (preloaded) {
      window.location.href = preloaded;
      return;
    }
    setPendingPriceId(priceId);
    createCheckout.mutate(priceId);
  };

  const plan = profile?.plan ?? 'free';
  const meta = PLAN_META[plan] ?? PLAN_META.free;
  const sub = subData?.subscription ?? null;

  const handleCancel = () => {
    setCancelError('');
    cancelSub.mutate(undefined, {
      onSuccess: () => setShowCancelModal(false),
      onError: (err) => setCancelError(err instanceof Error ? err.message : 'Failed to cancel. Please try again.'),
    });
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Billing</h1>
            <p className="text-sm text-zinc-400 mt-0.5">Manage your subscription and payment details</p>
          </div>

          {billing === 'success' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm mb-6">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-400">Subscription activated! Your plan has been upgraded.</p>
            </div>
          )}
          {billing === 'cancelled' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-500/10 border border-white/10 text-sm mb-6">
              <AlertCircle className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <p className="text-zinc-400">Checkout was cancelled. No charge was made.</p>
            </div>
          )}

          {/* Current Plan Card */}
          <div className={`bg-white/5 border ${meta.color} ${meta.glow} rounded-2xl p-6 mb-6`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  plan === 'unlimited' ? 'bg-amber-500/15 text-amber-400' :
                  plan === 'pro'       ? 'bg-violet-500/15 text-violet-400' :
                                        'bg-white/5 text-zinc-400'
                }`}>
                  <meta.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{meta.label} Plan</h2>
                    {plan !== 'free' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        sub?.cancel_at_period_end
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {sub?.cancel_at_period_end ? 'Cancelling' : 'Active'}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm mt-0.5">{meta.postsPerDay} · All platforms</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {meta.price}<span className="text-sm font-normal text-zinc-500">/mo</span>
                </p>
              </div>
            </div>

            {/* Subscription Details */}
            {!subLoading && sub && (
              <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500">
                      {sub.cancel_at_period_end ? 'Access until' : 'Next billing date'}
                    </p>
                    <p className="text-sm font-medium text-white">{formatDate(sub.current_period_end)}</p>
                  </div>
                </div>

                {sub.payment_method && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-500">Payment method</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CardBrand brand={sub.payment_method.brand} />
                        <span className="text-sm font-medium text-white">•••• {sub.payment_method.last4}</span>
                        <span className="text-xs text-zinc-500">
                          {sub.payment_method.exp_month}/{sub.payment_method.exp_year}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {sub?.cancel_at_period_end && (
              <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">
                  Subscription cancels on{' '}
                  <span className="font-medium">{formatDate(sub.current_period_end)}</span>. You'll keep full access until then.
                </p>
              </div>
            )}

            {subLoading && plan !== 'free' && (
              <div className="mt-5 pt-5 border-t border-white/5 flex gap-4">
                <div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-10 w-32 bg-white/5 rounded-xl animate-pulse" />
              </div>
            )}

            {/* Actions */}
            {plan !== 'free' && !sub?.cancel_at_period_end && !subLoading && (
              <div className="mt-5 flex items-center gap-3 flex-wrap pt-5 border-t border-white/5">
                <button
                  onClick={() => createPortal.mutate()}
                  disabled={createPortal.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-sm font-medium rounded-xl border border-white/10 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {createPortal.isPending ? 'Redirecting…' : 'Update Payment Method'}
                </button>

                <button
                  onClick={() => { setCancelError(''); setShowCancelModal(true); }}
                  className="px-4 py-2.5 text-zinc-500 hover:text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>

          {/* Upgrade Cards — free plan only */}
          {plan === 'free' && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3">Upgrade your plan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-violet-500/20 rounded-2xl p-5 space-y-4 hover:border-violet-500/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Pro</p>
                      <p className="text-xs text-zinc-500">For growing creators</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">$3<span className="text-sm font-normal text-zinc-400">/mo</span></p>
                    <ul className="mt-2 space-y-1">
                      {['8 posts per day', 'All platforms', 'Priority support'].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => handleUpgrade(PRO_PRICE_ID)}
                    disabled={createCheckout.isPending || !PRO_PRICE_ID}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {createCheckout.isPending && pendingPriceId === PRO_PRICE_ID ? 'Redirecting…' : 'Upgrade to Pro'}
                  </button>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5 space-y-4 hover:border-amber-500/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                      <Infinity className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Unlimited</p>
                      <p className="text-xs text-zinc-500">For power users &amp; agencies</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">$9<span className="text-sm font-normal text-zinc-400">/mo</span></p>
                    <ul className="mt-2 space-y-1">
                      {['Unlimited posts / day', 'All platforms', 'Priority support'].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => handleUpgrade(UNLIMITED_PRICE_ID)}
                    disabled={createCheckout.isPending || !UNLIMITED_PRICE_ID}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold rounded-xl transition-colors"
                  >
                    {createCheckout.isPending && pendingPriceId === UNLIMITED_PRICE_ID ? 'Redirecting…' : 'Upgrade to Unlimited'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && sub && (
        <CancelModal
          periodEnd={sub.current_period_end}
          isPending={cancelSub.isPending}
          error={cancelError}
          onConfirm={handleCancel}
          onClose={() => { if (!cancelSub.isPending) setShowCancelModal(false); }}
        />
      )}
    </Layout>
  );
};

export default Billing;
