import { useState } from 'react';
import { Card, Btn, Badge } from '../components/ui.jsx';
import { cn, formatCurrency, fmtItems, PRODUCT_CATALOG } from '../utils.js';

function formatLitres(value) {
  return `${Number(value || 0).toFixed(1)} L`;
}

function formatCompact(value) {
  return formatCurrency(value);
}

function LandingPage({ onNavigate, onRouteChange }) {
  // LandingPage.jsx used to depend on seed helpers that lived in App.jsx.
  // Make it self-contained so the landing page always renders.
  const safePrev = [];
  const handleNavigate = (target) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    } else if (typeof onRouteChange === 'function') {
      onRouteChange(target);
    }
  };
  const metrics = { orders: 0, credit: 0, milk: 0 };

  const prev = safePrev;
  const pFarmers = [];
  const pCredit = [];

  void prev; void pFarmers; void pCredit;

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAF8F5", fontFamily: "'Manrope', sans-serif" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E8E2D9] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button className="flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1A1A]">
              <span className="text-xs font-black text-white tracking-wider">DXI</span>
            </div>
            <div className="text-left">
              <p className="text-base font-bold text-[#1A1A1A] leading-none">DXI</p>
              <p className="text-xs text-[#999] mt-0.5">Dairy Intelligence</p>
            </div>
          </button>
          <div className="hidden sm:flex items-center gap-3">
            <Btn variant="secondary" onClick={() => scrollTo("pricing")}>Pricing</Btn>
            <Btn variant="primary"   onClick={() => handleNavigate("login")}>Sign In →</Btn>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-4 py-1.5 text-xs font-semibold text-[#666] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E] inline-block"></span>
              Built for dairy businesses in Jharkhand
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-[#1A1A1A] leading-[1.08] tracking-tight">
              One dairy.<br />
              <span className="text-[#C9A96E]">One dashboard.</span>
            </h1>
            <p className="mt-6 text-lg text-[#666] leading-relaxed max-w-lg">
              Orders, farmers, credit, and delivery — managed from a single clean browser dashboard. Replace WhatsApp chaos and paper registers today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Btn variant="primary" className="px-8 py-3 text-base" onClick={() => handleNavigate("login")}>
                View demo →
              </Btn>
              <Btn variant="secondary" className="px-8 py-3 text-base" onClick={() => scrollTo("contact")}>
                Contact us
              </Btn>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-[#999]">
              <span className="flex items-center gap-1.5"><span className="text-[#C9A96E]">✓</span> No app download</span>
              <span className="flex items-center gap-1.5"><span className="text-[#C9A96E]">✓</span> Works on any phone</span>
              <span className="flex items-center gap-1.5"><span className="text-[#C9A96E]">✓</span> Live cloud sync</span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="rounded-3xl bg-white border border-[#E8E2D9] shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold text-[#999] uppercase tracking-widest">Live snapshot</p>
                <p className="text-lg font-bold text-[#1A1A1A] mt-0.5">DXI Control Room</p>
              </div>
              <Badge label="Demo data" tone="bg-[#F0EDE8] text-[#8B7355]" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-2xl bg-[#1A1A1A] p-4 text-white">
                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Orders</p>
                <p className="text-2xl font-black">{metrics.orders}</p>
                <p className="text-xs text-white/50 mt-1">Today</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "#C9A96E" }}>
                <p className="text-[10px] uppercase tracking-widest text-white/70 mb-2">Milk</p>
                <p className="text-2xl font-black text-white">{formatLitres(metrics.milk)}</p>
                <p className="text-xs text-white/70 mt-1">Collected</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-[10px] uppercase tracking-widest text-red-400 mb-2">Credit</p>
                <p className="text-2xl font-black text-red-600">{formatCompact(metrics.credit)}</p>
                <p className="text-xs text-red-400 mt-1">Pending</p>
              </div>
            </div>
            <div className="rounded-2xl bg-[#FAF8F5] p-4">
              <p className="text-xs font-semibold text-[#1A1A1A] mb-3">Recent orders</p>
              <div className="space-y-2">
                {(prev || []).map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-[#E8E2D9]">
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{o.customerName}</p>
                      <p className="text-xs text-[#999]">{fmtItems(o.items)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1A1A1A]">{formatCurrency(o.amount)}</p>
                      <Badge label={o.deliveryStatus} tone={DELIVERY_STYLES[o.deliveryStatus]} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A96E] mb-3">The Problem</p>
          <h2 className="text-3xl font-black text-[#1A1A1A] mb-10 max-w-xl">Dairy operations are stuck in 2005.</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Triple entry chaos",    d: "WhatsApp order → paper register → computer. Same data entered three times, every day." },
              { n: "02", t: "₹1.5L in limbo",        d: "Credit sales with no proper record. No follow-up system. Money that should have come back — hasn't." },
              { n: "03", t: "No delivery proof",      d: "Milkman writes 'delivered' in a WhatsApp group. No accountability, no customer confirmation." }
            ].map(p => (
              <div key={p.n} className="rounded-2xl border border-[#E8E2D9] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF8F5] text-sm font-black text-[#C9A96E] mb-5">{p.n}</div>
                <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{p.t}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="px-6 py-16" style={{ background: "#FAF8F5" }}>
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A96E] mb-3">The Solution</p>
          <h2 className="text-3xl font-black text-[#1A1A1A] mb-10 max-w-xl">Everything in one place. No training needed.</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Orders dashboard",    d: "Add orders manually or via WhatsApp. Auto-calculates amount, tracks payment status, generates delivery list." },
              { n: "02", t: "Credit tracker",       d: "See every rupee owed. Automatic WhatsApp reminder with one click. Auto-blocks orders when limit crossed." },
              { n: "03", t: "Delivery management",  d: "Milkman gets a WhatsApp link. Taps 'Delivered'. Customer gets confirmation. Clean printed route sheet too." }
            ].map(s => (
              <div key={s.n} className="rounded-2xl border border-[#C9A96E]/30 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A96E]/10 text-sm font-black text-[#C9A96E] mb-5">{s.n}</div>
                <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{s.t}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C9A96E] mb-3">Pricing</p>
          <h2 className="text-3xl font-black text-[#1A1A1A] mb-10">Simple monthly rent. No contract.</h2>
          <div className="grid lg:grid-cols-2 gap-6 max-w-3xl">
            <div className="rounded-2xl border border-[#E8E2D9] p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-[#999] mb-4">Starter</p>
              <p className="text-4xl font-black text-[#1A1A1A]">₹1,999</p>
              <p className="text-sm text-[#999] mt-1 mb-6">per month</p>
              <ul className="space-y-2.5 text-sm text-[#555] mb-8">
                {["Order management","Credit tracker","Delivery sheet + print","Mobile-ready browser app"].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#C9A96E]">✓</span>{f}</li>
                ))}
              </ul>
              <Btn variant="secondary" className="w-full" onClick={() => window.location.href = "mailto:hello@dxi.in"}>Contact us</Btn>
            </div>
            <div className="rounded-2xl border-2 border-[#1A1A1A] bg-[#1A1A1A] p-7 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Pro — Most Popular</p>
              <p className="text-4xl font-black">₹3,999</p>
              <p className="text-sm text-white/40 mt-1 mb-6">per month</p>
              <ul className="space-y-2.5 text-sm text-white/70 mb-8">
                {["Everything in Starter","Farmer ledger (60 farmers)","WhatsApp automation","Cattle health tracking","Investor dashboard (English)"].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#C9A96E]">✓</span>{f}</li>
                ))}
              </ul>
              <Btn variant="gold" className="w-full" onClick={() => window.location.href = "mailto:hello@dxi.in"}>Get started →</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16" style={{ background: "#FAF8F5" }}>
        <div className="mx-auto max-w-3xl rounded-3xl bg-[#1A1A1A] px-10 py-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Ready to see it?</p>
          <h2 className="text-3xl font-black text-white mb-4">Try the live demo</h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto text-sm leading-relaxed">Login with demo credentials and explore the full dashboard — orders, farmers, credit, delivery. Real data, real features.</p>
          <Btn variant="gold" className="px-10 py-3 text-base" onClick={() => handleNavigate("login")}>Open demo →</Btn>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-[#E8E2D9] bg-white px-6 py-10">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1A1A]">
                <span className="text-[10px] font-black text-white">DXI</span>
              </div>
              <span className="font-bold text-[#1A1A1A]">DXI — Dairy Intelligence</span>
            </div>
            <p className="text-sm text-[#999] max-w-sm">Orders, farmers, credit and delivery management in one clean browser dashboard.</p>
          </div>
          <div className="text-sm text-[#999]">
            <p>Email: hello@dxi.in</p>
            <p className="mt-1">Phone: +91 90000 00000</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
