'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function TradingProhibitionsPage() {
  return (
    <LegalLayout title="Trading Prohibitions" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 16 }}>
          ONCHYRA is committed to maintaining a safe, legal, and compliant platform for all users. The following activities are strictly prohibited on the Platform. Engaging in any of these activities may result in immediate account suspension or termination, forfeiture of funds, and referral to law enforcement authorities where applicable.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>1. Prohibited Activities Overview</h3>
        <p style={{ marginBottom: 12 }}>
          The following activities are prohibited when using the ONCHYRA Platform:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Any activity that violates applicable laws, regulations, or statutes in any jurisdiction</li>
          <li style={{ marginBottom: 6 }}>Any activity designed to circumvent or undermine the Platform&apos;s security measures</li>
          <li style={{ marginBottom: 6 }}>Any activity that interferes with the proper functioning of the Platform or other users&apos; experience</li>
          <li style={{ marginBottom: 6 }}>Any activity that involves deception, fraud, or misrepresentation</li>
          <li style={{ marginBottom: 6 }}>Any activity that exposes ONCHYRA, its users, or the broader digital asset ecosystem to legal, regulatory, or financial risk</li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          This list is not exhaustive. ONCHYRA reserves the right to determine, in its sole discretion, whether an activity violates these prohibitions.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>2. Money Laundering</h3>
        <p style={{ marginBottom: 12 }}>
          Money laundering is strictly prohibited on the Platform. You may not use ONCHYRA to:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Process, transmit, or facilitate the transfer of funds derived from illegal activities</li>
          <li style={{ marginBottom: 6 }}>Structure transactions to evade reporting requirements or avoid detection thresholds</li>
          <li style={{ marginBottom: 6 }}>Use the Platform to convert proceeds of crime into legitimate-looking digital assets</li>
          <li style={{ marginBottom: 6 }}>Engage in &quot;layering&quot; activities designed to obscure the origin of funds</li>
          <li style={{ marginBottom: 6 }}>Use multiple accounts to move funds in a manner inconsistent with legitimate use patterns</li>
          <li><p>Act as an unlicensed money transmitter or facilitate unauthorized value transfer services</p></li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA implements robust anti-money laundering (AML) controls, including transaction monitoring, suspicious activity reporting, and customer due diligence procedures. We cooperate fully with law enforcement agencies in the investigation and prevention of money laundering activities.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>3. Terrorist Financing</h3>
        <p style={{ marginBottom: 12 }}>
          The Platform must not be used, directly or indirectly, to provide financial support to terrorist organizations or individuals engaged in terrorist activities. Prohibited conduct includes:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Transferring funds to individuals or entities designated as terrorist organizations by relevant authorities</li>
          <li style={{ marginBottom: 6 }}>Using the Platform to solicit or collect funds for terrorist purposes</li>
          <li style={{ marginBottom: 6 }}>Facilitating financial transactions that support terrorist activities or organizations</li>
          <li><p>Circumventing sanctions or other measures designed to prevent terrorist financing</p></li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA maintains lists of designated persons and entities from relevant authorities and screens all users against these lists. Any transactions involving designated persons or entities are blocked and reported to the appropriate authorities.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>4. Sanctions Violations</h3>
        <p style={{ marginBottom: 12 }}>
          You may not use the Platform if you are:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>A resident of, or located in, a country or territory subject to comprehensive sanctions (including but not limited to Cuba, Iran, North Korea, Syria, and the Crimea, Donetsk, and Luhansk regions of Ukraine)</li>
          <li style={{ marginBottom: 6 }}>Listed on any government-maintained list of sanctioned or restricted parties (including the U.S. OFAC SDN List, EU Consolidated List, or UN Security Council Sanctions List)</li>
          <li style={{ marginBottom: 6 }}>Owned or controlled by, or acting on behalf of, any sanctioned person or entity</li>
          <li><p>Engaging in any transaction or activity that would violate applicable sanctions laws or regulations</p></li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA conducts sanctions screening on all users and transactions. Any identified sanctions violations will result in immediate account suspension and referral to the appropriate authorities.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>5. Market Manipulation</h3>
        <p style={{ marginBottom: 12 }}>
          Market manipulation activities are prohibited on the Platform. These include:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Wash Trading:</strong> Engaging in transactions where you simultaneously buy and sell the same asset to create the appearance of market activity or artificially inflate trading volumes</li>
          <li style={{ marginBottom: 6 }}><strong>Pump and Dump:</strong> Coordinating with others to artificially inflate the price of an asset through false or misleading statements, then selling at the inflated price</li>
          <li style={{ marginBottom: 6 }}><strong>Spoofing:</strong> Placing orders with the intent to cancel them before execution to create a false impression of market demand or supply</li>
          <li style={{ marginBottom: 6 }}><strong>Frontrunning:</strong> Using knowledge of pending transactions to execute trades ahead of other users for personal gain</li>
          <li style={{ marginBottom: 6 }}><strong>Spread Manipulation:</strong> Deliberately creating artificial spreads between bid and ask prices to exploit other users</li>
          <li><p><strong>False Information:</strong> Disseminating false or misleading information about assets, the Platform, or market conditions to influence trading behavior</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>6. Unauthorized Access</h3>
        <p style={{ marginBottom: 12 }}>
          Attempting to gain unauthorized access to the Platform, other user accounts, or any related systems is strictly prohibited. This includes:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Unauthorized access to another user&apos;s account through credential theft, phishing, or social engineering</li>
          <li style={{ marginBottom: 6 }}>Attempting to bypass or circumvent the Platform&apos;s authentication, authorization, or security controls</li>
          <li style={{ marginBottom: 6 }}>Using automated tools, scripts, or bots to access or interact with the Platform in unauthorized ways</li>
          <li style={{ marginBottom: 6 }}>Testing the vulnerability of the Platform without prior written authorization from ONCHYRA</li>
          <li style={{ marginBottom: 6 }}>Interfering with, disrupting, or degrading the performance of the Platform or its infrastructure</li>
          <li><p>Uploading or transmitting malicious code, viruses, or other harmful materials to the Platform</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>7. Enforcement and Consequences</h3>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA employs a multi-layered approach to detecting and preventing prohibited activities:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Automated transaction monitoring systems that flag suspicious patterns in real-time</li>
          <li style={{ marginBottom: 6 }}>Manual review by our compliance team for escalated cases</li>
          <li style={{ marginBottom: 6 }}>Ongoing due diligence and account monitoring</li>
          <li style={{ marginBottom: 6 }}>Cooperation with law enforcement and regulatory authorities</li>
          <li style={{ marginBottom: 6 }}>Suspicious Activity Reports (SARs) filed with relevant Financial Intelligence Units (FIUs)</li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          Consequences for engaging in prohibited activities include:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Immediate suspension of the offending account pending investigation</li>
          <li style={{ marginBottom: 6 }}>Permanent termination of the account upon confirmation of violations</li>
          <li style={{ marginBottom: 6 }}>Forfeiture of any funds held in the account</li>
          <li style={{ marginBottom: 6 }}>Referral to law enforcement authorities and regulatory bodies</li>
          <li><p>Pursuit of civil remedies and damages where applicable</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>8. Reporting Violations</h3>
        <p style={{ marginBottom: 12 }}>
          If you become aware of any prohibited activity on the Platform, please report it immediately through the platform&apos;s support section. Reports can be made anonymously. We take all reports seriously and will investigate promptly.
        </p>
      </div>
    </LegalLayout>
  );
}
