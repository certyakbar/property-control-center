import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export default function SignIn() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fn = mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } });
      const { error } = await fn;
      if (error) throw error;
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-sm card-surface p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-semibold">Ledgerless HMO</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "Sign in to view your demo organisation." : "Create an account to view the demo organisation."}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-secondary text-sm ring-focus" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Password</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-secondary text-sm ring-focus" />
          </div>
          {error && <p className="text-sm text-status-overdue">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="hover:underline">
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
          <Link to="/" className="hover:underline">Continue with demo data</Link>
        </div>
      </div>
    </div>
  );
}
