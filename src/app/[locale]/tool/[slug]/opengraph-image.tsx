import { ImageResponse } from 'next/og';
import { ALL_TOOLS, hasVerifiedScore, computeOverall } from '@/data/tools';
import { SITE_NAME } from '@/config/site';

/**
 * Audit fix 3.2 — dynamic Open Graph images.
 *
 * Every tool page previously shared the same generic Unsplash stock photo as
 * its social preview, which kills click-through when links are shared. Each
 * page now generates a branded card showing the tool name, its category,
 * price, and — importantly — its honest verification status rather than an
 * invented rating.
 */

export const alt = 'Tool overview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return ALL_TOOLS.map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: { slug: string } }) {
  const tool = ALL_TOOLS.find((t) => t.slug === params.slug);

  if (!tool) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0E0F12',
            color: '#F4F4F5',
            fontSize: 64,
          }}
        >
          {SITE_NAME}
        </div>
      ),
      size
    );
  }

  const tested = hasVerifiedScore(tool);
  const overall = tested && tool.scores ? computeOverall(tool.scores) : null;

  const statusLabel = tested
    ? 'HANDS-ON TESTED'
    : tool.verificationLevel === 'pricing-verified'
      ? 'PRICING VERIFIED'
      : 'LISTED';

  const statusColor = tested ? '#34D399' : tool.verificationLevel === 'pricing-verified' ? '#F7C948' : '#71717A';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0E0F12 0%, #1C1F26 100%)',
          padding: 72,
          color: '#F4F4F5',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#F7C948', letterSpacing: 1 }}>
            {SITE_NAME}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: `2px solid ${statusColor}`,
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 20,
              fontWeight: 700,
              color: statusColor,
              letterSpacing: 1,
            }}
          >
            {statusLabel}
          </div>
        </div>

        {/* Tool name */}
        <div
          style={{
            display: 'flex',
            fontSize: tool.name.length > 22 ? 62 : 82,
            fontWeight: 900,
            marginTop: 40,
            lineHeight: 1.05,
          }}
        >
          {tool.name}
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#A1A1AA',
            marginTop: 18,
            lineHeight: 1.3,
          }}
        >
          {tool.tagline.length > 88 ? `${tool.tagline.slice(0, 88)}…` : tool.tagline}
        </div>

        {/* Footer stats */}
        <div
          style={{
            display: 'flex',
            marginTop: 'auto',
            alignItems: 'center',
            gap: 28,
            fontSize: 28,
          }}
        >
          {overall !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#34D39922',
                border: '2px solid #34D399',
                borderRadius: 10,
                padding: '10px 20px',
                color: '#34D399',
                fontWeight: 800,
              }}
            >
              {overall.toFixed(1)}/10
            </div>
          )}
          <div style={{ display: 'flex', color: '#D4D4D8' }}>{tool.category}</div>
          <div style={{ display: 'flex', color: '#52525B' }}>·</div>
          <div style={{ display: 'flex', color: '#34D399', fontWeight: 700 }}>
            {tool.startingPrice ?? tool.pricing}
          </div>
        </div>
      </div>
    ),
    size
  );
}
