// frontend/src/pages/legal/Refund.tsx
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';

const S: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
    <div className="text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
  </div>
);

const Refund: FC = () => (
  <div className="min-h-screen bg-zinc-950 text-white px-6 py-16">
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 mb-10 group">
        <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
          <Rocket className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold group-hover:text-violet-400 transition-colors">PostPilot</span>
      </Link>

      <h1 className="text-3xl font-extrabold mb-2">Refund Policy</h1>
      <p className="text-sm text-zinc-500 mb-12">Last updated: April 22, 2025</p>

      <S title="Our Commitment">
        <p>We want you to be completely satisfied with PostPilot. This policy explains when and how you can request a refund for paid subscriptions.</p>
      </S>
      <S title="14-Day Money-Back Guarantee">
        <p>If you are not satisfied with your paid subscription, you may request a full refund within <strong className="text-white">14 days</strong> of your initial payment. No questions asked.</p>
        <p>To request a refund, email <span className="text-violet-400">support@postpilot.app</span> with your account email and the reason for your request. Refunds are processed within 5–10 business days to your original payment method.</p>
      </S>
      <S title="Monthly Subscriptions">
        <p>After the initial 14-day guarantee period, monthly subscriptions are non-refundable for the current billing cycle. You may cancel at any time to prevent future charges — your access continues until the end of the paid period.</p>
      </S>
      <S title="Cancellation">
        <p>You can cancel your subscription at any time from the Billing page in your PostPilot account. Cancellation takes effect immediately and no further charges will be made. You retain Pro features until the end of your current billing period.</p>
      </S>
      <S title="Free Plan">
        <p>The Free plan has no associated charges and therefore no refund policy applies.</p>
      </S>
      <S title="Exceptions">
        <p>We may issue refunds outside the standard policy at our discretion in cases of:</p>
        <p>• Significant service outages exceeding 48 hours in a billing period</p>
        <p>• Billing errors (duplicate charges, incorrect amounts)</p>
        <p>• Technical issues that prevented core features from functioning for the majority of your billing period</p>
      </S>
      <S title="Disputes">
        <p>Before initiating a payment dispute or chargeback, please contact us at <span className="text-violet-400">support@postpilot.app</span>. We resolve billing issues quickly and chargebacks result in immediate account suspension.</p>
      </S>
      <S title="Contact">
        <p>Refund questions? Email <span className="text-violet-400">support@postpilot.app</span> — we respond within 24 hours on business days.</p>
      </S>

      <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-xs text-zinc-600">
        <Link to="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
        <Link to="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
        <Link to="/" className="hover:text-zinc-400 transition-colors">← Back to Home</Link>
      </div>
    </div>
  </div>
);

export default Refund;
