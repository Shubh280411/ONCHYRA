'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function BugBountyPage() {
  return (
    <LegalLayout title="Bug Bounty" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 16 }}>
          ONCHYRA is committed to maintaining the highest standards of security for our platform and our users. We operate a Bug Bounty Program to encourage and reward security researchers who help us identify and resolve vulnerabilities responsibly.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>1. Program Overview</h3>
        <p style={{ marginBottom: 12 }}>
          Our Bug Bounty Program invites ethical hackers and security researchers to test the security of the ONCHYRA platform and report any vulnerabilities they discover. In return, we offer financial rewards based on the severity and impact of the reported issue.
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>We welcome reports from individual researchers, security teams, and academic institutions</li>
          <li style={{ marginBottom: 6 }}>The program operates on a year-round basis with no fixed enrollment period</li>
          <li style={{ marginBottom: 6 }}>Rewards are paid in USD or equivalent cryptocurrency within 30 days of confirmed vulnerability</li>
          <li style={{ marginBottom: 6 }}>We are committed to transparent communication throughout the disclosure process</li>
          <li style={{ marginBottom: 6 }}>All reports are treated confidentially, and we will not pursue legal action against researchers who comply with our responsible disclosure guidelines</li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>2. Scope</h3>
        <p style={{ marginBottom: 12 }}>The following assets and areas are in scope for the Bug Bounty Program:</p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Web Application:</strong> The main ONCHYRA web application at onchyra.com and all subdomains</li>
          <li style={{ marginBottom: 6 }}><strong>API:</strong> The ONCHYRA REST API and GraphQL endpoints used by the platform</li>
          <li style={{ marginBottom: 6 }}><strong>Mobile Applications:</strong> Official ONCHYRA iOS and Android applications</li>
          <li style={{ marginBottom: 6 }}><strong>Smart Contracts:</strong> Any ONCHYRA-deployed smart contracts on supported blockchain networks</li>
          <li style={{ marginBottom: 6 }}><strong>Infrastructure:</strong> ONCHYRA-owned servers, cloud instances, and CDN infrastructure</li>
        </ul>
        <p style={{ marginBottom: 12 }}>The following are out of scope:</p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Third-party services, libraries, or platforms not owned or operated by ONCHYRA</li>
          <li style={{ marginBottom: 6 }}>Social engineering attacks against ONCHYRA employees or users</li>
          <li style={{ marginBottom: 6 }}>Physical attacks against ONCHYRA infrastructure</li>
          <li style={{ marginBottom: 6 }}>Denial-of-service (DoS) attacks or testing that degrades platform performance</li>
          <li><p>Automated scanning tools that generate excessive traffic or false positives</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>3. Rewards</h3>
        <p style={{ marginBottom: 12 }}>
          Rewards are determined based on the severity of the vulnerability and its potential impact on the platform and its users:
        </p>
        <div style={{ marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Severity</div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Reward Range</div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div>
              Critical
            </div>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, fontWeight: 600, color: '#ef4444' }}>$10</div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }}></div>
              High
            </div>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, fontWeight: 600, color: '#f97316' }}>$5</div>

            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }}></div>
              Medium
            </div>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, fontWeight: 600, color: '#eab308' }}>$50 — $200</div>

            <div style={{ padding: '10px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }}></div>
              Low
            </div>
            <div style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>$10 — $50</div>
          </div>
        </div>
        <p style={{ marginBottom: 12 }}>
          Bonus rewards may be awarded for particularly impactful discoveries, innovative attack vectors, or reports that include detailed remediation recommendations. The final reward amount is determined at ONCHYRA&apos;s discretion based on the completeness and quality of the report.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>4. Submission Process</h3>
        <p style={{ marginBottom: 12 }}>To submit a vulnerability report, follow these steps:</p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Step 1:</strong> Document the vulnerability with a clear description, steps to reproduce, affected components, and potential impact</li>
          <li style={{ marginBottom: 6 }}><strong>Step 2:</strong> Submit the report through the platform&apos;s support section with the subject line &quot;Bug Bounty Report — [Severity Level]&quot;</li>
          <li style={{ marginBottom: 6 }}><strong>Step 3:</strong> Include any proof-of-concept code, screenshots, or logs that demonstrate the vulnerability</li>
          <li style={{ marginBottom: 6 }}><strong>Step 4:</strong> Await acknowledgment (typically within 48 hours) and further instructions from our security team</li>
          <li style={{ marginBottom: 6 }}><strong>Step 5:</strong> Work with our team to validate the vulnerability and agree on a resolution timeline</li>
          <li><p><strong>Step 6:</strong> Receive your reward upon successful validation and resolution of the vulnerability</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>5. Responsible Disclosure</h3>
        <p style={{ marginBottom: 12 }}>
          All participants in the Bug Bounty Program must adhere to the following responsible disclosure principles:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Do not access, modify, or delete data belonging to other users</li>
          <li style={{ marginBottom: 6 }}>Do not perform testing that could disrupt the Platform&apos;s availability or degrade user experience</li>
          <li style={{ marginBottom: 6 }}>Do not publicly disclose the vulnerability until ONCHYRA has confirmed the fix has been deployed</li>
          <li style={{ marginBottom: 6 }}>Do not use social engineering, phishing, or physical attacks as part of your research</li>
          <li style={{ marginBottom: 6 }}>Do not access accounts other than your own for testing purposes</li>
          <li><p>Do not exploit a vulnerability beyond the minimum necessary to demonstrate its existence</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>6. Eligibility</h3>
        <p style={{ marginBottom: 12 }}>To be eligible for a reward under the Bug Bounty Program, you must:</p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Be at least 18 years of age</li>
          <li style={{ marginBottom: 6 }}>Not be an ONCHYRA employee, contractor, or immediate family member of an employee</li>
          <li style={{ marginBottom: 6 }}>Be the first person to report the specific vulnerability</li>
          <li style={{ marginBottom: 6 }}>Provide sufficient information to reproduce and validate the vulnerability</li>
          <li style={{ marginBottom: 6 }}>Comply with all applicable laws and these responsible disclosure guidelines</li>
          <li><p>Not have been previously banned from the program for violations</p></li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          Multiple reports of the same vulnerability may be eligible for reduced rewards. Priority is given to the first valid report received. Duplicate reports will be notified and may receive a nominal reward for the effort.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>7. Contact</h3>
        <p style={{ marginBottom: 12 }}>
          For questions about the Bug Bounty Program or to submit a report, contact us through the platform&apos;s support section.
        </p>
      </div>
    </LegalLayout>
  );
}
