// frontend/src/pages/legal/Privacy.tsx
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';

const S: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
    <div className="text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
  </div>
);

const Privacy: FC = () => (
  <div className="min-h-screen bg-zinc-950 text-white px-6 py-16">
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 mb-10 group">
        <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
          <Rocket className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold group-hover:text-violet-400 transition-colors">PostPilot</span>
      </Link>

      <h1 className="text-3xl font-extrabold mb-2">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mb-12">Last updated: April 22, 2025</p>

      <S title="1. Information We Collect">
        <p><strong className="text-white">Account information:</strong> Email address and name when you sign up.</p>
        <p><strong className="text-white">Social account data:</strong> OAuth access tokens, platform usernames, and profile pictures from connected Instagram, Facebook, and LinkedIn accounts. Tokens are stored encrypted with AES-256-GCM.</p>
        <p><strong className="text-white">Content data:</strong> Post text, scheduled times, media files you upload, and published post IDs returned by social platforms.</p>
        <p><strong className="text-white">Usage data:</strong> Log data including IP addresses, browser type, pages visited, and feature usage — collected for security and product improvement.</p>
      </S>
      <S title="2. How We Use Your Information">
        <p>We use your information to: provide and improve the Service, authenticate your identity, connect to social platform APIs on your behalf, send transactional emails (e.g. post failure alerts), and detect and prevent fraudulent or abusive activity.</p>
      </S>
      <S title="3. Data Sharing">
        <p>We do not sell, rent, or share your personal data with third parties for marketing purposes. We share data only with:</p>
        <p><strong className="text-white">Social platforms</strong> (Instagram, Facebook, LinkedIn) when publishing content on your behalf.</p>
        <p><strong className="text-white">Infrastructure providers</strong> (Supabase for database/auth, Railway for compute) under strict data processing agreements.</p>
        <p><strong className="text-white">Stripe</strong> for payment processing on paid plans. We never store raw card numbers.</p>
      </S>
      <S title="4. Token Storage and Security">
        <p>All social platform access tokens are encrypted at rest using AES-256-GCM before being stored in our database. Encryption keys are stored separately from the database. Tokens are never logged or exposed in API responses.</p>
      </S>
      <S title="5. Media Files">
        <p>Images and videos you upload are stored in Supabase Storage in a private bucket. Files are only accessible via signed URLs generated at publish time. We do not use your media for training AI models.</p>
      </S>
      <S title="6. Data Retention">
        <p>We retain your data for as long as your account is active. When you delete your account, all personal data, posts, and media files are permanently deleted within 30 days. Analytics data may be retained in anonymized aggregate form.</p>
      </S>
      <S title="7. Your Rights">
        <p>You have the right to access, correct, or delete your personal data at any time. You may request a data export or full account deletion by emailing <span className="text-violet-400">support@postpilot.app</span>. We respond to all requests within 30 days.</p>
      </S>
      <S title="8. Cookies">
        <p>PostPilot uses only essential session cookies required for authentication. We do not use tracking or advertising cookies. No third-party analytics scripts are loaded on our pages.</p>
      </S>
      <S title="9. Children's Privacy">
        <p>PostPilot is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.</p>
      </S>
      <S title="10. Changes to This Policy">
        <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
      </S>
      <S title="11. Contact">
        <p>For privacy questions or data requests, contact us at <span className="text-violet-400">support@postpilot.app</span></p>
      </S>

      <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-xs text-zinc-600">
        <Link to="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
        <Link to="/refund" className="hover:text-zinc-400 transition-colors">Refund Policy</Link>
        <Link to="/" className="hover:text-zinc-400 transition-colors">← Back to Home</Link>
      </div>
    </div>
  </div>
);

export default Privacy;
