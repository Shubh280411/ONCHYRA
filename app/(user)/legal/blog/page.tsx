'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function BlogPage() {
  return (
    <LegalLayout title="Blog" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 16 }}>
          Welcome to the ONCHYRA Blog. Our blog is currently under development and will serve as a central hub for news, insights, educational content, and community updates. Stay tuned for exciting content coming soon.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Coming Soon</h3>
        <p style={{ marginBottom: 12 }}>
          We are working on launching the ONCHYRA Blog with a comprehensive content strategy designed to inform, educate, and engage our community. The blog will feature a wide range of content types, including:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Platform Updates:</strong> Announcements about new features, product launches, partnerships, and platform improvements</li>
          <li style={{ marginBottom: 6 }}><strong>Market Insights:</strong> Analysis and commentary on digital asset market trends, price movements, and industry developments</li>
          <li style={{ marginBottom: 6 }}><strong>Educational Content:</strong> In-depth articles explaining blockchain technology, cryptocurrency fundamentals, and digital asset investment strategies</li>
          <li style={{ marginBottom: 6 }}><strong>Community Stories:</strong> Features highlighting ONCHYRA community members, their experiences, and their journeys with the platform</li>
          <li style={{ marginBottom: 6 }}><strong>Technical Deep Dives:</strong> Detailed explorations of the technology behind ONCHYRA, including mining infrastructure, security practices, and product architecture</li>
          <li><p><strong>Regulatory Updates:</strong> Analysis of regulatory developments affecting the digital asset industry and what they mean for ONCHYRA users</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Subscribe for Updates</h3>
        <p style={{ marginBottom: 12 }}>
          Be the first to know when the blog launches and receive our latest content directly in your inbox. Subscribers will also receive:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Early access to exclusive content and in-depth research reports</li>
          <li style={{ marginBottom: 6 }}>Weekly digest of the most important digital asset and platform news</li>
          <li style={{ marginBottom: 6 }}>Special announcements about upcoming features and promotions</li>
          <li style={{ marginBottom: 6 }}>Invitations to exclusive webinars, AMAs, and community events</li>
          <li><p>Subscriber-only educational resources and guides</p></li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          To subscribe, simply enter your email address in the subscription form on the blog page. You can manage your subscription preferences at any time, and we respect your inbox — we will only send content that is relevant and valuable to you. You can unsubscribe at any time with a single click.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Featured Topics Preview</h3>
        <p style={{ marginBottom: 12 }}>
          Here is a preview of the topics we plan to cover in our initial blog posts:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Understanding Cloud Mining:</strong> A comprehensive guide to how cloud mining works and why it is an accessible way to participate in digital asset generation</li>
          <li style={{ marginBottom: 6 }}><strong>The ONCHYRA Advantage:</strong> How our platform differs from traditional mining and other digital asset platforms</li>
          <li style={{ marginBottom: 6 }}><strong>Building Your Referral Network:</strong> Strategies and best practices for growing your team and maximizing referral earnings</li>
          <li style={{ marginBottom: 6 }}><strong>Digital Asset Security 101:</strong> Essential security practices every digital asset participant should follow</li>
          <li style={{ marginBottom: 6 }}><strong>Market Analysis Q3 2026:</strong> Our take on the current market conditions and what to watch in the coming months</li>
          <li style={{ marginBottom: 6 }}><strong>Meet the Team:</strong> Getting to know the people behind ONCHYRA and what drives them</li>
          <li style={{ marginBottom: 6 }}><strong>Regulatory Landscape 2026:</strong> A roundup of global regulatory developments affecting the digital asset industry</li>
          <li><p><strong>Community Spotlight:</strong> Featuring inspiring stories from ONCHYRA users around the world</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Content Schedule</h3>
        <p style={{ marginBottom: 12 }}>
          We plan to publish new blog content on a regular schedule once the blog is fully launched:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Weekly:</strong> Market insights and platform updates</li>
          <li style={{ marginBottom: 6 }}><strong>Bi-weekly:</strong> Educational deep dives and technical articles</li>
          <li style={{ marginBottom: 6 }}><strong>Monthly:</strong> Community stories and team features</li>
          <li><p><strong>Quarterly:</strong> Industry analysis reports and regulatory roundups</p></li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          All blog content will be reviewed for accuracy, compliance, and relevance before publication. We welcome community feedback and topic suggestions — if there is something you would like us to cover, please let us know through our support channels.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Contact</h3>
        <p style={{ marginBottom: 12 }}>
          For inquiries about the blog, content partnerships, or guest posting opportunities, please contact us through the platform&apos;s support section.
        </p>
      </div>
    </LegalLayout>
  );
}
