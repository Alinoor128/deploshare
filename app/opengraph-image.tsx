import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'DeploShare — Secure 6-Digit Code Ephemeral Sharing';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          padding: '60px',
        }}
      >
        {/* Glow accent */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0) 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Brand Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(37,99,235,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '9999px',
            padding: '10px 24px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#38bdf8',
            }}
          />
          <span
            style={{
              color: '#93c5fd',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            DEPLOSHARE SECURE TRANSFERS
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '56px',
            fontWeight: 900,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.15,
            margin: '0 0 20px 0',
            maxWidth: '900px',
          }}
        >
          Share Files & Confidential Text With Just a{' '}
          <span style={{ color: '#60a5fa' }}>6-Digit PIN</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            textAlign: 'center',
            margin: '0 0 40px 0',
            maxWidth: '750px',
          }}
        >
          Zero Permanent URLs • Client-Side AES-256 E2EE • Instant Self-Destruction
        </p>

        {/* 6-Digit Mock PIN Display */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          {['5', '8', '3', '2', '1', '4'].map((digit, i) => (
            <div
              key={i}
              style={{
                width: '64px',
                height: '76px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '2px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 900,
                color: '#60a5fa',
                fontFamily: 'monospace',
              }}
            >
              {digit}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
