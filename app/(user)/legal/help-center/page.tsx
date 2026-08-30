'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function HelpCenterPage() {
  return (
    <LegalLayout title="Help Center" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 16 }}>
          Welcome to the ONCHYRA Help Center. This guide will walk you through everything you need to know to get started, manage your account, and make the most of the ONCHYRA platform.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>1. Getting Started</h3>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA is a digital asset platform that combines cloud mining, reward systems, and team-based earning opportunities. To begin your journey, follow these initial steps:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Visit the ONCHYRA website and click &quot;Sign Up&quot; to create your free account</li>
          <li style={{ marginBottom: 6 }}>Provide your email address, choose a secure password, and accept the Terms of Use</li>
          <li style={{ marginBottom: 6 }}>Verify your email address by clicking the confirmation link sent to your inbox</li>
          <li style={{ marginBottom: 6 }}>Enable two-factor authentication (2FA) for enhanced account security</li>
          <li><p>Fund your account with a deposit to begin using the platform</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>2. Account Setup and Security</h3>
        <p style={{ marginBottom: 12 }}>
          Protecting your account is our top priority. We recommend implementing the following security measures:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Strong Password:</strong> Use a unique password with at least 12 characters, including uppercase, lowercase, numbers, and special characters. Avoid reusing passwords from other services.</li>
          <li style={{ marginBottom: 6 }}><strong>Two-Factor Authentication:</strong> Enable 2FA using an authenticator app (Google Authenticator, Authy) for an additional layer of security. We strongly recommend against using SMS-based 2FA.</li>
          <li style={{ marginBottom: 6 }}><strong>Email Security:</strong> Use a secure, dedicated email address for your ONCHYRA account. Enable email 2FA if your email provider supports it.</li>
          <li style={{ marginBottom: 6 }}><strong>Phishing Awareness:</strong> Always verify that you are on the official ONCHYRA website (onchyra.com) before entering credentials. We will never ask for your password via email, phone, or chat.</li>
          <li><p><strong>Activity Monitoring:</strong> Regularly review your account activity, login history, and transaction records for any unauthorized actions.</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>3. Making Deposits</h3>
        <p style={{ marginBottom: 12 }}>
          To fund your ONCHYRA account and begin using the platform, follow these steps:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Navigate to the &quot;Wallet&quot; section of your dashboard</li>
          <li style={{ marginBottom: 6 }}>Click &quot;Deposit&quot; and select your preferred cryptocurrency or payment method</li>
          <li style={{ marginBottom: 6 }}>Copy the provided deposit address or scan the QR code</li>
          <li style={{ marginBottom: 6 }}>Send the desired amount from your external wallet or exchange</li>
          <li style={{ marginBottom: 6 }}>Wait for the required number of blockchain confirmations (typically 1-3 confirmations)</li>
          <li style={{ marginBottom: 6 }}>Funds will be credited to your account once confirmed</li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          <strong>Important:</strong> Minimum deposit amounts vary by payment method. Deposits below the minimum will not be credited and may be irrecoverable. Always double-check the deposit address and network before sending funds.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>4. Buying Plans</h3>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA offers various mining plans to suit different budgets and goals:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Bronze Plan ($50):</strong> Entry-level mining plan ideal for beginners. Provides basic mining power and daily reward rates.</li>
          <li style={{ marginBottom: 6 }}><strong>Silver Plan ($200):</strong> Mid-tier plan with enhanced mining capabilities and improved daily returns.</li>
          <li style={{ marginBottom: 6 }}><strong>Gold Plan ($500):</strong> Premium plan with significant mining power and accelerated reward generation.</li>
          <li style={{ marginBottom: 6 }}><strong>Platinum Plan ($1,500):</strong> High-value plan with maximum mining capacity and priority reward distribution.</li>
          <li><p><strong>Diamond Plan ($5,000):</strong> Our flagship plan designed for serious investors seeking maximum returns.</p></li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          To purchase a plan, navigate to the &quot;Plans&quot; section, select your preferred plan, confirm the payment method, and complete the transaction. Your mining rewards will begin accruing immediately after purchase confirmation.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>5. Withdrawals</h3>
        <p style={{ marginBottom: 12 }}>
          You can withdraw your earned rewards at any time, subject to the following:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Minimum Withdrawal:</strong> The minimum withdrawal amount is $10 (or equivalent in your selected cryptocurrency).</li>
          <li style={{ marginBottom: 6 }}><strong>Withdrawal Fee:</strong> A 1% fee is applied to all withdrawals. Fees are deducted from the withdrawal amount.</li>
          <li style={{ marginBottom: 6 }}><strong>Processing Time:</strong> Withdrawal requests are typically processed within 1-24 hours. During periods of high demand, processing may take up to 48 hours.</li>
          <li style={{ marginBottom: 6 }}><strong>Verification:</strong> Withdrawal of amounts exceeding $1,000 may require additional identity verification.</li>
          <li><p><strong>Destination:</strong> Withdrawals are sent to the wallet address you specify. Always verify your withdrawal address — transactions sent to incorrect addresses cannot be reversed.</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>6. Peer-to-Peer (P2P) Transfers</h3>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA supports peer-to-peer transfers between users on the platform:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Navigate to the &quot;P2P Transfer&quot; section of your dashboard</li>
          <li style={{ marginBottom: 6 }}>Enter the recipient&apos;s ONCHYRA username or registered email address</li>
          <li style={{ marginBottom: 6 }}>Specify the amount you wish to send</li>
          <li style={{ marginBottom: 6 }}>Review the transfer details and confirm the transaction</li>
          <li><p><strong>Note:</strong> A 10% burn rate applies to all P2P transfers. This means 10% of the transferred amount is permanently removed from circulation, supporting the token&apos;s deflationary mechanism.</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>7. Referral Program</h3>
        <p style={{ marginBottom: 12 }}>
          Earn passive income by inviting others to join ONCHYRA:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Level 1 (Direct Referrals):</strong> Earn 10% commission on plan purchases made by users you directly invite</li>
          <li style={{ marginBottom: 6 }}><strong>Level 2 (Indirect Referrals):</strong> Earn 5% commission on purchases by users invited by your Level 1 referrals</li>
          <li style={{ marginBottom: 6 }}><strong>Level 3 (Third-Level):</strong> Earn 3% commission on purchases by users invited by your Level 2 referrals</li>
          <li style={{ marginBottom: 6 }}>Share your unique referral link from the &quot;Referrals&quot; section of your dashboard</li>
          <li><p>Commissions are credited to your account in real-time as referrals make qualifying purchases</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>8. Contact Support</h3>
        <p style={{ marginBottom: 12 }}>
          If you need assistance beyond what this guide covers, our support team is here to help:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Live Chat:</strong> Available 24/7 through the chat widget on our website</li>
          <li style={{ marginBottom: 6 }}><strong>Help Desk:</strong> Submit a ticket through the support portal for complex issues</li>
          <li><p><strong>Knowledge Base:</strong> Browse our comprehensive documentation and tutorials for self-service support</p></li>
        </ul>
      </div>
    </LegalLayout>
  );
}
