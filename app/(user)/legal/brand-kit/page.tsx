'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function BrandKitPage() {
  return (
    <LegalLayout title="Brand Kit" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 16 }}>
          This Brand Kit provides guidelines for the correct and consistent use of ONCHYRA&apos;s brand assets. Following these guidelines ensures our brand is represented accurately and professionally across all channels and materials.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Brand Guidelines</h3>
        <p style={{ marginBottom: 12 }}>
          The ONCHYRA brand represents innovation, trust, and accessibility in the digital asset space. When using our brand assets, please adhere to the following principles:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Always use the official ONCHYRA logo and brand assets provided in this kit</li>
          <li style={{ marginBottom: 6 }}>Maintain consistent spacing, proportions, and color usage</li>
          <li style={{ marginBottom: 6 }}>Ensure sufficient contrast between the logo and its background</li>
          <li style={{ marginBottom: 6 }}>Use the brand assets only in contexts that align with ONCHYRA&apos;s values and mission</li>
          <li><p>Never alter, distort, or modify the logo in any way</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Logo Usage</h3>
        <p style={{ marginBottom: 12 }}>
          The ONCHYRA logo should be used as follows:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Minimum Size:</strong> The logo should not be displayed at a width smaller than 80px in digital media or 1 inch (25mm) in print</li>
          <li style={{ marginBottom: 6 }}><strong>Clear Space:</strong> Maintain a minimum clear space around the logo equal to the height of the &quot;O&quot; in ONCHYRA</li>
          <li style={{ marginBottom: 6 }}><strong>Approved Backgrounds:</strong> Use the logo on dark backgrounds (#0a0a0a to #1a1a1a), solid colors from the brand palette, or high-quality images with sufficient contrast</li>
          <li style={{ marginBottom: 6 }}><strong>File Formats:</strong> Available in SVG (preferred for digital), PNG (for raster use), and EPS (for print) formats</li>
          <li><p><strong>Wordmark:</strong> The ONCHYRA wordmark should always appear in the official typeface (Space Grotesk) and cannot be recreated in alternative fonts</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Color Palette</h3>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA&apos;s brand colors are carefully selected to convey our identity. Use these colors consistently across all materials:
        </p>
        <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
            <div style={{ width: '100%', height: 48, borderRadius: 8, background: '#a78bfa', marginBottom: 10 }}></div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'rgba(255,255,255,0.8)' }}>Primary</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>#a78bfa</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>RGB: 167, 139, 250</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
            <div style={{ width: '100%', height: 48, borderRadius: 8, background: '#60a5fa', marginBottom: 10 }}></div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'rgba(255,255,255,0.8)' }}>Secondary</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>#60a5fa</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>RGB: 96, 165, 250</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
            <div style={{ width: '100%', height: 48, borderRadius: 8, background: '#22c55e', marginBottom: 10 }}></div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'rgba(255,255,255,0.8)' }}>Accent</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>#22c55e</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>RGB: 34, 197, 94</div>
          </div>
        </div>
        <p style={{ marginBottom: 12 }}>
          The primary color (#a78bfa) should be used for main brand elements, headers, and key visual components. The secondary color (#60a5fa) serves as a complementary accent for links, highlights, and supporting elements. The accent color (#22c55e) is reserved for success states, positive indicators, and call-to-action elements.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Typography</h3>
        <p style={{ marginBottom: 12 }}>
          ONCHYRA uses two primary typefaces across all brand materials:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Space Grotesk:</strong> Used for headings, titles, and display text. This geometric sans-serif typeface conveys modernity and technical precision. Available in weights: Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700).</li>
          <li style={{ marginBottom: 6 }}><strong>Inter:</strong> Used for body text, UI elements, and supporting content. This highly legible sans-serif typeface is optimized for digital screens and ensures readability across all sizes and devices. Available in weights: Regular (400), Medium (500), SemiBold (600), Bold (700).</li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          When these fonts are not available, fallback to system fonts: &quot;Space Grotesk&quot; falls back to &quot;Arial, sans-serif&quot; and &quot;Inter&quot; falls back to &quot;-apple-system, BlinkMacSystemFont, sans-serif&quot;.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Dos and Don&apos;ts</h3>
        <p style={{ marginBottom: 8, fontWeight: 600, color: '#22c55e' }}>Dos</p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Use the official logo files provided in the Brand Kit</li>
          <li style={{ marginBottom: 6 }}>Maintain the logo&apos;s aspect ratio and proportions at all times</li>
          <li style={{ marginBottom: 6 }}>Use brand colors consistently across all materials</li>
          <li style={{ marginBottom: 6 }}>Ensure text is legible against background colors</li>
          <li style={{ marginBottom: 6 }}>Use the official typefaces for all ONCHYRA-branded content</li>
          <li style={{ marginBottom: 6 }}>Leave sufficient clear space around the logo</li>
          <li style={{ marginBottom: 6 }}>Contact the brand team for approval on non-standard uses</li>
          <li><p>Use the provided color palette for all branded materials and communications</p></li>
        </ul>
        <p style={{ marginBottom: 8, fontWeight: 600, color: '#ef4444' }}>Don&apos;ts</p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Do not stretch, rotate, skew, or distort the logo</li>
          <li style={{ marginBottom: 6 }}>Do not change the logo colors or apply gradients, shadows, or effects</li>
          <li style={{ marginBottom: 6 }}>Do not place the logo on busy or low-contrast backgrounds</li>
          <li style={{ marginBottom: 6 }}>Do not recreate the logo or wordmark in alternative fonts</li>
          <li style={{ marginBottom: 6 }}>Do not use the brand colors outside of their designated contexts</li>
          <li style={{ marginBottom: 6 }}>Do not use outdated or unofficial versions of brand assets</li>
          <li style={{ marginBottom: 6 }}>Do not combine the ONCHYRA logo with other logos or trademarks</li>
          <li><p>Do not use the ONCHYRA brand in any way that implies endorsement without authorization</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Asset Downloads</h3>
        <p style={{ marginBottom: 12 }}>
          Brand assets are available for download in the following formats:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Logo Package:</strong> SVG, PNG (1x, 2x, 3x), and EPS formats in full color, monochrome white, and monochrome black variants</li>
          <li style={{ marginBottom: 6 }}><strong>Color Palette:</strong> ASE, CLR, and CSS custom property files</li>
          <li style={{ marginBottom: 6 }}><strong>Typography:</strong> Web font files (WOFF2, WOFF) and desktop fonts (TTF, OTF)</li>
          <li><p><strong>Templates:</strong> Presentation templates, social media templates, and email signature templates</p></li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          For access to the full brand asset library, please contact us through the platform&apos;s support section.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Contact</h3>
        <p style={{ marginBottom: 12 }}>
          For questions about brand usage, approval requests, or to report unauthorized use of ONCHYRA brand assets, contact us through the platform&apos;s support section.
        </p>
      </div>
    </LegalLayout>
  );
}
