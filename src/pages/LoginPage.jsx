import { useState } from 'react';
import { Btn, Input } from '../components/ui.jsx';
import { cn, DEMO_ACCOUNT } from '../utils.js';

function LoginPage({ onLogin, onNavigate, onRouteChange, onLoginSuccess, firebaseReady }) {
  const [form, setForm]       = useState({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleNavigate = (target) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    } else if (typeof onRouteChange === 'function') {
      onRouteChange(target);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await onLogin(form.email, form.password);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess({ email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name, provider: 'demo' });
    } else {
      handleNavigate('dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#FAF8F5" }}>
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left panel */}
        <div className="rounded-3xl bg-[#1A1A1A] p-8 text-white">
          <button className="text-white/50 text-sm hover:text-white mb-8 flex items-center gap-1" onClick={() => handleNavigate("landing")}>← Back</button>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <span className="text-xs font-black text-white">DXI</span>
            </div>
            <p className="font-bold text-lg">Dairy Intelligence</p>
          </div>
          <h1 className="text-3xl font-black leading-tight mb-4">Your dairy's control room is ready.</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-8">Browser-only. No app download. Works on any phone or computer. Cloud sync with Firebase.</p>
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-white/40 mb-1">Demo account</p>
              <p className="text-sm font-semibold">owner@dairyease.in</p>
              <p className="text-xs text-white/40 mt-0.5">Password: dairyease123</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-white/40 mb-1">Sync mode</p>
              <p className="text-sm font-semibold">{firebaseReady ? "Firebase cloud sync" : "Local demo mode"}</p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="rounded-3xl bg-white border border-[#E8E2D9] p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A96E] mb-2">Sign In</p>
          <h2 className="text-2xl font-black text-[#1A1A1A] mb-6">Welcome back</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Email address" type="email" required autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="owner@dairyease.in" />
            <Input label="Password" type="password" required autoComplete="current-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" />
            {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
            <Btn variant="primary" className="w-full py-3 text-base" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in →"}
            </Btn>
          </form>
          <p className="mt-6 text-xs text-[#999] text-center">Demo data loads automatically. No setup required.</p>
        <div className="mt-4 text-center">
          <button onClick={() => { window.location.hash = "#/milkman-login"; }}
            className="text-xs text-[#C9A96E] hover:underline">
            Milkman? Login here →
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Shell ──────────────────────────────────────────────────────────────────

export default LoginPage;
