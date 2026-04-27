// frontend/src/pages/Landing.tsx
import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket, Calendar, Sparkles, Clock, Image, BarChart2, Globe,
  ChevronDown, ChevronUp, Linkedin, Check,
} from 'lucide-react';

const FacebookIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const FEATURES = [
  { icon: Clock, title: 'Smart Scheduling', desc: 'Plan weeks ahead. Set exact times or let AI pick optimal posting windows for maximum reach.' },
  { icon: Sparkles, title: 'AI Captions', desc: 'GPT-4o writes scroll-stopping captions and hashtags tailored to each platform in seconds.' },
  { icon: Calendar, title: 'Visual Calendar', desc: 'Drag-and-drop calendar view gives a bird\'s-eye view of your entire content pipeline.' },
  { icon: BarChart2, title: 'Post Analytics', desc: 'Track reach, engagement, and impressions. Know exactly what content performs best.' },
  { icon: Image, title: 'Media Upload', desc: 'Drag-and-drop photos and videos. Auto-optimized for Instagram, Facebook, and LinkedIn specs.' },
  { icon: Globe, title: 'Multi-Platform', desc: 'One post, every platform. Publish to Instagram, Facebook, and LinkedIn simultaneously.' },
];

const FAQS = [
  { q: 'Is PostPilot free to use?', a: 'Yes — our Free plan lets you connect 3 accounts and schedule up to 10 posts per month, no credit card required.' },
  { q: 'Which platforms are supported?', a: 'Instagram (Business & Creator accounts), Facebook Pages, and LinkedIn personal profiles.' },
  { q: 'How does AI caption generation work?', a: 'Describe your post and tone; GPT-4o writes platform-optimized captions with hashtags in seconds.' },
  { q: 'Can I post to multiple platforms at once?', a: 'Yes — create one post, select your platforms, and PostPilot publishes to all simultaneously.' },
  { q: 'What happens if a scheduled post fails?', a: 'PostPilot auto-retries up to 3 times, then shows a clear failure reason in your post history so you can fix and retry.' },
];

const APP_URL = 'https://post-pilot-vert-theta.vercel.app';

const FaqItem: FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-white hover:bg-white/5 transition-colors"
      >
        <span>{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-violet-400 flex-shrink-0 ml-3" />
          : <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0 ml-3" />
        }
      </button>
      {open && <p className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed">{a}</p>}
    </div>
  );
};

const Landing: FC = () => (
  <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">

    {/* ── Navbar ── */}
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/40">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">PostPilot</span>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <Link to="/guide" className="hover:text-white transition-colors">Guide</Link>
        </div>
        <Link
          to="/login"
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors shadow-lg shadow-violet-600/30"
        >
          Get Started Free
        </Link>
      </div>
    </nav>

    {/* ── Hero ── */}
    <section className="relative pt-36 pb-28 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-indigo-500/8 rounded-full blur-[90px] animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-pink-500/8 rounded-full blur-[90px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Social media scheduling, reimagined
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                Schedule Smarter.
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Grow Faster.
              </span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              PostPilot lets you schedule Instagram, Facebook, and LinkedIn posts in seconds — with AI captions, a visual calendar, and real-time analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 hover:-translate-y-0.5"
              >
                Get Started Free →
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white transition-all"
              >
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Floating platform orbs */}
          <div className="relative w-80 h-80 flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/10 blur-3xl" />
            <div className="float1 absolute top-2 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-pink-500/40 ring-1 ring-white/10">
              <InstagramIcon className="w-7 h-7 text-white" />
            </div>
            <div className="float2 absolute bottom-10 left-6 w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40 ring-1 ring-white/10">
              <FacebookIcon className="w-7 h-7 text-white" />
            </div>
            <div className="float3 absolute bottom-10 right-6 w-16 h-16 rounded-2xl bg-sky-600 flex items-center justify-center shadow-2xl shadow-sky-600/40 ring-1 ring-white/10">
              <Linkedin className="w-7 h-7 text-white" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-600/30 to-indigo-600/20 flex items-center justify-center ring-1 ring-violet-500/30 backdrop-blur-sm shadow-2xl shadow-violet-600/20">
                <Rocket className="w-10 h-10 text-violet-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── Social proof ── */}
    <section className="border-y border-white/5 bg-white/[0.02] py-8 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <p className="text-sm text-zinc-500 font-medium">Join creators scheduling smarter</p>
        <div className="flex items-center gap-10">
          {([['10K+', 'Posts Scheduled'], ['3', 'Platforms Supported'], ['5K+', 'AI Captions Generated']] as const).map(([val, lbl]) => (
            <div key={lbl}>
              <p className="text-2xl font-black text-white">{val}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Features ── */}
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              grow your presence
            </span>
          </h2>
          <p className="text-zinc-400 text-base max-w-xl mx-auto">All the tools a creator needs. Zero fluff.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center mb-4 group-hover:bg-violet-600/25 transition-colors">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Platforms ── */}
    <section className="py-20 px-6 bg-white/[0.015]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-3">One tool, every platform</h2>
        <p className="text-zinc-400 mb-12">Connect your accounts once and post everywhere.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link
            to="/login"
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-pink-600/20 to-purple-700/20 border border-pink-500/20 hover:border-pink-500/40 hover:scale-105 transition-all duration-300 shadow-xl shadow-pink-600/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <InstagramIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Instagram</p>
              <p className="text-xs text-zinc-400 mt-0.5">Business & Creator accounts</p>
            </div>
            <span className="text-xs font-medium text-pink-400 group-hover:text-pink-300 transition-colors">Connect →</span>
          </Link>

          <Link
            to="/login"
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/20 hover:border-blue-500/40 hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-600/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <FacebookIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Facebook</p>
              <p className="text-xs text-zinc-400 mt-0.5">Pages & personal profiles</p>
            </div>
            <span className="text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">Connect →</span>
          </Link>

          <Link
            to="/login"
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-sky-600/20 to-sky-700/20 border border-sky-500/20 hover:border-sky-500/40 hover:scale-105 transition-all duration-300 shadow-xl shadow-sky-600/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
              <Linkedin className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">LinkedIn</p>
              <p className="text-xs text-zinc-400 mt-0.5">Personal & company pages</p>
            </div>
            <span className="text-xs font-medium text-sky-400 group-hover:text-sky-300 transition-colors">Connect →</span>
          </Link>
        </div>
      </div>
    </section>

    {/* ── How it works ── */}
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-3">Up and running in minutes</h2>
        <p className="text-zinc-400 mb-16">Three steps to your first scheduled post.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            { step: '01', title: 'Connect Accounts', desc: 'Link Instagram, Facebook, and LinkedIn with a single OAuth flow.' },
            { step: '02', title: 'Create Content', desc: 'Write your post, add media, and generate an AI caption if you want one.' },
            { step: '03', title: 'Schedule & Publish', desc: 'Pick a date and time. PostPilot handles the rest, automatically.' },
          ].map(({ step, title, desc }, i) => (
            <div key={step} className="relative flex flex-col items-center sm:items-start text-center sm:text-left">
              {i < 2 && (
                <div className="hidden sm:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent -z-10" />
              )}
              <div className="text-7xl font-black text-white/5 leading-none mb-4 select-none">{step}</div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Pricing ── */}
    <section id="pricing" className="py-24 px-6 bg-white/[0.015]">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
        <p className="text-zinc-400 mb-14">Start free. Upgrade when you're ready.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
          {/* Free */}
          <div className="flex flex-col p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <p className="text-sm font-semibold text-zinc-400 mb-1">Free</p>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-xs text-zinc-500 mb-1.5">/ forever</span>
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {['3 social accounts', '10 posts / month', 'AI captions (5/mo)', 'Basic analytics'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                  <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link to="/login?plan=free" className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-white/5 hover:bg-white/10 text-zinc-300 transition-all">
              Start for free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col p-6 rounded-2xl bg-violet-600/10 border border-violet-500/40 shadow-2xl shadow-violet-600/20">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-600 text-xs font-semibold text-white">
              Most Popular
            </div>
            <p className="text-sm font-semibold text-violet-300 mb-1">Pro</p>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-4xl font-black text-white">$19</span>
              <span className="text-xs text-zinc-400 mb-1.5">/ month</span>
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {['Unlimited accounts', 'Unlimited posts', 'Unlimited AI captions', 'Advanced analytics', 'Priority support'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link to="/login?plan=pro" className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-600/30">
              Get started
            </Link>
          </div>

          {/* Unlimited */}
          <div className="flex flex-col p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <p className="text-sm font-semibold text-zinc-400 mb-1">Unlimited</p>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-4xl font-black text-white">$49</span>
              <span className="text-xs text-zinc-500 mb-1.5">/ month</span>
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {['Everything in Pro', 'Team members (5)', 'Custom analytics', 'API access', 'Dedicated support'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                  <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link to="/login?plan=unlimited" className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-white/5 hover:bg-white/10 text-zinc-300 transition-all">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* ── FAQ ── */}
    <section id="faq" className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((item) => <FaqItem key={item.q} {...item} />)}
        </div>
      </div>
    </section>

    {/* ── CTA banner ── */}
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-700 p-14 text-center shadow-2xl shadow-violet-600/30">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)' }}
          />
          <h2 className="relative text-3xl font-extrabold text-white mb-3">Start Scheduling Today</h2>
          <p className="relative text-white/75 mb-8 text-base">Free forever. No credit card required.</p>
          <Link
            to="/login"
            className="relative inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-violet-700 text-sm font-bold hover:bg-zinc-50 transition-all shadow-xl hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </section>

    {/* ── Footer ── */}
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
              <Rocket className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">PostPilot</span>
          </Link>
          <div className="flex items-center flex-wrap justify-center gap-5 text-xs text-zinc-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/refund" className="hover:text-white transition-colors">Refund</Link>
          </div>
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="PostPilot app"
            className="text-zinc-500 hover:text-sky-400 transition-colors"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-700">© 2025 PostPilot. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

export default Landing;
