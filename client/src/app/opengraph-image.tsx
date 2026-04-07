import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0f12',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            fontSize: '36px',
          }}>
            ⚡
          </div>
          <span style={{
            fontSize: '56px',
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: '-1px',
          }}>
            GoodsXP
          </span>
        </div>

        <div style={{
          fontSize: '28px',
          color: '#9ca3af',
          marginBottom: '48px',
          textAlign: 'center',
          lineHeight: '1.4',
        }}>
          Сучасна електроніка та гаджети
        </div>

        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
        }}>
          {[
            { icon: '🚚', text: 'Доставка 1-3 дні' },
            { icon: '🔒', text: 'Безпечна оплата' },
            { icon: '↩️', text: 'Повернення 14 днів' },
          ].map((badge, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              color: '#ffffff',
              fontSize: '18px',
            }}>
              <span style={{ fontSize: '22px' }}>{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)',
        }} />
      </div>
    ),
    {
      ...size,
    }
  );
}
