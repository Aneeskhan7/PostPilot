// frontend/src/pages/legal/Terms.tsx
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';

const S: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
    <div className="text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
  </div>
);

const Terms: FC = () => (
  <div className="min-h-screen bg-zinc-950 text-white px-6 py-16">
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 mb-10 group">
        <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
          <Rocket className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold group-hover:text-violet-400 transition-colors">PostPilot</span>
      </Link>

      <h1 className="text-3xl font-extrabold mb-2">Terms of Service</h1>
      <p className="text-sm text-zinc-500 mb-12">Last updated: April 22, 2025</p>

      <S title="1. Acceptance of Terms">
        <p>By accessing or using PostPilot ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
      </S>
      <S title="2. Description of Service">
        <p>PostPilot is a social media scheduling platform that allows users to create, schedule, and publish content to Instagram, Facebook, and LinkedIn via their respective APIs.</p>
      </S>
      <S title="3. Account Registration">
        <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials and must notify us immediately of any unauthorized access.</p>
      </S>
      <S title="4. Acceptable Use">
        <p>You agree not to use PostPilot to post spam, illegal content, hate speech, or content that violates the terms of service of connected social platforms. We reserve the right to suspend accounts that violate these terms without prior notice.</p>
      </S>
      <S title="5. Third-Party Platforms">
        <p>PostPilot integrates with Instagram, Facebook, and LinkedIn. Your use of these platforms is governed by their respective terms of service. We are not responsible for changes to third-party APIs that may affect functionality or availability.</p>
      </S>
      <S title="6. Subscription and Billing">
        <p>PostPilot offers a Free plan and paid plans billed monthly. You may cancel at any time. Refunds are subject to our Refund Policy. Prices may change with 30 days' notice sent to your registered email address.</p>
      </S>
      <S title="7. Data and Privacy">
        <p>We collect and process data as described in our Privacy Policy. Social account tokens are stored with AES-256 encryption. We do not sell your personal data to third parties.</p>
      </S>
      <S title="8. Limitation of Liability">
        <p>PostPilot is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from your use of the Service, including failed scheduled posts, API downtime, or data loss.</p>
      </S>
      <S title="9. Termination">
        <p>We may suspend or terminate your account for violations of these Terms. You may delete your account at any time through the Settings page, which will remove all your data within 30 days.</p>
      </S>
      <S title="10. Changes to Terms">
        <p>We may update these Terms at any time. Continued use of PostPilot after changes constitutes acceptance. Material changes will be communicated via email to your registered address.</p>
      </S>
      <S title="11. Governing Law">
        <p>These Terms are governed by and construed in accordance with applicable law. Any disputes shall be resolved through binding arbitration.</p>
      </S>
      <S title="12. Contact">
        <p>Questions about these Terms? Email us at <span className="text-violet-400">support@postpilot.app</span></p>
      </S>

      <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-xs text-zinc-600">
        <Link to="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
        <Link to="/refund" className="hover:text-zinc-400 transition-colors">Refund Policy</Link>
        <Link to="/" className="hover:text-zinc-400 transition-colors">← Back to Home</Link>
      </div>
    </div>
  </div>
);

export default Terms;
