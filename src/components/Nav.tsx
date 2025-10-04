"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export function Nav() {
  const { data: session } = useSession();
  const role = (session as any)?.role;
  
  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="mwa-header">
      <div className="mwa-header-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div className="mwa-logo-section">
            <div>
              <Link href="/" className="mwa-logo" style={{ color: 'white', textDecoration: 'none' }}>
                Marsden Wealth Advisers
              </Link>
              <div className="mwa-tagline">Staff Intranet Portal</div>
            </div>
          </div>
          <div className="mwa-user-info">
            {session ? (
              <>
                Welcome back!<br />
                {formatDate()}
                {role === "ADMIN" && (
                  <>
                    <br />
                    <Link href="/admin" style={{ color: 'white', fontSize: '0.85rem', textDecoration: 'underline' }}>
                      Admin Panel
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                {formatDate()}
                <br />
                <button 
                  className="btn btn-ghost" 
                  onClick={() => signIn()}
                  style={{ 
                    marginTop: '0.5rem', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" /> Sign in
                </button>
              </>
            )}
          </div>
        </div>
        {session && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              {session.user?.email}
            </span>
            {role && (
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>
                {role}
              </span>
            )}
            <button 
              className="btn btn-ghost" 
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{ 
                marginLeft: 'auto',
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.3)',
                fontSize: '0.8rem',
                padding: '0.35rem 0.75rem'
              }}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
