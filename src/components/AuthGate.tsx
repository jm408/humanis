import { BuildVersion } from "./BuildVersion";
import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAuthClient, authenticatedFetch } from "../auth";
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    let unsubscribe = () => {};
    const update = (value: Session | null) => {
      if (alive) {
        setSession(value);
        if (!value) setApproved(false);
        setLoading(false);
      }
    };
    getAuthClient()
      .then(async (client) => {
        if (!alive) return;
        const { data } = client.auth.onAuthStateChange((_event, value) =>
          update(value),
        );
        unsubscribe = () => data.subscription.unsubscribe();
        const { data: initial, error } = await client.auth.getSession();
        if (error) throw error;
        update(initial.session);
      })
      .catch(() => {
        if (alive) {
          setMessage(
            "Private access is being configured. Please come back shortly.",
          );
          setLoading(false);
        }
      });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    let alive = true;
    authenticatedFetch("/api/auth/me")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (alive) {
          setApproved(true);
          setMessage("");
        }
      })
      .catch((error) => {
        if (alive) {
          setApproved(false);
          setMessage(error.message);
        }
      });
    return () => {
      alive = false;
    };
  }, [session?.access_token]);
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      setMessage(
        "If your account is invited, a sign-in link has been sent. Check your inbox.",
      );
    } catch {
      setMessage(
        "Unable to send the link. Check your invitation or try again later.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      const client = await getAuthClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      setMessage("");
    } catch {
      setMessage("Unable to sign out. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  if (approved && session)
    return (
      <>
        <div className="bg-zinc-900 text-zinc-300 flex justify-end items-center gap-3 px-4 py-2 text-xs">
          <span className="truncate">{session.user.email}</span>
          <button disabled={busy} onClick={signOut} className="text-amber-400">
            Sign out
          </button>
          {message && <span role="alert">{message}</span>}
        </div>
        {children}
      </>
    );
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <p className="text-amber-400 text-sm mb-2">HUMANIS · PRIVATE BETA</p>
        <h1 className="text-3xl font-semibold mb-3">
          Bring your memories back to life.
        </h1>
        <p className="text-zinc-400 mb-6">
          Sign in with your invited email to access the restoration studio.
        </p>
        {loading ? (
          <p role="status">Loading…</p>
        ) : session ? (
          <>
            <p>Checking your access…</p>
            <button
              disabled={busy}
              onClick={signOut}
              className="mt-4 text-amber-400"
            >
              Use another account
            </button>
          </>
        ) : (
          <form onSubmit={signIn} className="space-y-4">
            <label className="block text-sm">
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-lg bg-zinc-950 border border-zinc-700 p-3"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-lg bg-amber-500 text-zinc-950 font-semibold p-3 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm text-amber-200">
            {message}
          </p>
        )}
      </div>
      <div className="fixed bottom-0 inset-x-0">
        <BuildVersion />
      </div>
    </main>
  );
}
