"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function sanitizeDestination(url: string | null): string {
  if (!url || typeof url !== "string") return "/";
  const trimmed = url.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes(":")) {
    return "/";
  }
  return trimmed;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFrom = searchParams.get("from");
  const from = sanitizeDestination(rawFrom);

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setIsLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("Network error communicating with authentication service.");
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div
          role="alert"
          className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded font-medium"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Console Password
        </label>
        <div className="mt-2">
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter administrator password"
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-sm"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Verifying credentials..." : "Sign in to Console"}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2">
          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-mono font-bold text-sm tracking-tight">
            UK
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">UKCalc Console</span>
        </div>
        <h2 className="mt-4 text-center text-sm font-medium text-slate-600">
          Management & Governance Console
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Private operational access for platform owner
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10">
          <Suspense fallback={<div className="text-xs text-slate-500 text-center py-4">Loading login form...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Access restricted to authorised administrative users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}