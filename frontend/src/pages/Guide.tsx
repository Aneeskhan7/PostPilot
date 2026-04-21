// frontend/src/pages/Guide.tsx
import { FC } from 'react';
import { Facebook, Instagram, Linkedin, Zap, CreditCard, HelpCircle } from 'lucide-react';
import Layout from '../components/Layout';

interface StepProps {
  number: number;
  text: string;
}

const Step: FC<StepProps> = ({ number, text }) => (
  <li className="flex gap-3 text-sm text-zinc-300">
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600/30 text-violet-400 text-xs font-bold flex items-center justify-center mt-0.5">
      {number}
    </span>
    <span dangerouslySetInnerHTML={{ __html: text }} />
  </li>
);

interface SectionProps {
  icon: FC<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  accent?: string;
}

const Section: FC<SectionProps> = ({ icon: Icon, title, children, accent = 'text-violet-400' }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${accent}`} />
      <h2 className="text-base font-semibold text-white">{title}</h2>
    </div>
    {children}
  </div>
);

const Guide: FC = () => (
  <Layout>
    <div className="p-4 lg:p-8"><div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Getting Started Guide</h1>
        <p className="text-sm text-zinc-400 mt-1">Everything you need to connect accounts and start scheduling</p>
      </div>

      {/* Facebook + Instagram */}
      <Section icon={Facebook} title="Connect Facebook + Instagram" accent="text-blue-400">
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Facebook</p>
          <ol className="space-y-2">
            {[
              'Go to <strong class="text-white">Settings → Connect Accounts</strong>',
              'Click <strong class="text-white">Connect Facebook</strong>',
              'Log in with the Facebook account that manages your Page',
              'Select your Facebook Page when prompted (must be a Page, not a personal profile)',
              "You'll be redirected back with a green Connected banner",
            ].map((text, i) => <Step key={i} number={i + 1} text={text} />)}
          </ol>

          <div className="border-t border-white/5 pt-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-2">Instagram</p>
            <ol className="space-y-2">
              {[
                'Connect Facebook first (same button — same OAuth flow)',
                'Instagram connects automatically if your Page has a linked <strong class="text-white">Business or Creator</strong> account',
                'To link: go to Facebook Page Settings → Linked Accounts → Instagram',
              ].map((text, i) => <Step key={i} number={i + 1} text={text} />)}
            </ol>
            <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <Instagram className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                Instagram requires a <strong>Business or Creator</strong> account linked to a Facebook Page.
                Personal Instagram accounts cannot be used for scheduling.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* LinkedIn */}
      <Section icon={Linkedin} title="Connect LinkedIn" accent="text-sky-400">
        <ol className="space-y-2">
          {[
            'Go to <strong class="text-white">Settings → Connect Accounts</strong>',
            'Click <strong class="text-white">Connect LinkedIn</strong>',
            'Log in with your LinkedIn account',
            'Approve the permissions — PostPilot only requests the ability to post on your behalf',
            'LinkedIn tokens expire every <strong class="text-white">60 days</strong> — you\'ll see a warning banner when re-auth is needed',
          ].map((text, i) => <Step key={i} number={i + 1} text={text} />)}
        </ol>
      </Section>

      {/* Create post */}
      <Section icon={Zap} title="Create & Schedule a Post" accent="text-violet-400">
        <ol className="space-y-2">
          {[
            'Click <strong class="text-white">New Post</strong> in the sidebar or go to Composer',
            'Select which platforms to post to (only connected accounts are selectable)',
            'Write your caption — or use the <strong class="text-white">AI Generator</strong> to create one with a topic + tone',
            'Optionally upload media (images/video — drag-and-drop or click to browse)',
            'Set a <strong class="text-white">Schedule</strong> time, or leave blank to save as a draft',
            'Click <strong class="text-white">Schedule / Publish</strong> to queue the post',
          ].map((text, i) => <Step key={i} number={i + 1} text={text} />)}
        </ol>
      </Section>

      {/* Plans */}
      <Section icon={CreditCard} title="Plans & Limits" accent="text-amber-400">
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Posts / day</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Price</th>
              </tr>
            </thead>
            <tbody>
              {[
                { plan: 'Free', posts: '2', price: '$0', badge: 'bg-zinc-700 text-zinc-300' },
                { plan: 'Pro', posts: '8', price: '$3/mo', badge: 'bg-violet-600/30 text-violet-300' },
                { plan: 'Unlimited', posts: 'No limit', price: '$9/mo', badge: 'bg-amber-500/20 text-amber-300' },
              ].map(({ plan, posts, price, badge }) => (
                <tr key={plan} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{plan}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{posts}</td>
                  <td className="px-4 py-3 text-zinc-300">{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500">
          Daily limit resets at <strong className="text-zinc-400">UTC midnight</strong>. Upgrade or manage your subscription in{' '}
          <a href="/settings" className="text-violet-400 hover:underline">Settings → Billing</a>.
        </p>
      </Section>

      {/* FAQ */}
      <Section icon={HelpCircle} title="FAQ" accent="text-zinc-400">
        <div className="space-y-4">
          {[
            {
              q: 'Why does my Instagram say "not connected"?',
              a: 'Instagram requires a Business or Creator account linked to a Facebook Page. Connect Facebook first, then link your Instagram account inside Facebook Page Settings → Linked Accounts.',
            },
            {
              q: 'Can I schedule to a personal Facebook profile?',
              a: 'No. Facebook\'s API only allows posting to Pages, not personal profiles.',
            },
            {
              q: 'What happens if I hit the daily post limit?',
              a: 'The post is rejected with an error. Either wait until UTC midnight for the counter to reset, or upgrade your plan in Settings.',
            },
            {
              q: 'When do LinkedIn tokens expire?',
              a: 'Every 60 days. PostPilot shows a warning badge 10 days before expiry — click Reconnect in Settings to refresh.',
            },
            {
              q: 'Can I cancel my subscription?',
              a: 'Yes. Go to Settings → Billing → Manage Subscription. You\'ll be taken to the Stripe portal where you can cancel. Your plan stays active until the end of the billing period.',
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="text-sm font-medium text-white">{q}</p>
              <p className="text-sm text-zinc-400 mt-1">{a}</p>
            </div>
          ))}
        </div>
      </Section>
    </div></div>
  </Layout>
);

export default Guide;
