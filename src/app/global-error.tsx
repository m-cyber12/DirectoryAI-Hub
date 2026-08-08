'use client';

/**
 * Last-resort boundary: replaces the ROOT layout, so it must render its own
 * <html>/<body>. Only fires when the root layout itself throws.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0E0F12', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>CreatorAI Hub hit an unexpected error</h1>
          <p style={{ color: '#a1a1aa', maxWidth: 480, lineHeight: 1.6 }}>
            Please try again. If it keeps happening, the team can be reached via the contact page
            once the site recovers.
          </p>
          {error.digest && <p style={{ color: '#52525b', fontFamily: 'monospace' }}>ref: {error.digest}</p>}
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              background: '#F7C948',
              color: '#000',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload the site
          </button>
        </div>
      </body>
    </html>
  );
}
