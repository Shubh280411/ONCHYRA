'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 16 }}>
          This Cookie Policy explains how ONCHYRA Inc. (&quot;ONCHYRA,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies and similar technologies when you access or use our platform, website, and related services (collectively, the &quot;Platform&quot;). It explains what these technologies are, why we use them, and your rights to control their use.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>1. What Are Cookies?</h3>
        <p style={{ marginBottom: 12 }}>
          Cookies are small text files that are placed on your computer, smartphone, tablet, or other device when you visit a website. They are widely used to make websites work efficiently and to provide information to website owners. Cookies can be &quot;persistent&quot; (remaining on your device until deleted) or &quot;session-based&quot; (deleted when you close your browser).
        </p>
        <p style={{ marginBottom: 12 }}>
          Cookies serve various purposes, such as enabling core functionality, remembering your preferences, understanding how you interact with our Platform, and improving your overall experience. They may also be used to deliver relevant advertisements and measure the effectiveness of our marketing campaigns.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>2. Types of Cookies We Use</h3>
        <p style={{ marginBottom: 8, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Essential Cookies</p>
        <p style={{ marginBottom: 12 }}>
          These cookies are strictly necessary for the Platform to function properly. They enable core features such as account authentication, session management, security, and load balancing. Without these cookies, services you have requested cannot be provided. Essential cookies cannot be disabled as they are required for the Platform to operate.
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>session_id:</strong> Maintains your authenticated session across page requests (Session)</li>
          <li style={{ marginBottom: 6 }}><strong>csrf_token:</strong> Protects against cross-site request forgery attacks (Session)</li>
          <li style={{ marginBottom: 6 }}><strong>auth_token:</strong> Remembers your login credentials for seamless access (Persistent, 30 days)</li>
          <li style={{ marginBottom: 6 }}><strong>load_balancer:</strong> Distributes traffic across servers to ensure platform stability (Session)</li>
        </ul>
        <p style={{ marginBottom: 8, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Analytics Cookies</p>
        <p style={{ marginBottom: 12 }}>
          These cookies collect information about how you use the Platform, such as which pages you visited, how long you stayed, and whether you encountered any errors. The data collected is aggregated and anonymous. We use this information to understand how visitors interact with the Platform and to improve its performance and user experience.
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>_ga:</strong> Google Analytics cookie that distinguishes unique users (Persistent, 2 years)</li>
          <li style={{ marginBottom: 6 }}><strong>_gid:</strong> Google Analytics cookie that distinguishes unique users (Session, 24 hours)</li>
          <li style={{ marginBottom: 6 }}><strong>_gat:</strong> Google Analytics cookie used to throttle request rate (Session, 1 minute)</li>
          <li style={{ marginBottom: 6 }}><strong>posthog:</strong> Product analytics for tracking feature usage (Persistent, 1 year)</li>
        </ul>
        <p style={{ marginBottom: 8, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Functional Cookies</p>
        <p style={{ marginBottom: 12 }}>
          These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to the Platform. If you do not allow these cookies, some or all of these services may not function properly.
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>language_pref:</strong> Remembers your preferred language setting (Persistent, 1 year)</li>
          <li style={{ marginBottom: 6 }}><strong>theme_mode:</strong> Stores your display preference (dark/light mode) (Persistent, 1 year)</li>
          <li style={{ marginBottom: 6 }}><strong>dashboard_layout:</strong> Remembers your customized dashboard configuration (Persistent, 6 months)</li>
          <li style={{ marginBottom: 6 }}><strong>notification_settings:</strong> Stores your notification preferences (Persistent, 1 year)</li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>3. Managing Cookies</h3>
        <p style={{ marginBottom: 12 }}>
          You can control and manage cookies in various ways. Please be aware that removing or blocking cookies may impact your user experience and parts of the Platform may no longer be fully accessible.
        </p>
        <p style={{ marginBottom: 8, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Browser Settings</p>
        <p style={{ marginBottom: 12 }}>
          Most web browsers allow you to manage cookies through their settings. You can typically find these settings in the &quot;Options,&quot; &quot;Preferences,&quot; or &quot;Settings&quot; menu of your browser. You can set your browser to refuse all or some cookies, or to alert you when websites set or access cookies.
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
          <li style={{ marginBottom: 6 }}><strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
          <li style={{ marginBottom: 6 }}><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
          <li style={{ marginBottom: 6 }}><strong>Edge:</strong> Settings &gt; Privacy, Search, and Services &gt; Cookies</li>
        </ul>
        <p style={{ marginBottom: 8, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Platform Cookie Preferences</p>
        <p style={{ marginBottom: 12 }}>
          You can manage your cookie preferences for the Platform through the cookie settings panel available in your account settings. This allows you to choose which categories of cookies you wish to enable or disable, except for essential cookies which are required for the Platform to function.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>4. Third-Party Cookies</h3>
        <p style={{ marginBottom: 12 }}>
          Some cookies are placed by third-party services that appear on our Platform. We do not control the use of these third-party cookies. The following third parties may set cookies through the Platform:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Google Analytics:</strong> Used for analytics and performance measurement. See Google&apos;s Privacy Policy at https://policies.google.com/privacy</li>
          <li style={{ marginBottom: 6 }}><strong>Stripe:</strong> Used for payment processing and fraud prevention. See Stripe&apos;s Privacy Policy at https://stripe.com/privacy</li>
          <li style={{ marginBottom: 6 }}><strong>Intercom:</strong> Used for customer support chat functionality. See Intercom&apos;s Privacy Policy at https://www.intercom.com/legal/privacy</li>
          <li style={{ marginBottom: 6 }}><strong>Hotjar:</strong> Used for user experience analytics and session recording. See Hotjar&apos;s Privacy Policy at https://www.hotjar.com/legal/policies/privacy/</li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>5. Cookie Duration</h3>
        <p style={{ marginBottom: 12 }}>
          The length of time a cookie remains on your device depends on whether it is a &quot;persistent&quot; or &quot;session&quot; cookie:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Session cookies</strong> are temporary and are deleted from your device when you close your web browser. They are used to maintain your session as you navigate the Platform.</li>
          <li style={{ marginBottom: 6 }}><strong>Persistent cookies</strong> remain on your device for a set period of time or until you delete them manually. They are used to recognize your device when you return to the Platform.</li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          The specific duration of each persistent cookie is listed in the cookie descriptions above. In all cases, you can delete cookies at any time through your browser settings.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>6. Changes to This Policy</h3>
        <p style={{ marginBottom: 12 }}>
          We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business operations. Any changes will be posted on this page with an updated &quot;Last Updated&quot; date. We encourage you to review this Cookie Policy periodically.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>7. Contact Us</h3>
        <p style={{ marginBottom: 12 }}>If you have any questions about our use of cookies, please contact us through the platform&apos;s support section.</p>
      </div>
    </LegalLayout>
  );
}
