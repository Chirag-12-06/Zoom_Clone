"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, login, signup } from "@/lib/api";
import { getToken, setToken } from "@/lib/auth";

type AuthFormProps = { mode: "login" | "signup" };

/** Sign in / Sign up card. On success the token is saved and the user goes to the dashboard. */
export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Already logged in: nothing to do here
    if (getToken()) router.replace("/");
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = isSignup ? await signup(name.trim(), email, password) : await login(email, password);
      setToken(result.access_token);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 409)) setError(err.message);
      else if (err instanceof ApiError && err.status === 422) setError("Please check your details.");
      else setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zoom-border bg-zoom-surface-2 px-3 py-2 text-sm text-white outline-none placeholder:text-zoom-muted focus:border-zoom-blue focus:ring-1 focus:ring-zoom-blue";
  const labelClass = "flex flex-col gap-1 text-sm font-medium text-gray-200";

  return (
    <main className="flex min-h-dvh flex-col items-center bg-zoom-bg px-4 py-16">
      <p className="mb-8 text-3xl font-bold tracking-tight">zoom</p>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zoom-border bg-zoom-surface p-6 shadow-xl"
      >
        <h1 className="text-xl font-semibold">{isSignup ? "Create your account" : "Sign in"}</h1>

        {isSignup && (
          <label className={labelClass}>
            Full name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={100}
              required
              className={inputClass}
            />
          </label>
        )}
        <label className={labelClass}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            required
            className={inputClass}
          />
          {isSignup && <span className="text-xs font-normal text-zoom-muted">At least 8 characters</span>}
        </label>

        {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-zoom-blue py-2.5 text-sm font-semibold hover:bg-zoom-blue-dark disabled:bg-zoom-surface-2 disabled:text-zoom-muted"
        >
          {submitting ? "Please wait…" : isSignup ? "Sign up" : "Sign in"}
        </button>

        <p className="text-center text-sm text-zoom-muted">
          {isSignup ? "Already have an account? " : "New here? "}
          <Link href={isSignup ? "/login" : "/signup"} className="text-[#4b8bff] hover:underline">
            {isSignup ? "Sign in" : "Sign up free"}
          </Link>
        </p>
      </form>

      {!isSignup && (
        <p className="mt-4 text-center text-xs text-zoom-muted">
          Demo account: chirag@example.com / zoomdemo123
        </p>
      )}
      {/* Guests don't need an account to join someone else's meeting */}
      <Link href="/join" className="mt-6 text-sm text-zoom-muted hover:text-white">
        Join a meeting without signing in
      </Link>
    </main>
  );
}
