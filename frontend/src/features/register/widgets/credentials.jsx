/**
 * Small "you're signed in" banner shown atop a wizard's first step when the account already
 * exists. Communicates that identity fields are prefilled and that the login is already set.
 */
export function SignedInBanner({ user }) {
  if (!user) return null;
  const google = user.authProvider === 'GOOGLE';
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '12px 14px',
        marginBottom: 18,
        borderRadius: 12,
        border: '1px solid var(--border-cream, rgba(0,0,0,0.08))',
        background: 'var(--cream, #faf7f2)',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--green, #059669)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1 }}
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        <div style={{ color: 'var(--ink)', fontWeight: 500 }}>
          Signed in as {user.email}
        </div>
        <div style={{ color: 'var(--ink-soft, #8c8476)', fontWeight: 300 }}>
          Your name and email are filled in from your account{google ? ' (Google)' : ''}.
        </div>
      </div>
    </div>
  );
}
