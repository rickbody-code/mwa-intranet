"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Shield, LogIn, LogOut, Megaphone } from "lucide-react";

export function Nav() {
  const { data: session } = useSession();
  const role = (session as any)?.role;

  return (
    <header className="sticky top-0 bg-white/70 backdrop-blur border-b z-40">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold">MWA Intranet</Link>
          {role === "ADMIN" && (
            <Link href="/admin" className="badge">
              <Megaphone className="w-3.5 h-3.5 mr-1" /> Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          {session ? (
            <>
              <span className="badge">Signed in</span>
              {role && <span className="badge">{role}</span>}
              <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => signIn()}>
              <LogIn className="w-4 h-4 mr-2" /> Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
