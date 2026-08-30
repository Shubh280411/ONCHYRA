'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function FAQPage() {
  return (
    <LegalLayout title="FAQ" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 20 }}>
          Find answers to the most commonly asked questions about the ONCHYRA platform below. If your question is not addressed here, please contact our support team through the platform&apos;s support section.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>What is ONCHYRA?</h3>
        <p style={{ marginBottom: 20 }}>
          ONCHYRA is a digital asset platform that combines cloud mining, reward systems, and team-based earning opportunities. Users can participate in distributed mining operations without the need for specialized hardware, earn daily rewards based on their active plans, and build referral networks to earn additional commissions. The platform is designed to be accessible to both beginners and experienced participants in the digital asset space.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>How do I create an account?</h3>
        <p style={{ marginBottom: 20 }}>
          Creating an account on ONCHYRA is free and straightforward. Visit our website and click the &quot;Sign Up&quot; button. You will need to provide a valid email address and choose a secure password. After registering, check your inbox for a verification email and click the confirmation link. Once verified, you can enable two-factor authentication (2FA) for enhanced security. The entire process typically takes 5-10 minutes.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>How does the referral program work?</h3>
        <p style={{ marginBottom: 20 }}>
          ONCHYRA&apos;s referral program allows you to earn commissions by inviting others to join the platform. When someone signs up using your unique referral link and purchases a mining plan, you earn a commission based on their purchase amount. The program operates on three levels: Level 1 (direct referrals) earns 10% commission, Level 2 (referrals of your referrals) earns 5%, and Level 3 (third-level referrals) earns 3%. Commissions are credited in real-time and can be withdrawn or used to purchase additional plans. There is no limit to the number of people you can refer.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>What are the fees?</h3>
        <p style={{ marginBottom: 20 }}>
          ONCHYRA maintains a transparent and competitive fee structure. There are no fees for deposits, no fees for purchasing mining plans, and no hidden charges. A 1% withdrawal fee applies when you withdraw your earnings, which covers blockchain network transaction costs. Peer-to-peer (P2P) transfers between users carry a 10% burn rate, which is a deflationary mechanism that permanently removes tokens from circulation to support long-term value. There are no monthly maintenance fees or account-keeping charges.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>How do withdrawals work?</h3>
        <p style={{ marginBottom: 20 }}>
          Withdrawing your earnings from ONCHYRA is simple. Navigate to the &quot;Wallet&quot; section and click &quot;Withdraw.&quot; Enter the amount you wish to withdraw (minimum $10) and provide your external wallet address. Confirm the transaction, and your withdrawal will be processed within 1-24 hours. A 1% fee is deducted from the withdrawal amount. For withdrawals exceeding $1,000, additional identity verification may be required for security purposes. Always double-check your wallet address before confirming — blockchain transactions are irreversible.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Is my data secure?</h3>
        <p style={{ marginBottom: 20 }}>
          Absolutely. ONCHYRA takes data security extremely seriously. We employ AES-256 encryption for data at rest and TLS 1.3 for data in transit. Our infrastructure is hosted on enterprise-grade cloud providers with SOC 2 Type II and ISO 27001 certifications. We implement multi-factor authentication, regular security audits, penetration testing, and continuous monitoring for unauthorized access. User funds and data are stored in secure, segregated environments. Our security practices comply with industry standards and regulatory requirements. For more details, please review our Privacy Policy and Data Terms.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>How long does mining last?</h3>
        <p style={{ marginBottom: 20 }}>
          Each mining plan has a defined duration. The standard mining period for most plans is 365 days (1 year) from the date of purchase. During this period, daily rewards are calculated and credited to your account automatically. Once the mining period expires, your plan will no longer generate rewards. You can then choose to purchase a new plan to continue earning. There is no obligation to repurchase after your plan expires.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Can I purchase multiple plans?</h3>
        <p style={{ marginBottom: 20 }}>
          Yes, you can purchase as many plans as you wish. Multiple plans run concurrently and independently, meaning each plan generates its own daily rewards based on its value and duration. Purchasing additional plans increases your total mining power and potential earnings. There is no limit to the number of plans you can hold at any given time.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>What happens if I forget my password?</h3>
        <p style={{ marginBottom: 20 }}>
          If you forget your password, click the &quot;Forgot Password&quot; link on the login page. Enter your registered email address, and we will send you a secure reset link. Click the link in the email to create a new password. For security, the reset link expires after 24 hours. If you have two-factor authentication enabled, you will also need to verify your identity using your 2FA method during the reset process. If you are unable to access your email, please contact our support team with your account details for assistance.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Is ONCHYRA available worldwide?</h3>
        <p style={{ marginBottom: 20 }}>
          ONCHYRA is available to users in most countries around the world. However, due to regulatory requirements, we are unable to provide services to users in certain restricted jurisdictions, including countries subject to comprehensive sanctions. During the registration process, you will be asked to confirm that you are not located in or a resident of any restricted jurisdiction. We reserve the right to restrict or terminate accounts that violate these geographic restrictions. Users are responsible for ensuring that their use of the Platform complies with local laws and regulations.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>How can I contact support?</h3>
        <p style={{ marginBottom: 20 }}>
          Our support team is available 24/7 to assist you. You can reach us through live chat on our website (accessible via the chat widget in the bottom-right corner), or by submitting a ticket through our help desk portal. For general inquiries, responses are typically provided within 12 hours. For urgent matters, live chat provides the fastest response time. Our support team is available in English, Spanish, French, German, Portuguese, and Japanese.
        </p>
      </div>
    </LegalLayout>
  );
}
