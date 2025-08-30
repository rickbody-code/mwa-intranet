"use client";
import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="container flex items-center justify-center h-[60vh]">
      <div className="card max-w-md w-full space-y-6">
        <h1 className="h1">Sign in</h1>
        <p className="text-sm text-gray-600">Use your Microsoft work account.</p>
        <button className="btn btn-primary w-full justify-center" onClick={() => signIn("azure-ad")}>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
