'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function FeesPage() {
  return (
    <LegalLayout title="Fee Schedule" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 16 }}>
          ONCHYRA maintains a transparent and competitive fee structure. Below is a comprehensive overview of all fees associated with using the platform. We are committed to keeping costs low so that you can maximize your earnings.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Deposit Fees</h3>
        <div style={{ marginBottom: 20, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>All deposit methods</span>
            <span style={{ fontWeight: 700, color: '#a78bfa' }}>FREE</span>
          </div>
          <p style={{ marginBottom: 0, fontSize: 12 }}>
            ONCHYRA does not charge any fees for deposits. You will receive the full amount you transfer, minus any network transaction fees charged by the blockchain or payment processor you use to send funds. Network fees vary based on the blockchain network&apos;s current congestion and are not controlled by ONCHYRA.
          </p>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Withdrawal Fees</h3>
        <div style={{ marginBottom: 20, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Standard withdrawal</span>
            <span style={{ fontWeight: 700, color: '#60a5fa' }}>1%</span>
          </div>
          <p style={{ marginBottom: 12, fontSize: 12 }}>
            A flat 1% fee is applied to all withdrawal requests. This fee is deducted from the withdrawal amount before processing. The fee covers blockchain network costs and platform processing expenses.
          </p>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ marginBottom: 4 }}><strong>Example:</strong> If you withdraw $100, you will receive $99 after the 1% fee deduction.</p>
            <p style={{ marginBottom: 0 }}><strong>Minimum withdrawal:</strong> $10 (or equivalent in your selected cryptocurrency).</p>
          </div>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>P2P Transfer Fees</h3>
        <div style={{ marginBottom: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Peer-to-peer transfer</span>
            <span style={{ fontWeight: 700, color: '#22c55e' }}>10% burn</span>
          </div>
          <p style={{ marginBottom: 12, fontSize: 12 }}>
            All peer-to-peer transfers between ONCHYRA users carry a 10% burn rate. This means 10% of the transferred amount is permanently removed from circulation as a deflationary mechanism, while the recipient receives 90% of the transfer amount.
          </p>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <p style={{ marginBottom: 4 }}><strong>Example:</strong> If you send $100 via P2P transfer, the recipient receives $90 and $10 is burned.</p>
            <p style={{ marginBottom: 0 }}><strong>Purpose:</strong> The burn mechanism reduces total token supply over time, potentially supporting long-term value appreciation for all holders.</p>
          </div>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Plan Purchase Fees</h3>
        <div style={{ marginBottom: 20, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>All mining plans</span>
            <span style={{ fontWeight: 700, color: '#a78bfa' }}>FREE</span>
          </div>
          <p style={{ marginBottom: 0, fontSize: 12 }}>
            There are no additional fees for purchasing mining plans. You pay only the listed plan price with no hidden charges, processing fees, or administrative costs. The full plan amount is allocated to your mining operations.
          </p>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Commission Rates (Referral Earnings)</h3>
        <div style={{ marginBottom: 20, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Level 1 — Direct Referrals</span>
              <span style={{ fontWeight: 700, color: '#60a5fa' }}>10%</span>
            </div>
            <p style={{ marginBottom: 12, fontSize: 12 }}>
              Earn 10% commission on the plan purchase price when a user you directly invite makes a qualifying purchase. Commissions are calculated on the full plan price and credited to your account in real-time.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Level 2 — Indirect Referrals</span>
              <span style={{ fontWeight: 700, color: '#60a5fa' }}>5%</span>
            </div>
            <p style={{ marginBottom: 12, fontSize: 12 }}>
              Earn 5% commission on plan purchases made by users referred by your Level 1 referrals. This tier allows you to benefit from the growth of your entire network, not just your direct referrals.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Level 3 — Third-Level Referrals</span>
              <span style={{ fontWeight: 700, color: '#60a5fa' }}>3%</span>
            </div>
            <p style={{ marginBottom: 0, fontSize: 12 }}>
              Earn 3% commission on plan purchases made by users referred by your Level 2 referrals. This provides an additional layer of passive income as your network expands.
            </p>
          </div>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Fee Summary Table</h3>
        <div style={{ marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Service</div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'right' }}>Fee</div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>Deposits</div>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>Free</div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>Withdrawals</div>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, textAlign: 'right', color: '#60a5fa', fontWeight: 600 }}>1%</div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>P2P Transfers</div>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, textAlign: 'right', color: '#a78bfa', fontWeight: 600 }}>10% burn</div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>Plan Purchases</div>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>Free</div>

            <div style={{ padding: '10px 16px', fontSize: 13 }}>Account Maintenance</div>
            <div style={{ padding: '10px 16px', fontSize: 13, textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>Free</div>
          </div>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Fee Changes</h3>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA reserves the right to modify its fee structure at any time. Users will be notified of any fee changes at least thirty (30) days in advance through platform notifications. Continued use of the Platform after the effective date of any fee changes constitutes acceptance of the new fee structure.
        </p>
      </div>
    </LegalLayout>
  );
}
