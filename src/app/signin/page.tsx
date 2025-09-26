"use client";
import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null);
  const [devLoginForm, setDevLoginForm] = useState({ email: "", name: "" });

  useEffect(() => {
    const loadProviders = async () => {
      const providers = await getProviders();
      setProviders(providers);
    };
    loadProviders();
  }, []);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devLoginForm.email) return;
    
    await signIn("development", {
      email: devLoginForm.email,
      name: devLoginForm.name || devLoginForm.email.split("@")[0],
      callbackUrl: "/"
    });
  };

  const hasDevProvider = providers?.development;

  return (
    <div className="container flex items-center justify-center h-[60vh]">
      <div className="card max-w-md w-full space-y-6">
        <h1 className="h1">Sign in</h1>
        <p className="text-sm text-gray-600">Use your Microsoft work account.</p>
        
        <button className="btn btn-primary w-full justify-center" onClick={() => signIn("azure-ad")}>
          Sign in with Microsoft
        </button>

        {hasDevProvider && (
          <>
            <div className="divider">or</div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Development Login</h3>
              <p className="text-sm text-yellow-700 mb-4">
                ⚠️ Development mode only - not available in production
              </p>
              <form onSubmit={handleDevLogin} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={devLoginForm.email}
                  onChange={(e) => setDevLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={devLoginForm.name}
                  onChange={(e) => setDevLoginForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="btn bg-yellow-600 hover:bg-yellow-700 text-white w-full justify-center"
                >
                  Sign in (Development)
                </button>
              </form>
              <p className="text-xs text-yellow-600 mt-2">
                Use admin@example.com or dev@example.com for admin access
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
