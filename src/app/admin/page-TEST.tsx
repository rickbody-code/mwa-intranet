'use client';

import { useSession, signIn } from 'next-auth/react';

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (!session) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: '40px auto' }}>
        <h2 style={{ marginBottom: 12 }}>Sign in</h2>
        <p style={{ marginBottom: 12 }}>Use your Microsoft work account.</p>
        <button
          onClick={() => signIn()} // uses the default provider you configured
          style={{ padding: '10px 16px', borderRadius: 8 }}
        >
          Sign in with Microsoft
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin</h2>
      <p>Signed in as <strong>{session.user?.email}</strong></p>
      <p>You should now see your admin UI here. (We can swap this back to the original once verified.)</p>
    </div>
  );
}

