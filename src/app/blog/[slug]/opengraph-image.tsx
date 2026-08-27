import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog';

export const alt = 'CrushSVG Blog';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  const title = post?.title || 'CrushSVG Blog & Guides';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFCFA',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#D94A1E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: 'bold',
              marginRight: '12px',
            }}
          >
            SVG
          </div>
          <span
            style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#353A3E',
              letterSpacing: '-0.02em',
            }}
          >
            Crush<span style={{ color: '#D94A1E' }}>SVG</span> Blog
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: '64px',
            fontWeight: '800',
            color: '#353A3E',
            textAlign: 'center',
            lineHeight: 1.15,
            maxWidth: '960px',
            marginBottom: '30px',
            justifyContent: 'center',
          }}
        >
          {title}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
