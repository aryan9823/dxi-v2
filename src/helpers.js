const { useEffect, useMemo, useState } = React;

// ─── Config ────────────────────────────────────────────────────────────────────

const PRODUCT_CATALOG = [
  { key: "milk",   label: "Milk",   unit: "L",  rate: 62  },
  { key: "paneer", label: "Paneer", unit: "kg", rate: 360 },
  { key: "dahi",   label: "Dahi",   unit: "kg", rate: 110 },
  { key: "lassi",  label: "Lassi",  unit: "L",  rate: 75  }
];

const NAV_ITEMS = [
  { route: "dashboard", label: "Dashboard", short: "Home" },     
  { route: "orders",    label: "Orders",         short: "Orders"   },
  { route: "farmers",   label: "Farmers",        short: "Farmers"  },
  { route: "credits",   label: "Credit",         short: "Credit"   },
  { route: "delivery",  label: "Delivery",       short: "Deliver"  },
  { route: "fleet", label: "Fleet", short: "Fleet" },
  { route: "crates", label: "Crates", short: "Crates" },
  { route: "whatsapp", label: "WhatsApp", short: "WA" }
];

const ROUTE_META = {
  dashboard: { title: "Dashboard",      subtitle: "Your dairy business at a glance" },
  orders:    { title: "Orders",         subtitle: "Manage all customer orders in one place" },
  farmers:   { title: "Farmers",        subtitle: "Milk collection, fat %, and payment summary" },
  credits:   { title: "Credit Tracker", subtitle: "See who owes what and for how long" },
  delivery:  { title: "Delivery",       subtitle: "Today's delivery list and live status" },
  fleet:     { title: "Fleet Control",  subtitle: "Live milkman locations, assignments and progress" },
 crates: {
  title: "Crate Ledger",
  subtitle: "Track crate movement and liability"
},

whatsapp: {
  title: "WhatsApp Orders",
  subtitle: "Auto order parsing and payments"
},
};

const PROTECTED_ROUTES = NAV_ITEMS.map(i => i.route);

const STORAGE_KEYS = {
  orders: "dxi_orders_v1",
  farmers: "dxi_farmers_v1",
  crates: "dxi_crates_v1",
  session: "dxi_session_v1"
};


const DEMO_ACCOUNT = {
  email:    "owner@dairyease.in",
  password: "dairyease123",
  name:     "DXI Admin",
  provider: "demo"
};

const MILKMAN_ACCOUNTS = [
  { id: "mm-1", email: "milkman1@dxi.in", password: "milkman123", name: "Ramesh (Milkman 1)", role: "milkman" },
  { id: "mm-2", email: "milkman2@dxi.in", password: "milkman123", name: "Suresh (Milkman 2)", role: "milkman" },
  { id: "mm-3", email: "milkman3@dxi.in", password: "milkman123", name: "Dinesh (Milkman 3)", role: "milkman" },
  { id: "mm-4", email: "milkman4@dxi.in", password: "milkman123", name: "Mahesh (Milkman 4)", role: "milkman" },
  { id: "mm-5", email: "milkman5@dxi.in", password: "milkman123", name: "Ganesh (Milkman 5)", role: "milkman" },
  { id: "mm-6", email: "milkman6@dxi.in", password: "milkman123", name: "Naresh (Milkman 6)", role: "milkman" },
];

// Dairy HQ location — Ranchi (update with real coords later)
const DAIRY_LOCATION = { lat: 23.3441, lng: 85.3096, name: "DXI Dairy, Ranchi" };

const STORAGE_KEYS_MM = {
  session:   "dxi_milkman_session_v1",
  locations: "dxi_milkman_locations_v1",
  assigned:  "dxi_assigned_orders_v1",
};

const PAYMENT_STYLES = {
  Paid:    "bg-emerald-100 text-emerald-700",
  Credit:  "bg-red-100 text-red-700",
  Advance: "bg-amber-100 text-amber-700"
};

const DELIVERY_STYLES = {
  Pending:           "bg-stone-100 text-stone-600",
  "Out for delivery":"bg-blue-100 text-blue-700",
  Delivered:         "bg-emerald-100 text-emerald-700"
};

// ─── Utilities ─────────────────────────────────────────────────────────────────

function cn() {
  return Array.from(arguments).flat().filter(Boolean).join(" ");
}

function formatCurrency(v) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
}

function formatCompact(v) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(v || 0);
}

function formatLitres(v) { return `${Number(v || 0).toFixed(1)} L`; }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDateFull(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getTodayKey() { return new Date().toISOString().slice(0, 10); }

function daysSince(iso) {
  const ms = new Date(getTodayKey()) - new Date(String(iso).slice(0, 10));
  return Math.max(0, Math.round(ms / 86400000));
}

function isToday(iso)     { return String(iso).slice(0, 10) === getTodayKey(); }
function isThisMonth(iso) {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}

function sumBy(arr, fn) { return (arr || []).reduce((s, x) => s + fn(x), 0); }
function slugify(t)     { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function sortByLatest(arr, k = "createdAt") { return [...arr].sort((a, b) => new Date(b[k]) - new Date(a[k])); }
function daysAgoDate(n, h) { const d = new Date(); d.setHours(h || 8, 15, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); }
function toNum(v)       { const p = parseFloat(v); return isFinite(p) ? p : 0; }
function phone(i)       { return `94311${String(10000 + i).slice(-5)}`; }

function orderItems(q) {
  return PRODUCT_CATALOG.filter(p => toNum(q[p.key]) > 0).map(p => {
    const qty = toNum(q[p.key]);
    return { key: p.key, label: p.label, unit: p.unit, rate: p.rate, quantity: qty, lineTotal: Math.round(qty * p.rate) };
  });
}

function orderAmount(q) { return orderItems(q).reduce((s, i) => s + i.lineTotal, 0); }
function fmtItems(items) { return items.map(i => `${i.label} ${i.quantity}${i.unit}`).join(", "); }

function getRoute() {
  const h = window.location.hash.replace(/^#\/?/, "").trim();
  const valid = ["landing", "login", "milkman-login", ...PROTECTED_ROUTES];
  return valid.includes(h) ? h : "landing";
}

function navigate(r) { window.location.hash = r === "landing" ? "" : `#/${r}`; }
function readLocal(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }
function writeLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function readSession() { return readLocal(STORAGE_KEYS.session); }
function saveSession(s) { writeLocal(STORAGE_KEYS.session, s); }
function clearSession() { localStorage.removeItem(STORAGE_KEYS.session); }
function sanitize(x) { return JSON.parse(JSON.stringify(x)); }

// ─── Seed Data ─────────────────────────────────────────────────────────────────

function buildSeedOrders() {
  const rows = [
    { name: "Birsa Oraon",    phone: "9431112045", area: "Morabadi, Ranchi",    qty: { milk: 4, paneer: 0.5 }, pay: "Paid",    del: "Delivered",       days: 0  },
    { name: "Rupa Devi",      phone: "9431112356", area: "Harmu Road, Ranchi",  qty: { milk: 2, dahi: 1 },    pay: "Credit",  del: "Pending",         days: 0  },
    { name: "Vincent Minz",   phone: "9431112488", area: "Namkum Bazaar",       qty: { milk: 6, lassi: 2 },   pay: "Advance", del: "Out for delivery",days: 0  },
    { name: "Sunita Kisku",   phone: "9431112511", area: "Kanke Road",          qty: { milk: 3, dahi: 0.5 },  pay: "Paid",    del: "Delivered",       days: 0  },
    { name: "Sukra Tudu",     phone: "9431112844", area: "Dhurwa",              qty: { milk: 5, paneer: 1 },  pay: "Credit",  del: "Out for delivery",days: 0  },
    { name: "Joba Lakra",     phone: "9431112915", area: "Bariatu",             qty: { milk: 2 },             pay: "Paid",    del: "Pending",         days: 0  },
    { name: "Michael Bara",   phone: "9431112990", area: "Booty More",          qty: { milk: 8, lassi: 1.5 }, pay: "Paid",    del: "Pending",         days: 0  },
    { name: "Phulo Soren",    phone: "9431113012", area: "Khunti Road",         qty: { milk: 8, paneer: 3 },  pay: "Credit",  del: "Delivered",       days: 34 },
    { name: "Joseph Kerketta",phone: "9431113158", area: "Simdega line hotel",  qty: { milk: 3, dahi: 2 },    pay: "Credit",  del: "Delivered",       days: 18 },
    { name: "Asha Hansda",    phone: "9431113279", area: "Ormanjhi",            qty: { milk: 2, paneer: 0.25, lassi: 1 }, pay: "Paid", del: "Delivered", days: 2 },
    { name: "Maria Toppo",    phone: "9431113394", area: "Tamar",               qty: { milk: 10, dahi: 2 },   pay: "Credit",  del: "Delivered",       days: 41 },
    { name: "Ajay Oraon",     phone: "9431113477", area: "Kokar",               qty: { milk: 6 },             pay: "Paid",    del: "Delivered",       days: 8  }
  ];

  return rows.map((r, i) => {
    const items = orderItems(r.qty);
    return {
      id: `order-${slugify(r.name)}-${i + 1}`,
      customerName: r.name, phone: r.phone, area: r.area,
      items, amount: items.reduce((s, x) => s + x.lineTotal, 0),
      paymentStatus: r.pay, deliveryStatus: r.del,
      notes: "", createdAt: daysAgoDate(r.days, 7 + (i % 5)), updatedAt: daysAgoDate(r.days, 9 + (i % 5))
    };
  });
}

function farmerEntries(idx) {
  const now = new Date(), days = now.getDate(), entries = [];
  for (let d = 1; d <= days; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d, 5, 30, 0, 0);
    const m = Number((4.4 + ((idx + d) % 6) * 0.8).toFixed(1));
    const e = Number((3.8 + ((idx * 2 + d) % 5) * 0.7).toFixed(1));
    const f = Number((3.9 + ((idx + d) % 5) * 0.2).toFixed(1));
    const t = m + e;
    entries.push({ date: date.toISOString(), morningLitres: m, eveningLitres: e, fat: f, totalLitres: t, payment: Math.round(t * f * 50) });
  }
  return entries;
}

function buildSeedFarmers() {
  const first = ["Birsa","Rupa","Vincent","Sunita","Sukra","Phulo","Joseph","Asha","Maria","Ajay","Joba","Michael"];
  const last  = ["Oraon","Toppo","Minz","Kisku","Tudu"];
  const vill  = ["Khunti","Bundu","Tamar","Simdega","Torpa","Mandar","Bero","Sisai","Lohardaga","Namkum"];
  const list  = [];
  for (let g = 0; g < last.length; g++) {
    for (let i = 0; i < first.length; i++) {
      const s = g * first.length + i + 1;
      list.push({ id: `farmer-${String(s).padStart(3,"0")}`, name: `${first[i]} ${last[g]}`, phone: phone(s), village: vill[(s-1) % vill.length], rate: 50, joinedAt: daysAgoDate(80-s,6), dailyEntries: farmerEntries(s) });
    }
  }
  return list;
}

function farmerSummary(f) {
  const me = (f.dailyEntries || []).filter(e => isThisMonth(e.date));
  const tL = sumBy(me, e => e.totalLitres);
  const tP = sumBy(me, e => e.payment);
  const aF = me.length ? sumBy(me, e => e.fat) / me.length : 0;
  const te = me.find(e => isToday(e.date));
  return { totalLitres: tL, totalPayment: tP, averageFat: aF, todayLitres: te ? te.totalLitres : 0, entries: me };
}

function creditLedger(orders) {
  const credits = orders.filter(o => o.paymentStatus === "Credit");
  const grouped = {};
  credits.forEach(o => {
    const k = o.phone || o.customerName;
    if (!grouped[k]) grouped[k] = { id: `credit-${slugify(o.customerName)}-${k.slice(-4)}`, name: o.customerName, phone: o.phone, amount: 0, lastOrder: o.createdAt, oldestDue: o.createdAt, area: o.area };
    grouped[k].amount += o.amount;
    grouped[k].lastOrder  = new Date(o.createdAt) > new Date(grouped[k].lastOrder)  ? o.createdAt : grouped[k].lastOrder;
    grouped[k].oldestDue  = new Date(o.createdAt) < new Date(grouped[k].oldestDue)  ? o.createdAt : grouped[k].oldestDue;
  });
  return Object.values(grouped).map(e => ({ ...e, daysOutstanding: daysSince(e.oldestDue) })).sort((a,b) => b.daysOutstanding - a.daysOutstanding);
}

// ─── Firebase ──────────────────────────────────────────────────────────────────

function initFirebase() {
  const cfg = window.DAIRYEASE_FIREBASE_CONFIG;
  const ok = cfg && cfg.apiKey && !String(cfg.apiKey).includes("YOUR_") && window.firebase && window.firebase.initializeApp;
  if (!ok) return { available: false, auth: null, db: null };
  try {
    if (!window.firebase.apps.length) window.firebase.initializeApp(cfg);
    return { available: true, auth: window.firebase.auth(), db: window.firebase.firestore() };
  } catch (e) { return { available: false, auth: null, db: null }; }
}

async function loadCol(name, seeds, svc, useFB) {
  if (useFB && svc.db) {
    try {
      const snap = await svc.db.collection(name).get();
      if (snap.empty) {
        await Promise.all(seeds.map(s => svc.db.collection(name).doc(s.id).set(sanitize(s))));
        writeLocal(STORAGE_KEYS[name], seeds);
        return seeds;
      }
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      writeLocal(STORAGE_KEYS[name], rows);
      return rows;
    } catch {}
  }
  const loc = readLocal(STORAGE_KEYS[name]);
  if (loc && Array.isArray(loc) && loc.length) return loc;
  writeLocal(STORAGE_KEYS[name], seeds);
  return seeds;
}

// ─── Design Tokens (Cream/Beige Apple-style) ──────────────────────────────────
// Primary: #1A1A1A (almost black)
// Accent:  #C9A96E (warm gold/caramel)
// Bg:      #FAF8F5 (warm cream)
// Surface: #FFFFFF
// Border:  #E8E2D9 (warm beige border)

// ─── UI Primitives ─────────────────────────────────────────────────────────────

function Btn({ children, variant = "primary", className, ...props }) {
  const base = "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-150 px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary:   "bg-[#1A1A1A] text-white hover:bg-[#2d2d2d] active:scale-95",
    secondary: "bg-white text-[#1A1A1A] border border-[#E8E2D9] hover:bg-[#FAF8F5] active:scale-95",
    ghost:     "text-[#666] hover:text-[#1A1A1A] hover:bg-[#F0EDE8]",
    danger:    "bg-red-600 text-white hover:bg-red-700 active:scale-95",
    gold:      "bg-[#C9A96E] text-white hover:bg-[#b8965d] active:scale-95"
  };
  return <button className={cn(base, styles[variant], className)} {...props}>{children}</button>;
}

function Badge({ label, tone }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tone)}>{label}</span>;
}

function Card({ children, className, ...props }) {
  return <div className={cn("bg-white rounded-2xl border border-[#E8E2D9] shadow-sm", className)} {...props}>{children}</div>;
}

function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block mb-1.5 text-sm font-medium text-[#3d3d3d]">{label}</label>}
      <input className="w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-[#AAA] focus:outline-none focus:border-[#C9A96E] focus:ring-1 focus:ring-[#C9A96E]" {...props} />
    </div>
  );
}

// ─── Nav Icons ─────────────────────────────────────────────────────────────────

function NavIcon({ route, active }) {
  const c = active ? "#1A1A1A" : "#9CA3AF";
  const icons = {
    dashboard: <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5"><rect x="3" y="3" width="8" height="8" rx="2" stroke={c} strokeWidth="1.8"/><rect x="13" y="3" width="8" height="12" rx="2" stroke={c} strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="2" stroke={c} strokeWidth="1.8"/></svg>,
    orders:    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke={c} strokeWidth="1.8"/><path d="M9 12h6M9 16h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
    farmers:   <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
    credits:   <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5"><path d="M3 10h18M7 15h2m4 0h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><rect x="3" y="6" width="18" height="14" rx="3" stroke={c} strokeWidth="1.8"/></svg>,
    delivery:  <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><rect x="9" y="11" width="14" height="10" rx="2" stroke={c} strokeWidth="1.8"/><circle cx="12" cy="21" r="1" stroke={c} strokeWidth="1.8"/><circle cx="20" cy="21" r="1" stroke={c} strokeWidth="1.8"/></svg>,
    fleet:     <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5"><circle cx="12" cy="10" r="3" stroke={c} strokeWidth="1.8"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={c} strokeWidth="1.8"/></svg>,
    crates:    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5"><rect x="2" y="7" width="20" height="14" rx="2" stroke={c} strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M12 12v4M10 14h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>
  };
  return icons[route] || null;
}

// ─── Landing Page ──────────────────────────────────────────────────────────────

function LandingPage({ onNavigate }) {
  const prev = buildSeedOrders().slice(0, 4);
  const pFarmers = buildSeedFarmers().slice(0, 6);
  const pCredit  = creditLedger(buildSeedOrders());
  const metrics  = {
    orders: buildSeedOrders().filter(o => isToday(o.createdAt)).length,
    credit: pCredit.reduce((s, e) => s + e.amount, 0),
    milk:   pFarmers.reduce((s, f) => s + farmerSummary(f).todayLitres, 0)
  };

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
            <Btn variant="primary"   onClick={() => onNavigate("login")}>Sign In →</Btn>
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
              <Btn variant="primary" className="px-8 py-3 text-base" onClick={() => onNavigate("login")}>
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
                {prev.map(o => (
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
          <Btn variant="gold" className="px-10 py-3 text-base" onClick={() => onNavigate("login")}>Open demo →</Btn>
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

// ─── Login Page ─────────────────────────────────────────────────────────────────

function LoginPage({ onLogin, onNavigate, firebaseReady }) {
  const [form, setForm]       = useState({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await onLogin(form.email, form.password);
    setLoading(false);
    if (!res.ok) setError(res.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#FAF8F5" }}>
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left panel */}
        <div className="rounded-3xl bg-[#1A1A1A] p-8 text-white">
          <button className="text-white/50 text-sm hover:text-white mb-8 flex items-center gap-1" onClick={() => onNavigate("landing")}>← Back</button>
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

function AppShell({ route, onRouteChange, currentUser, syncModeLabel, banner, onLogout, children }) {
  const meta = ROUTE_META[route];
  return (
    <div className="min-h-screen" style={{ background: "#FAF8F5" }}>

      {/* Sidebar — desktop */}
      <aside className="no-print hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r lg:border-[#E8E2D9]">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E8E2D9]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1A1A]">
            <span className="text-[10px] font-black text-white">DXI</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A] leading-none">DXI</p>
            <p className="text-[11px] text-[#999] mt-0.5">Dairy Intelligence</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = item.route === route;
            return (
              <button key={item.route}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                  active ? "bg-[#1A1A1A] text-white" : "text-[#666] hover:bg-[#F0EDE8] hover:text-[#1A1A1A]")}
                onClick={() => onRouteChange(item.route)}>
                <NavIcon route={item.route} active={active} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#E8E2D9]">
          <div className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] p-3 mb-3">
            <p className="text-[11px] text-[#999] mb-0.5">{syncModeLabel}</p>
            <p className="text-xs font-semibold text-[#1A1A1A] truncate">{currentUser.email}</p>
          </div>
          <Btn variant="secondary" className="w-full text-xs" onClick={onLogout}>Sign out</Btn>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 bg-white/90 border-b border-[#E8E2D9] backdrop-blur-md px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A96E]">{meta.title}</p>
              <p className="text-sm text-[#999] mt-0.5">{meta.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={syncModeLabel} tone="bg-[#F0EDE8] text-[#8B7355]" />
              <Btn variant="ghost" className="text-xs hidden sm:flex" onClick={onLogout}>Sign out</Btn>
            </div>
          </div>
          {banner && <div className="max-w-7xl mx-auto mt-3 rounded-xl bg-[#F0EDE8] border border-[#C9A96E]/30 px-4 py-2.5 text-sm font-medium text-[#8B7355]">{banner}</div>}
        </header>

        <main className="print-page max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E2D9] px-2 py-2 lg:hidden">
        <div className="grid grid-cols-7 gap-1">
          {NAV_ITEMS.map(item => {
            const active = item.route === route;
            return (
              <button key={item.route}
                className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-all",
                  active ? "bg-[#1A1A1A] text-white" : "text-[#999]")}
                onClick={() => onRouteChange(item.route)}>
                <NavIcon route={item.route} active={active} />
                <span>{item.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────

function MetricCard({ title, value, subtitle, tone }) {
  const tones = {
    brand:   "bg-[#1A1A1A] text-white",
    red:     "bg-red-50 text-red-600",
    green:   "bg-emerald-50 text-emerald-700",
    gold:    "bg-[#C9A96E]/10 text-[#8B7355]",
    neutral: "bg-white border border-[#E8E2D9] text-[#1A1A1A]"
  };
  return (
    <div className={cn("rounded-2xl p-5", tones[tone] || tones.neutral)}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">{title}</p>
      <p className="text-3xl font-black mb-1">{value}</p>
      <p className="text-xs opacity-60">{subtitle}</p>
    </div>
  );
}

function DashboardPage({
  orders = [],
  farmers = [],
  credit = []
}) {
  const recent      = sortByLatest(orders).slice(0, 5);
  const sums        = farmers.map(f => farmerSummary(f));
  const todayOrders = orders.filter(o => isToday(o.createdAt));
  const delivered   = todayOrders.filter(o => o.deliveryStatus === "Delivered").length;
  const totalMilk   = sumBy(sums, s => s.todayLitres);
  const totalCredit = sumBy(credit, e => e.amount);
  const todayRev    = sumBy(todayOrders.filter(o => o.paymentStatus !== "Credit"), o => o.amount);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Today's orders"   value={todayOrders.length}      subtitle={`${delivered} delivered`}          tone="brand"   />
        <MetricCard title="Milk collected"   value={formatLitres(totalMilk)} subtitle={`${farmers.length} farmers`}       tone="neutral" />
        <MetricCard title="Credit pending"   value={formatCompact(totalCredit)} subtitle={`${credit.length} customers`}   tone="red"     />
        <MetricCard title="Today's revenue"  value={formatCurrency(todayRev)} subtitle="Paid + advance"                   tone="green"   />
      </div>

      <div className="grid xl:grid-cols-[1.6fr_1fr] gap-6">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-base font-bold text-[#1A1A1A]">Recent Orders</p>
              <p className="text-xs text-[#999] mt-0.5">Last 5 orders</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-[#BBB]">
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Items</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Payment</th>
                  <th className="pb-3">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(o => (
                  <tr key={o.id} className="border-t border-[#F0EDE8] text-sm">
                    <td className="py-3.5 pr-4"><p className="font-semibold text-[#1A1A1A]">{o.customerName}</p><p className="text-xs text-[#999]">{o.phone}</p></td>
                    <td className="py-3.5 pr-4 text-[#555] text-xs">{fmtItems(o.items)}</td>
                    <td className="py-3.5 pr-4 font-semibold text-[#1A1A1A]">{formatCurrency(o.amount)}</td>
                    <td className="py-3.5 pr-4"><Badge label={o.paymentStatus} tone={PAYMENT_STYLES[o.paymentStatus]} /></td>
                    <td className="py-3.5"><Badge label={o.deliveryStatus} tone={DELIVERY_STYLES[o.deliveryStatus]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-base font-bold text-[#1A1A1A] mb-4">Today's Pulse</p>
            <div className="space-y-3">
              <div className="rounded-xl bg-[#FAF8F5] p-4">
                <p className="text-xs text-[#999]">Delivery on track</p>
                <p className="text-2xl font-black text-[#1A1A1A] mt-1">{delivered} orders</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Overdue follow-up</p>
                <p className="text-2xl font-black text-amber-700 mt-1">{credit.filter(e => e.daysOutstanding > 30).length} customers</p>
              </div>
              <div className="rounded-xl bg-[#1A1A1A] p-4 text-white">
                <p className="text-xs text-white/40">Farmer payouts (month)</p>
                <p className="text-2xl font-black mt-1">{formatCompact(sumBy(farmers, f => farmerSummary(f).totalPayment))}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Orders ─────────────────────────────────────────────────────────────────────

function OrderModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ customerName: "", phone: "", area: "", paymentStatus: "Paid", notes: "", quantities: { milk: "", paneer: "", dahi: "", lassi: "" } });
  const [error, setError] = useState("");
  const total = orderAmount(form.quantities);

  function toggle(key) {
    setForm(f => ({ ...f, quantities: { ...f.quantities, [key]: f.quantities[key] ? "" : "1" } }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.customerName.trim()) { setError("Please enter customer name."); return; }
    if (!orderItems(form.quantities).length) { setError("Please select at least one item."); return; }
    setError(""); await onSubmit(form); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-3 sm:p-6">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A96E]">New Order</p>
            <h3 className="text-xl font-black text-[#1A1A1A] mt-0.5">Add customer order</h3>
          </div>
          <Btn variant="ghost" onClick={onClose}>✕</Btn>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Customer name" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Birsa Oraon" />
            <Input label="Phone number"  value={form.phone}        onChange={e => setForm({ ...form, phone: e.target.value })}        placeholder="94311xxxxx" />
          </div>
          <Input label="Area / address" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Area or landmark" />

          <div>
            <label className="block mb-2 text-sm font-medium text-[#3d3d3d]">Items</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {PRODUCT_CATALOG.map(p => {
                const checked = !!form.quantities[p.key];
                return (
                  <div key={p.key} className={cn("rounded-2xl border p-4 transition-all", checked ? "border-[#C9A96E] bg-[#C9A96E]/5" : "border-[#E8E2D9] bg-[#FAF8F5]")}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={() => toggle(p.key)} className="rounded border-[#E8E2D9] text-[#C9A96E] focus:ring-[#C9A96E]" />
                        {p.label} ({p.unit})
                      </label>
                      <span className="text-xs text-[#999]">{formatCurrency(p.rate)}/{p.unit}</span>
                    </div>
                    <input type="number" min="0" step="0.1" disabled={!checked} value={form.quantities[p.key]}
                      onChange={e => setForm({ ...form, quantities: { ...form.quantities, [p.key]: e.target.value } })}
                      className="w-full rounded-xl border border-[#E8E2D9] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#C9A96E] disabled:opacity-40"
                      placeholder={`Qty in ${p.unit}`} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[#3d3d3d]">Payment</label>
              <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}
                className="w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E]">
                <option>Paid</option><option>Credit</option><option>Advance</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[#3d3d3d]">Notes</label>
              <textarea rows="2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#C9A96E]"
                placeholder="Special instructions" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#1A1A1A] px-5 py-4 flex items-center justify-between">
            <p className="text-sm text-white/50">Total amount</p>
            <p className="text-2xl font-black text-white">{formatCurrency(total)}</p>
          </div>

          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" type="button" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary"   type="submit">Save order →</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrdersPage({ orders, onAddOrder, onCycleDelivery, onMarkOrderPaid, onSendReminder }) {
  const [tab, setTab]     = useState("All");
  const [modal, setModal] = useState(false);

  const filtered = sortByLatest(orders).filter(o => {
    if (tab === "All") return true;
    if (tab === "Pending") return o.deliveryStatus !== "Delivered";
    return o.paymentStatus === tab;
  });

  function cycleStatus(s) {
    const seq = ["Pending","Out for delivery","Delivered"];
    return seq[(seq.indexOf(s) + 1) % seq.length];
  }

  return (
    <div className="space-y-5">
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-base font-bold text-[#1A1A1A]">Order Desk</p>
          <p className="text-xs text-[#999] mt-0.5">Filter by payment or delivery status</p>
        </div>
        <Btn variant="primary" onClick={() => setModal(true)}>+ New Order</Btn>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap gap-2 mb-5">
          {["All","Paid","Credit","Pending"].map(t => (
            <button key={t}
              className={cn("rounded-xl px-4 py-2 text-sm font-semibold transition-all", tab === t ? "bg-[#1A1A1A] text-white" : "bg-[#FAF8F5] text-[#666] hover:bg-[#F0EDE8]")}
              onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[#BBB]">
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Items</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Payment</th>
                <th className="pb-3 pr-4">Delivery</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-t border-[#F0EDE8] text-sm">
                  <td className="py-4 pr-4"><p className="font-semibold text-[#1A1A1A]">{o.customerName}</p><p className="text-xs text-[#999]">{o.area}</p></td>
                  <td className="py-4 pr-4 text-xs text-[#555]">{fmtItems(o.items)}</td>
                  <td className="py-4 pr-4 font-semibold">{formatCurrency(o.amount)}</td>
                  <td className="py-4 pr-4"><Badge label={o.paymentStatus} tone={PAYMENT_STYLES[o.paymentStatus]} /></td>
                  <td className="py-4 pr-4"><Badge label={o.deliveryStatus} tone={DELIVERY_STYLES[o.deliveryStatus]} /></td>
                  <td className="py-4">
                    <div className="flex gap-2 flex-wrap">
                      <button className="text-xs font-semibold text-[#C9A96E] hover:underline" onClick={() => onCycleDelivery(o.id, cycleStatus(o.deliveryStatus))}>Cycle status</button>
                      {o.paymentStatus === "Credit" && <button className="text-xs font-semibold text-emerald-600 hover:underline" onClick={() => onMarkOrderPaid(o.id)}>Mark paid</button>}
                      <button className="text-xs font-semibold text-blue-600 hover:underline" onClick={() => onSendReminder(o)}>WhatsApp</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-3 lg:hidden">
          {filtered.map(o => (
            <div key={o.id} className="rounded-2xl border border-[#E8E2D9] p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div><p className="font-semibold text-[#1A1A1A]">{o.customerName}</p><p className="text-xs text-[#999]">{o.area}</p></div>
                <p className="font-bold text-[#1A1A1A]">{formatCurrency(o.amount)}</p>
              </div>
              <p className="text-xs text-[#666] mb-3">{fmtItems(o.items)}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge label={o.paymentStatus} tone={PAYMENT_STYLES[o.paymentStatus]} />
                <Badge label={o.deliveryStatus} tone={DELIVERY_STYLES[o.deliveryStatus]} />
              </div>
              <div className="flex gap-3 text-xs font-semibold">
                <button className="text-[#C9A96E]" onClick={() => onCycleDelivery(o.id, cycleStatus(o.deliveryStatus))}>Cycle status</button>
                {o.paymentStatus === "Credit" && <button className="text-emerald-600" onClick={() => onMarkOrderPaid(o.id)}>Mark paid</button>}
                <button className="text-blue-600" onClick={() => onSendReminder(o)}>WhatsApp</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {modal && <OrderModal onClose={() => setModal(false)} onSubmit={onAddOrder} />}
    </div>
  );
}

// ─── Farmers ────────────────────────────────────────────────────────────────────

function FarmerForm({ onAddFarmer }) {
  const [form, setForm]   = useState({ name: "", phone: "", village: "", morningLitres: "", eveningLitres: "", fat: "4.2" });
  const [error, setError] = useState("");
  const total = toNum(form.morningLitres) + toNum(form.eveningLitres);
  const pay   = Math.round(total * toNum(form.fat) * 50);

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Please enter farmer name."); return; }
    setError(""); const f = await onAddFarmer(form);
    if (f) setForm({ name: "", phone: "", village: "", morningLitres: "", eveningLitres: "", fat: "4.2" });
  }

  return (
    <Card className="p-5">
      <p className="text-base font-bold text-[#1A1A1A] mb-4">Add Farmer</p>
      <form className="space-y-4" onSubmit={submit}>
        <Input label="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sunita Kisku" />
        <Input label="Phone"     value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="94311xxxxx" />
        <Input label="Village"   value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} placeholder="Khunti" />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Morning L" type="number" min="0" step="0.1" value={form.morningLitres} onChange={e => setForm({ ...form, morningLitres: e.target.value })} />
          <Input label="Evening L" type="number" min="0" step="0.1" value={form.eveningLitres} onChange={e => setForm({ ...form, eveningLitres: e.target.value })} />
          <Input label="Fat %"     type="number" min="0" step="0.1" value={form.fat}           onChange={e => setForm({ ...form, fat: e.target.value })} />
        </div>
        <div className="rounded-xl bg-[#1A1A1A] px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-white/40">Auto payment = Litres × Fat × 50</p>
          <p className="text-lg font-black text-white">{formatCurrency(pay)}</p>
        </div>
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{error}</div>}
        <Btn variant="primary" className="w-full" type="submit">Save farmer →</Btn>
      </form>
    </Card>
  );
}

function FarmersPage({ farmers, onAddFarmer }) {
  const sums = farmers.map(f => ({ ...f, summary: farmerSummary(f) }));
  const [sel, setSel] = useState(sums[0] ? sums[0].id : "");
  useEffect(() => { if (!sel && sums[0]) setSel(sums[0].id); }, [sel, sums]);
  const selected = sums.find(f => f.id === sel) || sums[0] || null;
  const monthL = sumBy(sums, f => f.summary.totalLitres);
  const monthP = sumBy(sums, f => f.summary.totalPayment);

  async function handleAdd(form) {
    const f = await onAddFarmer(form);
    if (f) setSel(f.id);
    return f;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <div className="space-y-5">
        <FarmerForm onAddFarmer={handleAdd} />
        <Card className="p-5">
          <p className="text-base font-bold text-[#1A1A1A] mb-4">Collection Overview</p>
          <div className="space-y-3">
            <div className="rounded-xl bg-[#1A1A1A] p-4 text-white"><p className="text-xs text-white/40 mb-1">Total farmers</p><p className="text-2xl font-black">{farmers.length}</p></div>
            <div className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] p-4"><p className="text-xs text-[#999] mb-1">This month's milk</p><p className="text-2xl font-black text-[#1A1A1A]">{formatLitres(monthL)}</p></div>
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-600 mb-1">Estimated payout</p><p className="text-2xl font-black text-emerald-700">{formatCompact(monthP)}</p></div>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-base font-bold text-[#1A1A1A]">Farmer List</p>
            <Badge label={`${farmers.length} farmers`} tone="bg-[#F0EDE8] text-[#8B7355]" />
          </div>
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
              {sums.map(f => (
                <button key={f.id}
                  className={cn("w-full rounded-2xl border p-4 text-left transition-all", f.id === sel ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#E8E2D9] bg-white hover:border-[#C9A96E]/50")}
                  onClick={() => setSel(f.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div><p className={cn("font-semibold text-sm", f.id === sel ? "text-white" : "text-[#1A1A1A]")}>{f.name}</p><p className={cn("text-xs mt-0.5", f.id === sel ? "text-white/50" : "text-[#999]")}>{f.village}</p></div>
                    <Badge label={formatLitres(f.summary.todayLitres)} tone={f.id === sel ? "bg-white/10 text-white" : "bg-[#F0EDE8] text-[#8B7355]"} />
                  </div>
                  <p className={cn("text-xs mt-2", f.id === sel ? "text-white/50" : "text-[#999]")}>Month payout {formatCompact(f.summary.totalPayment)}</p>
                </button>
              ))}
            </div>

            {selected && (
              <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-5">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div><p className="text-xl font-black text-[#1A1A1A]">{selected.name}</p><p className="text-xs text-[#999] mt-0.5">{selected.village} · {selected.phone}</p></div>
                  <Badge label="Monthly" tone="bg-[#C9A96E]/10 text-[#8B7355]" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl bg-white border border-[#E8E2D9] p-3 text-center"><p className="text-xs text-[#999] mb-1">Milk</p><p className="text-lg font-black text-[#1A1A1A]">{formatLitres(selected.summary.totalLitres)}</p></div>
                  <div className="rounded-xl bg-white border border-[#E8E2D9] p-3 text-center"><p className="text-xs text-[#999] mb-1">Avg fat</p><p className="text-lg font-black text-[#1A1A1A]">{selected.summary.averageFat.toFixed(1)}%</p></div>
                  <div className="rounded-xl bg-white border border-[#E8E2D9] p-3 text-center"><p className="text-xs text-[#999] mb-1">Payout</p><p className="text-lg font-black text-[#1A1A1A]">{formatCompact(selected.summary.totalPayment)}</p></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead><tr className="text-[10px] uppercase tracking-widest text-[#BBB]"><th className="pb-2 pr-3">Date</th><th className="pb-2 pr-3">Morning</th><th className="pb-2 pr-3">Evening</th><th className="pb-2 pr-3">Fat</th><th className="pb-2">Pay</th></tr></thead>
                    <tbody>
                      {[...selected.summary.entries].reverse().slice(0, 7).map(e => (
                        <tr key={e.date} className="border-t border-[#E8E2D9]">
                          <td className="py-2.5 pr-3 font-semibold">{formatDate(e.date)}</td>
                          <td className="py-2.5 pr-3 text-[#666]">{formatLitres(e.morningLitres)}</td>
                          <td className="py-2.5 pr-3 text-[#666]">{formatLitres(e.eveningLitres)}</td>
                          <td className="py-2.5 pr-3 text-[#666]">{e.fat.toFixed(1)}%</td>
                          <td className="py-2.5 font-semibold text-[#1A1A1A]">{formatCurrency(e.payment)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Credit Tracker ─────────────────────────────────────────────────────────────

function CreditTrackerPage({ creditLedger: cl, onSendReminder }) {
  const total    = sumBy(cl, e => e.amount);
  const overdue  = cl.filter(e => e.daysOutstanding > 30).length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Credit Tracker</p>
        <p className="text-4xl font-black text-red-600">{formatCurrency(total)}</p>
        <p className="text-sm text-red-500 mt-2">{overdue} accounts overdue by 30+ days · {cl.length} total open</p>
      </div>

      <Card className="p-5">
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full text-left">
            <thead><tr className="text-[10px] uppercase tracking-widest text-[#BBB]">
              <th className="pb-3 pr-4">Customer</th><th className="pb-3 pr-4">Phone</th>
              <th className="pb-3 pr-4">Amount Due</th><th className="pb-3 pr-4">Overdue</th>
              <th className="pb-3 pr-4">Last Order</th><th className="pb-3">Action</th>
            </tr></thead>
            <tbody>
              {cl.map(e => (
                <tr key={e.id} className={cn("border-t border-[#F0EDE8] text-sm", e.daysOutstanding > 30 ? "bg-red-50/60" : "")}>
                  <td className="py-4 pr-4 font-semibold text-[#1A1A1A]">{e.name}</td>
                  <td className="py-4 pr-4 text-[#666]">{e.phone}</td>
                  <td className="py-4 pr-4 font-bold text-[#1A1A1A]">{formatCurrency(e.amount)}</td>
                  <td className="py-4 pr-4"><Badge label={`${e.daysOutstanding} days`} tone={e.daysOutstanding > 30 ? "bg-red-100 text-red-700" : "bg-[#F0EDE8] text-[#8B7355]"} /></td>
                  <td className="py-4 pr-4 text-[#666]">{formatDateFull(e.lastOrder)}</td>
                  <td className="py-4"><button className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F0EDE8]" onClick={() => onSendReminder(e)}>WhatsApp reminder</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 lg:hidden">
          {cl.map(e => (
            <div key={e.id} className={cn("rounded-2xl border p-4", e.daysOutstanding > 30 ? "border-red-200 bg-red-50" : "border-[#E8E2D9]")}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div><p className="font-semibold text-[#1A1A1A]">{e.name}</p><p className="text-xs text-[#999]">{e.phone}</p></div>
                <p className="font-black text-[#1A1A1A]">{formatCurrency(e.amount)}</p>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge label={`${e.daysOutstanding} days`} tone={e.daysOutstanding > 30 ? "bg-red-100 text-red-700" : "bg-[#F0EDE8] text-[#8B7355]"} />
                <span className="text-xs text-[#999]">Last: {formatDate(e.lastOrder)}</span>
              </div>
              <button className="rounded-xl bg-white border border-[#E8E2D9] px-3 py-1.5 text-xs font-semibold text-[#1A1A1A]" onClick={() => onSendReminder(e)}>WhatsApp reminder</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Delivery ───────────────────────────────────────────────────────────────────

function StatusButtons({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {["Pending","Out for delivery","Delivered"].map(s => (
        <button key={s}
          className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            value === s ? "bg-[#1A1A1A] text-white" : "bg-[#FAF8F5] border border-[#E8E2D9] text-[#666] hover:bg-[#F0EDE8]")}
          onClick={() => onChange(s)}>{s}</button>
      ))}
    </div>
  );
}

function DeliveryPage({ todaysOrders = [], onChangeStatus }) {
  const delivered = todaysOrders.filter(o => o.deliveryStatus === "Delivered").length;
  const pending   = todaysOrders.filter(o => o.deliveryStatus === "Pending").length;

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-base font-bold text-[#1A1A1A]">Today's Delivery List</p>
            <p className="text-xs text-[#999] mt-0.5">Print-ready route sheet for milkman</p>
          </div>
          <Btn variant="primary" className="no-print" onClick={() => window.print()}>🖨 Print list</Btn>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] p-4"><p className="text-xs text-[#999] mb-1">Total stops</p><p className="text-2xl font-black text-[#1A1A1A]">{todaysOrders.length}</p></div>
          <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-600 mb-1">Delivered</p><p className="text-2xl font-black text-emerald-700">{delivered}</p></div>
          <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs text-amber-600 mb-1">Pending</p><p className="text-2xl font-black text-amber-700">{pending}</p></div>
        </div>
      </Card>

      <Card className="print-shell p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A96E]">DXI Delivery Sheet</p>
            <p className="text-xl font-black text-[#1A1A1A] mt-1">{formatDateFull(new Date().toISOString())}</p>
          </div>
          <div className="text-right text-xs text-[#999]"><p>Milkman copy</p><p className="mt-0.5">Live status updates</p></div>
        </div>

        <div className="hidden xl:block overflow-x-auto">
          <table className="print-table min-w-full text-left">
            <thead><tr className="text-[10px] uppercase tracking-widest text-[#BBB]">
              <th className="pb-3 pr-4">#</th><th className="pb-3 pr-4">Customer</th>
              <th className="pb-3 pr-4">Address</th><th className="pb-3 pr-4">Items</th>
              <th className="pb-3 pr-4">Amount</th><th className="pb-3">Status</th>
            </tr></thead>
            <tbody>
              {todaysOrders.map((o, i) => (
                <tr key={o.id} className="border-t border-[#F0EDE8] text-sm">
                  <td className="py-4 pr-4 font-black text-[#C9A96E]">{i+1}</td>
                  <td className="py-4 pr-4"><p className="font-semibold text-[#1A1A1A]">{o.customerName}</p><p className="text-xs text-[#999]">{o.phone}</p></td>
                  <td className="py-4 pr-4 text-[#666]">{o.area}</td>
                  <td className="py-4 pr-4 text-xs text-[#666]">{fmtItems(o.items)}</td>
                  <td className="py-4 pr-4 font-semibold">{formatCurrency(o.amount)}</td>
                  <td className="py-4"><StatusButtons value={o.deliveryStatus} onChange={s => onChangeStatus(o.id, s)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 xl:hidden">
          {todaysOrders.map((o, i) => (
            <div key={o.id} className="rounded-2xl border border-[#E8E2D9] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div><span className="text-[#C9A96E] font-black text-sm">#{i+1} </span><span className="font-semibold text-[#1A1A1A]">{o.customerName}</span><p className="text-xs text-[#999] mt-0.5">{o.area}</p></div>
                <p className="font-bold text-[#1A1A1A]">{formatCurrency(o.amount)}</p>
              </div>
              <p className="text-xs text-[#666] mb-3">{fmtItems(o.items)}</p>
              <StatusButtons value={o.deliveryStatus} onChange={s => onChangeStatus(o.id, s)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── App Root ───────────────────────────────────────────────────────────────────


// ─── Milkman Login Page ─────────────────────────────────────────────────────────

function MilkmanLoginPage({ onLogin }) {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await onLogin(form.email, form.password);
    setLoading(false);
    if (!res.ok) setError(res.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#1A1A1A" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9A96E] mb-4">
            <span className="text-lg font-black text-white">DXI</span>
          </div>
          <h1 className="text-2xl font-black text-white">Milkman Login</h1>
          <p className="text-white/40 text-sm mt-1">DXI Delivery Portal</p>
        </div>
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/50 uppercase tracking-widest">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A96E] text-sm"
                placeholder="milkman1@dxi.in" />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/50 uppercase tracking-widest">Password</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A96E] text-sm"
                placeholder="milkman123" />
            </div>
            {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#C9A96E] py-3 text-sm font-bold text-white disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>
          <div className="mt-4 rounded-xl bg-white/5 p-3">
            <p className="text-xs text-white/30 mb-1">Demo credentials:</p>
            <p className="text-xs text-white/50">milkman1@dxi.in / milkman123</p>
          </div>
        </div>
        <p className="text-center mt-4 text-xs text-white/20">
          Owner? <button className="text-[#C9A96E]" onClick={() => { window.location.hash = "#/login"; }}>Owner login →</button>
        </p>
      </div>
    </div>
  );
}

// ─── WhatsApp OTP Helper ─────────────────────────────────────────────────────

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendWhatsAppOTP(toPhone, otp, customerName, crateId, action) {
  const cfg = window.DXI_WHATSAPP_CONFIG || {};

  // TEST MODE — just return the OTP without calling API
  if (!cfg.token || cfg.token === "YOUR_META_WHATSAPP_TOKEN" || cfg.testMode) {
    console.log(`[TEST MODE] OTP for ${toPhone}: ${otp}`);
    return { success: true, testMode: true };
  }

  const body = {
    messaging_product: "whatsapp",
    to: `91${toPhone.replace(/\D/g, "").slice(-10)}`,
    type: "text",
    text: {
      body: `DXI Dairy\n\nYour crate ${action === "delivery" ? "delivery" : "return"} OTP:\n\n*${otp}*\n\nCrate: ${crateId}\nValid for 5 minutes.\n\nDo not share this OTP.`
    }
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${cfg.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err?.error?.message || "API error" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── QR Scanner Component (camera) ──────────────────────────────────────────

function QRScanner({ onScan, onClose }) {
  const videoRef    = React.useRef(null);
  const canvasRef   = React.useRef(null);
  const streamRef   = React.useRef(null);
  const rafRef      = React.useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (e) {
        setError("Camera access denied. Please allow camera permission and retry.");
      }
    }

    function tick() {
      if (!active || !scanning) return;
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) { rafRef.current = requestAnimationFrame(tick); return; }
      const ctx = canvas.getContext("2d");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
        if (code && code.data) {
          setScanning(false);
          stopCamera();
          onScan(code.data);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    function stopCamera() {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <p className="text-sm font-bold text-white">Scan Crate QR Code</p>
        <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none px-2">×</button>
      </div>
      <div className="flex-1 relative flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {/* Scan frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#C9A96E] rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#C9A96E] rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#C9A96E] rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#C9A96E] rounded-br-xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-[#C9A96E]/60 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center">
          {error
            ? <p className="text-red-400 text-sm font-semibold px-4">{error}</p>
            : <p className="text-white/60 text-xs">Point camera at the crate QR code</p>
          }
        </div>
      </div>
    </div>
  );
}

// ─── OTP Verification Modal ──────────────────────────────────────────────────

function OTPModal({ crateId, customerName, customerPhone, action, milkmanName, onVerified, onCancel }) {
  const [otp]        = useState(generateOTP);
  const [input, setInput]   = useState("");
  const [sent, setSent]     = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState("");
  const [testOtp, setTestOtp] = useState("");
  const cfg = window.DXI_WHATSAPP_CONFIG || {};
  const isTest = !cfg.token || cfg.token === "YOUR_META_WHATSAPP_TOKEN" || cfg.testMode;

  // Auto-send OTP when modal opens
  useEffect(() => { handleSend(); }, []);

  async function handleSend() {
    setSending(true); setError("");
    const res = await sendWhatsAppOTP(customerPhone, otp, customerName, crateId, action);
    setSending(false);
    if (res.success) {
      setSent(true);
      if (res.testMode) setTestOtp(otp); // show on screen in test mode
    } else {
      setError(res.error || "Failed to send OTP");
      // Still show test OTP so dev can proceed
      setSent(true); setTestOtp(otp);
    }
  }

  function verify() {
    if (input.trim() === otp) {
      onVerified();
    } else {
      setError("Wrong OTP. Try again.");
      setInput("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full sm:max-w-sm bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="font-bold text-white text-base">OTP Verification</p>
          <button onClick={onCancel} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-1">
          <p className="text-xs text-white/40">Crate</p>
          <p className="font-mono font-bold text-[#C9A96E]">{crateId}</p>
          <p className="text-xs text-white/40 mt-2">{action === "delivery" ? "Delivering to" : "Returning from"}</p>
          <p className="font-semibold text-white">{customerName}</p>
          <p className="text-xs text-white/40">{customerPhone}</p>
        </div>

        {sending && (
          <div className="text-center py-2">
            <p className="text-sm text-white/60 animate-pulse">Sending OTP via WhatsApp…</p>
          </div>
        )}

        {sent && (
          <>
            {isTest && testOtp && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-center">
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">Test Mode — OTP</p>
                <p className="text-4xl font-black text-amber-400 tracking-widest">{testOtp}</p>
                <p className="text-xs text-amber-400/60 mt-1">Set testMode: false in firebase-config.js for production</p>
              </div>
            )}
            {!isTest && <p className="text-xs text-white/50 text-center">OTP sent to shopkeeper's WhatsApp ({customerPhone})</p>}

            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Enter OTP from shopkeeper</p>
              <input
                type="number"
                maxLength={6}
                placeholder="6-digit OTP"
                value={input}
                onChange={e => { setInput(e.target.value.slice(0,6)); setError(""); }}
                className="w-full rounded-2xl bg-white/10 border border-white/10 px-5 py-4 text-white text-2xl font-black tracking-widest text-center focus:outline-none focus:border-[#C9A96E]"
                autoFocus
              />
              {error && <p className="text-sm text-red-400 font-semibold text-center">{error}</p>}
              <button
                onClick={verify}
                disabled={input.length < 6}
                className="w-full rounded-2xl bg-[#C9A96E] py-4 text-base font-black text-white disabled:opacity-40">
                {action === "delivery" ? "✓ Confirm Delivery" : "✓ Confirm Return"}
              </button>
              <button onClick={handleSend} className="w-full text-xs text-white/30 hover:text-white/60 py-2">Resend OTP</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Crate Scan Flow (inside Milkman Portal) ─────────────────────────────────

function CrateScanFlow({ milkman, crates, onCrateIssue, onCrateReturn, onClose }) {
  // action = "delivery" | "return" | null
  const [action, setAction]     = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned]   = useState(null);   // crate object
  const [scanError, setScanError] = useState("");
  const [otpFlow, setOtpFlow]   = useState(false);
  const [done, setDone]         = useState(false);
  const [manualId, setManualId] = useState("");

  function handleScan(rawData) {
    const crateId = rawData.trim();
    const crate = crates.find(c => c.crateId === crateId);
    if (!crate) { setScanError(`Crate "${crateId}" not found in system.`); return; }

    if (action === "delivery") {
      if (crate.status === "DELIVERED" || crate.status === "OUT") {
        // Already issued — just need OTP for delivery confirmation
        setScanned(crate); setScanError("");
      } else if (crate.status === "AVAILABLE" || crate.status === "RETURNED") {
        setScanned(crate); setScanError("");
      } else {
        setScanError(`Crate is ${crate.status} — cannot deliver.`); return;
      }
    } else {
      if (crate.status !== "OUT") { setScanError(`Crate is ${crate.status} — not currently out.`); return; }
      setScanned(crate); setScanError("");
    }
  }

  function handleManualLookup() {
    handleScan(manualId.trim());
  }

  function startOTP() {
    if (!scanned) return;
    setOtpFlow(true);
  }

  function handleVerified() {
    if (action === "delivery") {
      onCrateIssue(scanned.id, scanned.customerName || "Customer", milkman.name);
    } else {
      onCrateReturn(scanned.id);
    }
    setOtpFlow(false);
    setDone(true);
  }

  // Step 1 — choose action
  if (!action) return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center p-6 gap-5" style={{ background: "#1A1A1A" }}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white text-2xl px-2">×</button>
      <div className="h-16 w-16 rounded-2xl bg-[#C9A96E] flex items-center justify-center mb-2">
        <span className="text-3xl">📦</span>
      </div>
      <p className="text-2xl font-black text-white text-center">Crate Scanner</p>
      <p className="text-sm text-white/40 text-center">What are you doing?</p>
      <button onClick={() => setAction("delivery")}
        className="w-full max-w-xs rounded-2xl bg-[#C9A96E] py-5 text-lg font-black text-white">
        🚚 Delivering Crate
      </button>
      <button onClick={() => setAction("return")}
        className="w-full max-w-xs rounded-2xl bg-emerald-600 py-5 text-lg font-black text-white">
        ↩ Collecting Return
      </button>
    </div>
  );

  // Step 2 — scan
  if (!scanned && !done) return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "#1A1A1A" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={() => setAction(null)} className="text-white/40 hover:text-white text-sm">← Back</button>
        <p className="text-sm font-bold text-white">{action === "delivery" ? "🚚 Delivery" : "↩ Return"} — Scan Crate</p>
        <button onClick={onClose} className="text-white/40 hover:text-white text-2xl px-1">×</button>
      </div>

      {scanning ? (
        <QRScanner onScan={v => { setScanning(false); handleScan(v); }} onClose={() => setScanning(false)} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <button onClick={() => setScanning(true)}
            className="w-full max-w-xs rounded-3xl bg-[#C9A96E] py-8 flex flex-col items-center gap-3">
            <span className="text-5xl">📷</span>
            <span className="text-lg font-black text-white">Scan QR Code</span>
            <span className="text-xs text-white/60">Tap to open camera</span>
          </button>
          <p className="text-white/30 text-sm">or enter manually</p>
          <div className="flex gap-2 w-full max-w-xs">
            <input value={manualId} onChange={e => { setManualId(e.target.value); setScanError(""); }}
              placeholder="CRATE-000001"
              className="flex-1 rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#C9A96E]" />
            <button onClick={handleManualLookup} className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white text-sm font-bold hover:bg-white/20">Find</button>
          </div>
          {scanError && <p className="text-red-400 text-sm font-semibold text-center">{scanError}</p>}
        </div>
      )}
    </div>
  );

  // Step 3 — confirm crate details + send OTP
  if (scanned && !otpFlow && !done) return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center p-6" style={{ background: "#1A1A1A" }}>
      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setScanned(null); setScanError(""); }} className="text-white/40 hover:text-white text-sm">← Re-scan</button>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl px-1">×</button>
        </div>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-5 flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-white p-3">
            <QRImg value={scanned.crateId} size={120} />
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-black text-[#C9A96E]">{scanned.crateId}</p>
            <span className={cn("inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold", CRATE_STATUS_STYLES[scanned.status])}>{scanned.status}</span>
          </div>
          {scanned.customerName && (
            <div className="w-full rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-white/40 mb-1">{action === "delivery" ? "Delivering to" : "Collecting from"}</p>
              <p className="font-bold text-white">{scanned.customerName}</p>
              {scanned.driverName && <p className="text-xs text-white/40">Driver: {scanned.driverName}</p>}
            </div>
          )}
          {action === "delivery" && !scanned.customerName && (
            <p className="text-xs text-amber-400 text-center">⚠ No customer assigned — issue from owner portal first</p>
          )}
        </div>

        <button
          onClick={startOTP}
          disabled={action === "delivery" && !scanned.customerName}
          className="w-full rounded-2xl bg-[#C9A96E] py-5 text-lg font-black text-white disabled:opacity-40">
          Send OTP to Shopkeeper →
        </button>
      </div>
    </div>
  );

  // OTP modal
  if (otpFlow && scanned) return (
    <OTPModal
      crateId={scanned.crateId}
      customerName={scanned.customerName || "Customer"}
      customerPhone={scanned.customerPhone || "9999999999"}
      action={action}
      milkmanName={milkman.name}
      onVerified={handleVerified}
      onCancel={() => setOtpFlow(false)}
    />
  );

  // Done
  if (done) return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center p-6" style={{ background: "#1A1A1A" }}>
      <div className="text-center space-y-4">
        <div className="text-8xl animate-bounce">✅</div>
        <p className="text-3xl font-black text-white">
          {action === "delivery" ? "Crate Delivered!" : "Return Confirmed!"}
        </p>
        <p className="font-mono text-[#C9A96E] text-lg">{scanned?.crateId}</p>
        <p className="text-white/40 text-sm">{scanned?.customerName}</p>
        <button onClick={onClose} className="mt-6 rounded-2xl bg-[#C9A96E] px-10 py-4 text-base font-black text-white">Done</button>
        <button onClick={() => { setScanned(null); setDone(false); setAction(null); setScanError(""); }}
          className="block w-full rounded-2xl bg-white/10 py-3 text-sm font-bold text-white/60">
          Scan Another Crate
        </button>
      </div>
    </div>
  );

  return null;
}

// ─── Milkman Portal ─────────────────────────────────────────────────────────────

function MilkmanPortal({ milkman, orders, crates, onCycleDelivery, onMarkPaid, onCrateIssue, onCrateReturn, onLogout }) {
  const myOrders = (orders || []).filter(o => isToday(o.createdAt) && o.assignedTo === milkman.id);
  const allTodayOrders = (orders || []).filter(o => isToday(o.createdAt));
  const displayOrders = myOrders.length > 0 ? myOrders : allTodayOrders;


  const delivered = displayOrders.filter(o => o.deliveryStatus === "Delivered").length;
  const pending   = displayOrders.filter(o => o.deliveryStatus === "Pending").length;
  const outFor    = displayOrders.filter(o => o.deliveryStatus === "Out for delivery").length;
  const [showCrateScan, setShowCrateScan] = useState(false);
  const [activeTab, setActiveTab] = useState("orders"); // "orders" | "crates"

  function cycleStatus(s) {
    const seq = ["Pending","Out for delivery","Delivered"];
    return seq[(seq.indexOf(s) + 1) % seq.length];
  }

  // My crate stats
  const myCratesOut = (crates||[]).filter(c => c.driverName === milkman.name && c.status === "OUT").length;

  return (
    <div className="min-h-screen" style={{ background: "#1A1A1A" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#C9A96E] flex items-center justify-center">
              <span className="text-[10px] font-black text-white">DXI</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">{milkman.name}</p>
              <p className="text-[10px] text-white/40">Delivery Portal</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs text-white/40 hover:text-white px-3 py-1.5 rounded-lg border border-white/10">Sign out</button>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {[["orders","📋 Orders"],["crates","📦 Crates"]].map(([k,l]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              className={cn("flex-1 rounded-xl py-2 text-xs font-bold transition-all",
                activeTab === k ? "bg-[#C9A96E] text-white" : "bg-white/5 text-white/40 border border-white/10")}>
              {l}
              {k === "crates" && myCratesOut > 0 && <span className="ml-1.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[10px]">{myCratesOut}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-white">{delivered} of {displayOrders.length} delivered</p>
                <span className="text-xs text-[#C9A96E] font-semibold">{displayOrders.length > 0 ? Math.round((delivered/displayOrders.length)*100) : 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-[#C9A96E] transition-all" style={{ width: `${displayOrders.length > 0 ? (delivered/displayOrders.length)*100 : 0}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center"><p className="text-lg font-black text-amber-400">{pending}</p><p className="text-[10px] text-white/40">Pending</p></div>
                <div className="text-center"><p className="text-lg font-black text-blue-400">{outFor}</p><p className="text-[10px] text-white/40">Out</p></div>
                <div className="text-center"><p className="text-lg font-black text-emerald-400">{delivered}</p><p className="text-[10px] text-white/40">Done</p></div>
              </div>
            </div>

            <div className="space-y-3 pb-24">
              {displayOrders.map((o, i) => {
                const isDone = o.deliveryStatus === "Delivered";
                return (
                  <div key={o.id} className={cn("rounded-2xl border p-4 transition-all", isDone ? "border-white/5 opacity-60" : "border-white/15 bg-white/5")}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C9A96E]/20 text-sm font-black text-[#C9A96E] flex-shrink-0 mt-0.5">{i+1}</div>
                        <div>
                          <p className="text-base font-black text-white">{o.customerName}</p>
                          <p className="text-sm text-white/50 mt-0.5">{o.area}</p>
                          <p className="text-xs text-white/30 mt-0.5">{o.phone}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-black text-white">{formatCurrency(o.amount)}</p>
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block", PAYMENT_STYLES[o.paymentStatus])}>{o.paymentStatus}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#C9A96E] mb-3">{fmtItems(o.items)}</p>
                    {o.notes && <p className="text-xs text-white/30 mb-3 italic">"{o.notes}"</p>}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className={cn("flex-1 rounded-xl py-3 text-sm font-bold transition-all",
                          isDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                          o.deliveryStatus === "Out for delivery" ? "bg-blue-500 text-white" : "bg-[#C9A96E] text-white")}
                        onClick={() => onCycleDelivery(o.id, cycleStatus(o.deliveryStatus))}>
                        {isDone ? "✓ Delivered" : o.deliveryStatus === "Out for delivery" ? "Mark Delivered ✓" : "Start Delivery →"}
                      </button>
                      {o.paymentStatus === "Credit" && !isDone && (
                        <button className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white" onClick={() => onMarkPaid(o.id)}>Mark Paid</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── CRATES TAB ── */}
        {activeTab === "crates" && (
          <div className="space-y-4 pb-24">
            {/* Big scan button */}
            <button onClick={() => setShowCrateScan(true)}
              className="w-full rounded-3xl bg-[#C9A96E] py-8 flex flex-col items-center gap-3">
              <span className="text-5xl">📷</span>
              <span className="text-xl font-black text-white">Scan Crate QR</span>
              <span className="text-sm text-white/70">Deliver or collect a crate</span>
            </button>

            {/* My crates summary */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">My Active Crates</p>
              {(crates||[]).filter(c => c.driverName === milkman.name && c.status === "OUT").length === 0
                ? <p className="text-sm text-white/30 text-center py-4">No crates currently with you</p>
                : (crates||[]).filter(c => c.driverName === milkman.name && c.status === "OUT").map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-mono text-sm font-bold text-[#C9A96E]">{c.crateId}</p>
                      <p className="text-xs text-white/40">{c.customerName || "Unassigned"}</p>
                    </div>
                    <Badge label="OUT" tone="bg-blue-900/60 text-blue-300" />
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* Crate scan overlay */}
      {showCrateScan && (
        <CrateScanFlow
          milkman={milkman}
          crates={crates || []}
          onCrateIssue={onCrateIssue}
          onCrateReturn={onCrateReturn}
          onClose={() => setShowCrateScan(false)}
        />
      )}
    </div>
  );
}

// ─── Fleet Control Page (Owner) ─────────────────────────────────────────────────

function FleetPage({ orders, onAssignOrders }) {
  const todayOrders    = orders.filter(o => isToday(o.createdAt));
  const unassigned     = todayOrders.filter(o => !o.assignedTo);
  const [locations, setLocations] = useState(() => readLocal(STORAGE_KEYS_MM.locations) || {});
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto refresh locations every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const loc = readLocal(STORAGE_KEYS_MM.locations) || {};
      setLocations(loc);
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleAutoAssign() {
    const pending = todayOrders.filter(o => o.deliveryStatus !== "Delivered");
    const activeMillkmen = MILKMAN_ACCOUNTS.slice(0, 6);
    const perMilkman = Math.ceil(pending.length / activeMillkmen.length);
    
    const assignments = {};
    pending.forEach((order, i) => {
      const mm = activeMillkmen[Math.floor(i / perMilkman)];
      if (mm) assignments[order.id] = mm.id;
    });
    onAssignOrders(assignments);
  }

  // Milkman stats
  const milkmanStats = MILKMAN_ACCOUNTS.map(mm => {
    const assigned  = todayOrders.filter(o => o.assignedTo === mm.id);
    const delivered = assigned.filter(o => o.deliveryStatus === "Delivered").length;
    const pending   = assigned.filter(o => o.deliveryStatus === "Pending").length;
    const outFor    = assigned.filter(o => o.deliveryStatus === "Out for delivery").length;
    const loc       = locations[mm.id];
    const lastSeen  = loc ? new Date(loc.timestamp) : null;
    const minsAgo   = lastSeen ? Math.round((new Date() - lastSeen) / 60000) : null;
    const isOnline  = minsAgo !== null && minsAgo < 10;

    return { ...mm, assigned: assigned.length, delivered, pending, outFor, loc, minsAgo, isOnline };
  });

  const totalDelivered = todayOrders.filter(o => o.deliveryStatus === "Delivered").length;
  const totalPending   = todayOrders.filter(o => o.deliveryStatus === "Pending").length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#1A1A1A] text-white p-4">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Total today</p>
          <p className="text-3xl font-black">{todayOrders.length}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs text-emerald-600 uppercase tracking-widest mb-2">Delivered</p>
          <p className="text-3xl font-black text-emerald-700">{totalDelivered}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-xs text-amber-600 uppercase tracking-widest mb-2">Pending</p>
          <p className="text-3xl font-black text-amber-700">{totalPending}</p>
        </div>
        <div className="rounded-2xl bg-[#C9A96E]/10 p-4">
          <p className="text-xs text-[#8B7355] uppercase tracking-widest mb-2">Unassigned</p>
          <p className="text-3xl font-black text-[#8B7355]">{unassigned.length}</p>
        </div>
      </div>

      {/* Auto assign button */}
      {unassigned.length > 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[#C9A96E]/40 bg-[#C9A96E]/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-[#1A1A1A]">{unassigned.length} orders not assigned yet</p>
            <p className="text-sm text-[#999] mt-0.5">Auto-divide equally across all {MILKMAN_ACCOUNTS.length} milkmen</p>
          </div>
          <button onClick={handleAutoAssign}
            className="rounded-xl bg-[#1A1A1A] px-6 py-2.5 text-sm font-bold text-white whitespace-nowrap hover:bg-[#2d2d2d]">
            Auto Assign Orders →
          </button>
        </div>
      )}

      {/* Live location map placeholder */}
      <div className="rounded-2xl bg-white border border-[#E8E2D9] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-base font-bold text-[#1A1A1A]">Live Fleet Map</p>
            <p className="text-xs text-[#999] mt-0.5">Updates every 30 seconds · Last refresh: {lastRefresh.toLocaleTimeString("en-IN")}</p>
          </div>
          <button onClick={() => { setLocations(readLocal(STORAGE_KEYS_MM.locations) || {}); setLastRefresh(new Date()); }}
            className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] px-3 py-1.5 text-xs font-semibold text-[#666] hover:bg-[#F0EDE8]">
            Refresh ↻
          </button>
        </div>

        {/* Simple visual map — dots on a grid (Google Maps integration placeholder) */}
        <div className="rounded-2xl bg-[#F0EDE8] border border-[#E8E2D9] relative overflow-hidden" style={{ height: "240px" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-2">🗺️</p>
              <p className="text-sm font-semibold text-[#8B7355]">Google Maps Integration</p>
              <p className="text-xs text-[#999] mt-1">Add Google Maps API key to enable live tracking</p>
              <p className="text-xs text-[#BBB] mt-0.5">milkman locations update every 30 sec via Firebase</p>
            </div>
          </div>
          {/* Dairy HQ pin */}
          <div className="absolute top-4 left-4 bg-[#1A1A1A] text-white rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
            <span>📍</span> DXI Dairy HQ
          </div>
          {/* Simulated milkman pins */}
          {milkmanStats.filter(m => m.isOnline).map((mm, i) => (
            <div key={mm.id}
              className="absolute bg-[#C9A96E] text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-black shadow-lg border-2 border-white"
              style={{ top: `${20 + (i * 35) % 160}px`, left: `${80 + (i * 60) % 300}px` }}
              title={mm.name}>
              {i+1}
            </div>
          ))}
        </div>
      </div>

      {/* Milkman cards */}
      <div className="rounded-2xl bg-white border border-[#E8E2D9] p-5">
        <p className="text-base font-bold text-[#1A1A1A] mb-4">Milkman Status — Live</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {milkmanStats.map((mm, i) => (
            <div key={mm.id} className="rounded-2xl border border-[#E8E2D9] p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-sm font-black text-white flex-shrink-0">{i+1}</div>
                  <div>
                    <p className="font-semibold text-sm text-[#1A1A1A]">{mm.name}</p>
                    <p className="text-xs text-[#999]">{mm.email}</p>
                  </div>
                </div>
                <div className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", mm.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-[#F0EDE8] text-[#999]")}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", mm.isOnline ? "bg-emerald-500" : "bg-[#CCC]")}></span>
                  {mm.isOnline ? "Online" : mm.minsAgo !== null ? `${mm.minsAgo}m ago` : "Offline"}
                </div>
              </div>

              {/* Progress */}
              {mm.assigned > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs text-[#999] mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold text-[#1A1A1A]">{mm.delivered}/{mm.assigned}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F0EDE8] mb-3">
                    <div className="h-1.5 rounded-full bg-[#C9A96E] transition-all" style={{ width: `${mm.assigned > 0 ? (mm.delivered/mm.assigned)*100 : 0}%` }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-xs">
                    <div className="rounded-lg bg-amber-50 py-1.5"><p className="font-black text-amber-700">{mm.pending}</p><p className="text-amber-600/70">Pending</p></div>
                    <div className="rounded-lg bg-blue-50 py-1.5"><p className="font-black text-blue-700">{mm.outFor}</p><p className="text-blue-600/70">Out</p></div>
                    <div className="rounded-lg bg-emerald-50 py-1.5"><p className="font-black text-emerald-700">{mm.delivered}</p><p className="text-emerald-600/70">Done</p></div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] p-3 text-center">
                  <p className="text-xs text-[#999]">No orders assigned</p>
                  <p className="text-xs text-[#BBB] mt-0.5">Click "Auto Assign" above</p>
                </div>
              )}

              {mm.loc && (
                <p className="text-[10px] text-[#999] mt-2 truncate">
                  📍 {mm.loc.lat?.toFixed(4)}, {mm.loc.lng?.toFixed(4)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Assigned orders breakdown */}
      <div className="rounded-2xl bg-white border border-[#E8E2D9] p-5">
        <p className="text-base font-bold text-[#1A1A1A] mb-4">Today's Order Assignments</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[#BBB]">
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Items</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Assigned To</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayOrders.map(o => {
                const mm = MILKMAN_ACCOUNTS.find(m => m.id === o.assignedTo);
                return (
                  <tr key={o.id} className="border-t border-[#F0EDE8] text-sm">
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-[#1A1A1A]">{o.customerName}</p>
                      <p className="text-xs text-[#999]">{o.area}</p>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-[#666]">{fmtItems(o.items)}</td>
                    <td className="py-3.5 pr-4 font-semibold">{formatCurrency(o.amount)}</td>
                    <td className="py-3.5 pr-4">
                      {mm ? (
                        <span className="rounded-lg bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-1 text-xs font-semibold text-[#1A1A1A]">{mm.name.split(" ")[0]}</span>
                      ) : (
                        <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <Badge label={o.deliveryStatus} tone={DELIVERY_STYLES[o.deliveryStatus]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CRATES MODULE v2 — QR-based Individual Crate Tracking ────────────────────

const CRATE_LIABILITY_PER = 300;
const CRATE_STATUS_STYLES = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  OUT:       "bg-blue-100 text-blue-700",
  RETURNED:  "bg-stone-100 text-stone-600",
  LOST:      "bg-red-100 text-red-700",
  DAMAGED:   "bg-amber-100 text-amber-700",
};

// ── Minimal QR code generator (pure JS, no lib needed) ──────────────────────
// Uses a tiny QR via Google Charts API (works offline-ish via cache)
function QRImg({ value, size = 120 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=svg&margin=4`;
  return <img src={url} alt={value} width={size} height={size} className="rounded-lg" />;
}

// ── Generate new crate IDs ───────────────────────────────────────────────────
function genCrateId(existing) {
  const nums = existing.map(c => parseInt((c.crateId || "").replace("CRATE-", ""), 10));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `CRATE-${String(next).padStart(6, "0")}`;
}


function buildNewCrates(count, existing) {
  const arr = [];
  let base = existing.length
    ? Math.max(...existing.map(c => parseInt(((c.crateId || "").replace("CRATE-", ""), 10))).filter(n => !isNaN(n)), 0)
    : 0;
  for (let i = 0; i < count; i++) {
    base++;
    const crateId = `CRATE-${String(base).padStart(6, "0")}`;
    arr.push({
      id: crateId,
      crateId,
      status: "AVAILABLE",
      customerName: "",
      driverName: "",
      issuedAt: null,
      returnedAt: null,
      location: "",
      damagedAt: null,
      damageRemarks: "",
      lostAt: null,
      history: [{ event: "CREATED", at: new Date().toISOString(), note: "Crate registered in system" }],
      createdAt: new Date().toISOString(),
    });
  }
  return arr;
}

// ── Sub-views ────────────────────────────────────────────────────────────────
const CRATE_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "registry",  label: "Registry"  },
  { key: "issue",     label: "Issue"     },
  { key: "return",    label: "Return"    },
  { key: "generate",  label: "Generate QR" },
  { key: "liability", label: "Liability" },
];

function CrateStatCard({ label, value, sub, color }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-[#999] mb-1">{label}</p>
      <p className={cn("text-3xl font-black", color || "text-[#1A1A1A]")}>{value}</p>
      {sub && <p className="text-xs text-[#999] mt-0.5">{sub}</p>}
    </Card>
  );
}

function CratesDashboard({ crates }) {
  const total     = crates.length;
  const available = crates.filter(c => c.status === "AVAILABLE").length;
  const out       = crates.filter(c => c.status === "OUT").length;
  const returned  = crates.filter(c => c.status === "RETURNED").length;
  const lost      = crates.filter(c => c.status === "LOST").length;
  const damaged   = crates.filter(c => c.status === "DAMAGED").length;
  const retToday  = crates.filter(c => c.status === "RETURNED" && c.returnedAt && isToday(c.returnedAt)).length;
  const liability = out * CRATE_LIABILITY_PER;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <CrateStatCard label="Total Crates"      value={total}                  />
        <CrateStatCard label="Available"         value={available} color="text-emerald-600" />
        <CrateStatCard label="Out w/ Customers"  value={out}       color="text-blue-600"    />
        <CrateStatCard label="Returned Today"    value={retToday}  color="text-indigo-600"  />
        <CrateStatCard label="Lost / Damaged"    value={lost + damaged} color="text-red-600" />
        <CrateStatCard label="Liability"         value={formatCurrency(liability)} color="text-amber-600" sub={`${out} crates × ₹${CRATE_LIABILITY_PER}`} />
      </div>

      {/* Customer outstanding */}
      <Card className="p-5">
        <p className="text-sm font-bold text-[#1A1A1A] mb-4">Customer Outstanding</p>
        {(() => {
          const map = {};
          crates.filter(c => c.status === "OUT" && c.customerName).forEach(c => {
            if (!map[c.customerName]) map[c.customerName] = { count: 0, driver: c.driverName };
            map[c.customerName].count++;
          });
          const rows = Object.entries(map).sort((a,b) => b[1].count - a[1].count);
          if (!rows.length) return <p className="text-sm text-[#999]">No crates currently out.</p>;
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#E8E2D9]">
                  <th className="text-left py-2 pr-4 text-xs font-bold text-[#999]">Customer</th>
                  <th className="text-left py-2 pr-4 text-xs font-bold text-[#999]">Driver</th>
                  <th className="text-right py-2 pr-4 text-xs font-bold text-[#999]">Crates Out</th>
                  <th className="text-right py-2 text-xs font-bold text-[#999]">Liability</th>
                </tr></thead>
                <tbody>
                  {rows.map(([name, d]) => (
                    <tr key={name} className="border-b border-[#F0EDE8]">
                      <td className="py-2.5 pr-4 font-medium text-[#1A1A1A]">{name}</td>
                      <td className="py-2.5 pr-4 text-[#666]">{d.driver || "—"}</td>
                      <td className="py-2.5 pr-4 text-right font-bold text-blue-600">{d.count}</td>
                      <td className="py-2.5 text-right font-bold text-amber-600">{formatCurrency(d.count * CRATE_LIABILITY_PER)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </Card>

      {/* Driver summary */}
      <Card className="p-5">
        <p className="text-sm font-bold text-[#1A1A1A] mb-4">Driver Summary</p>
        {(() => {
          const map = {};
          crates.filter(c => c.driverName).forEach(c => {
            if (!map[c.driverName]) map[c.driverName] = { issued: 0, returned: 0, pending: 0 };
            if (c.status === "OUT")      { map[c.driverName].issued++;  map[c.driverName].pending++; }
            if (c.status === "RETURNED") { map[c.driverName].issued++;  map[c.driverName].returned++; }
          });
          const rows = Object.entries(map);
          if (!rows.length) return <p className="text-sm text-[#999]">No driver data yet.</p>;
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#E8E2D9]">
                  <th className="text-left py-2 pr-4 text-xs font-bold text-[#999]">Driver</th>
                  <th className="text-right py-2 pr-4 text-xs font-bold text-[#999]">Issued</th>
                  <th className="text-right py-2 pr-4 text-xs font-bold text-[#999]">Returned</th>
                  <th className="text-right py-2 text-xs font-bold text-[#999]">Pending</th>
                </tr></thead>
                <tbody>
                  {rows.map(([name, d]) => (
                    <tr key={name} className="border-b border-[#F0EDE8]">
                      <td className="py-2.5 pr-4 font-medium text-[#1A1A1A]">{name}</td>
                      <td className="py-2.5 pr-4 text-right">{d.issued}</td>
                      <td className="py-2.5 pr-4 text-right text-emerald-600">{d.returned}</td>
                      <td className="py-2.5 text-right font-bold text-blue-600">{d.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

function CrateRegistry({ crates, onMarkLost, onMarkDamaged, onViewHistory }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filtered = crates.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.crateId.toLowerCase().includes(q) || (c.customerName||"").toLowerCase().includes(q) || (c.driverName||"").toLowerCase().includes(q);
    const matchF = filter === "ALL" || c.status === filter;
    return matchQ && matchF;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search by Crate ID, Customer, Driver…" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C9A96E]">
          <option value="ALL">All Statuses</option>
          {Object.keys(CRATE_STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <p className="text-xs text-[#999]">{filtered.length} crate{filtered.length !== 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-[#999] text-center py-8">No crates found. Generate some in the "Generate QR" tab.</p>}
        {filtered.map(c => (
          <Card key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-[#1A1A1A] text-sm">{c.crateId}</span>
                <Badge label={c.status} tone={CRATE_STATUS_STYLES[c.status]} />
              </div>
              <p className="text-xs text-[#666]">
                {c.customerName ? `Customer: ${c.customerName}` : "No customer"}
                {c.driverName ? ` · Driver: ${c.driverName}` : ""}
                {c.issuedAt ? ` · Issued: ${formatDate(c.issuedAt)}` : ""}
                {c.returnedAt ? ` · Returned: ${formatDate(c.returnedAt)}` : ""}
              </p>
              {c.damageRemarks && <p className="text-xs text-amber-600 mt-0.5">⚠ {c.damageRemarks}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Btn variant="ghost" className="text-xs px-3 py-1.5" onClick={() => onViewHistory(c)}>History</Btn>
              {c.status === "OUT" && <Btn variant="secondary" className="text-xs px-3 py-1.5" onClick={() => onMarkLost(c.id)}>Mark Lost</Btn>}
              {(c.status === "AVAILABLE" || c.status === "RETURNED") && <Btn variant="secondary" className="text-xs px-3 py-1.5" onClick={() => onMarkDamaged(c.id)}>Mark Damaged</Btn>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function IssueCrate({ crates, onIssue }) {
  const [crateId, setCrateId] = useState("");
  const [customer, setCustomer] = useState("");
  const [driver, setDriver] = useState("");
  const [found, setFound] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const lookup = () => {
    const c = crates.find(x => x.crateId.toLowerCase() === crateId.trim().toLowerCase());
    if (!c) { setError("Crate not found. Check ID."); setFound(null); return; }
    if (c.status === "OUT") { setError(`Already OUT with ${c.customerName}`); setFound(null); return; }
    if (c.status === "LOST" || c.status === "DAMAGED") { setError(`Crate is ${c.status} — cannot issue.`); setFound(null); return; }
    setError(""); setFound(c);
  };

  const handleIssue = () => {
    if (!found || !customer) return;
    onIssue(found.id, customer.trim(), driver.trim());
    setSuccess(`✓ ${found.crateId} issued to ${customer}`);
    setCrateId(""); setCustomer(""); setDriver(""); setFound(null);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="space-y-5 max-w-lg">
      <Card className="p-6 space-y-4">
        <p className="font-bold text-[#1A1A1A]">Issue Crate to Customer</p>
        <div className="flex gap-2">
          <Input placeholder="Enter Crate ID (e.g. CRATE-000001)" value={crateId} onChange={e => { setCrateId(e.target.value); setError(""); setFound(null); }} />
          <Btn onClick={lookup} className="shrink-0">Find</Btn>
        </div>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {found && (
          <div className="rounded-xl bg-[#F0EDE8] border border-[#E8E2D9] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <QRImg value={found.crateId} size={64} />
              <div>
                <p className="font-bold font-mono text-[#1A1A1A]">{found.crateId}</p>
                <Badge label={found.status} tone={CRATE_STATUS_STYLES[found.status]} />
              </div>
            </div>
            <Input label="Customer Name" placeholder="Customer name" value={customer} onChange={e => setCustomer(e.target.value)} />
            <Input label="Driver Name" placeholder="Driver name (optional)" value={driver} onChange={e => setDriver(e.target.value)} />
            <Btn className="w-full" onClick={handleIssue} disabled={!customer}>Issue Crate →</Btn>
          </div>
        )}
        {success && <p className="text-sm text-emerald-600 font-semibold">{success}</p>}
      </Card>

      {/* Bulk issue list — available crates quick-pick */}
      <Card className="p-5">
        <p className="text-sm font-bold text-[#1A1A1A] mb-3">Available Crates ({crates.filter(c => c.status === "AVAILABLE").length})</p>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {crates.filter(c => c.status === "AVAILABLE").map(c => (
            <button key={c.id} onClick={() => { setCrateId(c.crateId); setFound(null); setError(""); }}
              className="font-mono text-xs px-2.5 py-1 rounded-lg border border-[#E8E2D9] bg-[#FAF8F5] hover:border-[#C9A96E] hover:bg-[#F0EDE8] transition-colors">
              {c.crateId}
            </button>
          ))}
          {crates.filter(c => c.status === "AVAILABLE").length === 0 && <p className="text-xs text-[#999]">No available crates.</p>}
        </div>
      </Card>
    </div>
  );
}

function ReturnCrate({ crates, onReturn }) {
  const [crateId, setCrateId] = useState("");
  const [found, setFound]     = useState(null);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const lookup = () => {
    const c = crates.find(x => x.crateId.toLowerCase() === crateId.trim().toLowerCase());
    if (!c) { setError("Crate not found."); setFound(null); return; }
    if (c.status !== "OUT") { setError(`Crate is ${c.status} — not currently out.`); setFound(null); return; }
    setError(""); setFound(c);
  };

  const handleReturn = () => {
    if (!found) return;
    onReturn(found.id);
    setSuccess(`✓ ${found.crateId} marked RETURNED`);
    setCrateId(""); setFound(null);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="space-y-5 max-w-lg">
      <Card className="p-6 space-y-4">
        <p className="font-bold text-[#1A1A1A]">Return a Crate</p>
        <div className="flex gap-2">
          <Input placeholder="Enter Crate ID (e.g. CRATE-000003)" value={crateId} onChange={e => { setCrateId(e.target.value); setError(""); setFound(null); }} />
          <Btn onClick={lookup} className="shrink-0">Find</Btn>
        </div>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {found && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <QRImg value={found.crateId} size={64} />
              <div>
                <p className="font-bold font-mono text-[#1A1A1A]">{found.crateId}</p>
                <p className="text-sm text-[#666]">Customer: <strong>{found.customerName}</strong></p>
                <p className="text-sm text-[#666]">Driver: {found.driverName || "—"}</p>
                <p className="text-xs text-[#999]">Issued: {found.issuedAt ? formatDateFull(found.issuedAt) : "—"}</p>
              </div>
            </div>
            <Btn className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleReturn}>✓ Confirm Return</Btn>
          </div>
        )}
        {success && <p className="text-sm text-emerald-600 font-semibold">{success}</p>}
      </Card>

      {/* OUT crates quick-pick */}
      <Card className="p-5">
        <p className="text-sm font-bold text-[#1A1A1A] mb-3">Crates Currently Out ({crates.filter(c => c.status === "OUT").length})</p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {crates.filter(c => c.status === "OUT").map(c => (
            <button key={c.id} onClick={() => { setCrateId(c.crateId); setFound(null); setError(""); }}
              className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] hover:border-[#C9A96E] hover:bg-[#F0EDE8] transition-colors">
              <span className="font-mono text-xs font-bold text-[#1A1A1A]">{c.crateId}</span>
              <span className="text-xs text-[#666]">{c.customerName}</span>
            </button>
          ))}
          {crates.filter(c => c.status === "OUT").length === 0 && <p className="text-xs text-[#999]">No crates currently out.</p>}
        </div>
      </Card>
    </div>
  );
}

function GenerateQR({ crates, onGenerate }) {
  const [count, setCount]       = useState("10");
  const [preview, setPreview]   = useState(null);
  const [printing, setPrinting] = useState(false);

  const handleGenerate = () => {
    const n = Math.min(Math.max(parseInt(count) || 1, 1), 1000);
    const newCrates = buildNewCrates(n, crates);
    onGenerate(newCrates);
    setPreview(newCrates);
  };

  const printQRSheet = () => {
    if (!preview || !preview.length) return;
    setPrinting(true);
    const win = window.open("", "_blank");
    const html = `<!DOCTYPE html><html><head><title>DXI Crate QR Labels</title>
    <style>
      body { font-family: monospace; background: white; margin: 0; padding: 16px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
      .label { border: 1px solid #ccc; border-radius: 8px; padding: 10px; text-align: center; page-break-inside: avoid; }
      .label img { display: block; margin: 0 auto 6px; }
      .label p { margin: 0; font-size: 11px; font-weight: bold; }
      .label small { font-size: 9px; color: #666; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <p style="font-size:14px;font-weight:bold;margin-bottom:12px">DXI Dairy — Crate QR Labels (${preview.length} crates)</p>
    <div class="grid">${preview.map(c =>
      `<div class="label">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(c.crateId)}&format=png&margin=4" width="100" height="100"/>
        <p>${c.crateId}</p>
        <small>DXI Dairy Intelligence</small>
      </div>`
    ).join("")}</div>
    <script>window.onload=()=>{window.print()}<\/script></body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => setPrinting(false), 1500);
  };

  return (
    <div className="space-y-5 max-w-xl">
      <Card className="p-6 space-y-4">
        <p className="font-bold text-[#1A1A1A]">Generate New Crate QR Codes</p>
        <div className="flex gap-3 flex-wrap">
          {[10, 50, 100, 500].map(n => (
            <button key={n} onClick={() => setCount(String(n))}
              className={cn("px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
                count === String(n) ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "border-[#E8E2D9] text-[#666] hover:border-[#C9A96E]")}>
              {n} Crates
            </button>
          ))}
        </div>
        <Input label="Custom Count (max 1000)" type="number" min="1" max="1000" value={count} onChange={e => setCount(e.target.value)} />
        <div className="flex gap-3">
          <Btn onClick={handleGenerate} className="flex-1">Generate {count || "?"} Crates</Btn>
          {preview && <Btn variant="secondary" onClick={printQRSheet} disabled={printing} className="flex-1">🖨 Print QR Sheet</Btn>}
        </div>
      </Card>

      {preview && (
        <Card className="p-5">
          <p className="text-sm font-bold text-[#1A1A1A] mb-4">Preview — {preview.length} New Crates</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {preview.slice(0, 20).map(c => (
              <div key={c.id} className="flex flex-col items-center gap-1 p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5]">
                <QRImg value={c.crateId} size={80} />
                <p className="font-mono text-xs font-bold text-[#1A1A1A] text-center">{c.crateId}</p>
              </div>
            ))}
            {preview.length > 20 && <div className="flex items-center justify-center p-3 rounded-xl border border-dashed border-[#E8E2D9]"><p className="text-xs text-[#999] text-center">+{preview.length - 20} more crates</p></div>}
          </div>
        </Card>
      )}
    </div>
  );
}

function LiabilityReport({ crates }) {
  const customerMap = {};
  crates.filter(c => c.status === "OUT" && c.customerName).forEach(c => {
    if (!customerMap[c.customerName]) customerMap[c.customerName] = { crates: [], driver: c.driverName };
    customerMap[c.customerName].crates.push(c);
  });

  const printReport = () => {
    const rows = Object.entries(customerMap);
    const win = window.open("", "_blank");
    const total = rows.reduce((s, [,d]) => s + d.crates.length, 0);
    const html = `<!DOCTYPE html><html><head><title>DXI Crate Liability Report</title>
    <style>body{font-family:sans-serif;padding:24px;color:#1a1a1a}h1{font-size:20px;margin-bottom:4px}p{font-size:13px;color:#666}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px 12px;font-size:13px}th{background:#f5f5f5;font-weight:bold;text-align:left}tfoot td{font-weight:bold;background:#fafafa}@media print{body{padding:0}}</style></head>
    <body><h1>DXI Dairy — Crate Liability Report</h1><p>Generated: ${new Date().toLocaleString("en-IN")} · 1 crate = ₹${CRATE_LIABILITY_PER}</p>
    <table><thead><tr><th>Customer</th><th>Driver</th><th>Crates Out</th><th>Liability (₹)</th></tr></thead>
    <tbody>${rows.map(([name,d])=>`<tr><td>${name}</td><td>${d.driver||"—"}</td><td>${d.crates.length}</td><td>₹${(d.crates.length*CRATE_LIABILITY_PER).toLocaleString("en-IN")}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td colspan="2">TOTAL</td><td>${total}</td><td>₹${(total*CRATE_LIABILITY_PER).toLocaleString("en-IN")}</td></tr></tfoot></table>
    <script>window.onload=()=>window.print()<\/script></body></html>`;
    win.document.write(html); win.document.close();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#1A1A1A]">Customer Liability Report</p>
        <Btn variant="secondary" className="text-xs" onClick={printReport}>🖨 Print / PDF</Btn>
      </div>
      <Card className="p-5">
        {Object.keys(customerMap).length === 0
          ? <p className="text-sm text-[#999] text-center py-8">No outstanding crates.</p>
          : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#E8E2D9]">
                <th className="text-left py-2 pr-4 text-xs font-bold text-[#999]">Customer</th>
                <th className="text-left py-2 pr-4 text-xs font-bold text-[#999]">Driver</th>
                <th className="text-left py-2 pr-4 text-xs font-bold text-[#999]">Crate IDs</th>
                <th className="text-right py-2 pr-4 text-xs font-bold text-[#999]">Count</th>
                <th className="text-right py-2 text-xs font-bold text-[#999]">Liability</th>
              </tr></thead>
              <tbody>
                {Object.entries(customerMap).map(([name, d]) => (
                  <tr key={name} className="border-b border-[#F0EDE8]">
                    <td className="py-3 pr-4 font-semibold text-[#1A1A1A]">{name}</td>
                    <td className="py-3 pr-4 text-[#666]">{d.driver || "—"}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {d.crates.slice(0,4).map(c => <span key={c.id} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{c.crateId}</span>)}
                        {d.crates.length > 4 && <span className="text-[10px] text-[#999]">+{d.crates.length - 4}</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right font-bold text-blue-600">{d.crates.length}</td>
                    <td className="py-3 text-right font-bold text-amber-600">{formatCurrency(d.crates.length * CRATE_LIABILITY_PER)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#E8E2D9]">
                  <td colSpan={3} className="py-3 font-bold text-[#1A1A1A]">Total Outstanding</td>
                  <td className="py-3 text-right font-black text-blue-700">{Object.values(customerMap).reduce((s,d)=>s+d.crates.length,0)}</td>
                  <td className="py-3 text-right font-black text-amber-700">
                    {formatCurrency(Object.values(customerMap).reduce((s,d)=>s+d.crates.length*CRATE_LIABILITY_PER,0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Lost crates */}
      {crates.filter(c=>c.status==="LOST").length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-bold text-red-600 mb-3">Lost Crates ({crates.filter(c=>c.status==="LOST").length})</p>
          <div className="flex flex-wrap gap-2">
            {crates.filter(c=>c.status==="LOST").map(c=>(
              <div key={c.id} className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs">
                <span className="font-mono font-bold text-red-700">{c.crateId}</span>
                {c.customerName && <span className="text-red-500 ml-1">· {c.customerName}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function CrateHistoryModal({ crate, onClose }) {
  if (!crate) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-[#1A1A1A] font-mono">{crate.crateId}</p>
            <Badge label={crate.status} tone={CRATE_STATUS_STYLES[crate.status]} />
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-[#1A1A1A] text-2xl leading-none">×</button>
        </div>
        <div className="mb-4 flex justify-center">
          <QRImg value={crate.crateId} size={120} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#999] mb-3">Event History</p>
        <div className="relative pl-4 border-l-2 border-[#E8E2D9] space-y-4">
          {(crate.history || []).slice().reverse().map((h, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full bg-[#C9A96E] border-2 border-white" />
              <p className="text-xs font-bold text-[#1A1A1A]">{h.event}</p>
              <p className="text-xs text-[#666]">{h.note}</p>
              <p className="text-[10px] text-[#AAA]">{h.at ? new Date(h.at).toLocaleString("en-IN") : ""}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main CratesPage ───────────────────────────────────────────────────────────
function CratesPage({ crates, setCrates }) {
  const [tab, setTab]             = useState("dashboard");
  const [histCrate, setHistCrate] = useState(null);
  const [damageModal, setDamageModal] = useState(null);
  const [damageRemark, setDamageRemark] = useState("");

  useEffect(() => { writeLocal(STORAGE_KEYS.crates, crates); }, [crates]);

  const updateCrate = (id, patch, historyEvent) => {
    setCrates(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        ...patch,
        history: [...(c.history || []), { event: historyEvent.event, at: new Date().toISOString(), note: historyEvent.note }]
      };
    }));
  };

  const handleIssue = (id, customerName, driverName) => {
    updateCrate(id, { status: "OUT", customerName, driverName, issuedAt: new Date().toISOString(), returnedAt: null },
      { event: "ISSUED", note: `Issued to ${customerName}${driverName ? ` via ${driverName}` : ""}` });
  };

  const handleReturn = (id) => {
    const c = crates.find(x => x.id === id);
    updateCrate(id, { status: "RETURNED", returnedAt: new Date().toISOString() },
      { event: "RETURNED", note: `Returned from ${c?.customerName || "customer"}` });
  };

  const handleMarkLost = (id) => {
    const c = crates.find(x => x.id === id);
    updateCrate(id, { status: "LOST", lostAt: new Date().toISOString() },
      { event: "LOST", note: `Marked lost (was with ${c?.customerName || "unknown"})` });
  };

  const handleMarkDamaged = (id) => {
    setDamageModal(id); setDamageRemark("");
  };

  const confirmDamage = () => {
    updateCrate(damageModal, { status: "DAMAGED", damagedAt: new Date().toISOString(), damageRemarks: damageRemark },
      { event: "DAMAGED", note: damageRemark || "Marked as damaged" });
    setDamageModal(null); setDamageRemark("");
  };

  const handleGenerate = (newCrates) => {
    setCrates(prev => [...prev, ...newCrates]);
    setTab("registry");
  };

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap">
        {CRATE_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              tab === t.key ? "bg-[#1A1A1A] text-white" : "text-[#666] hover:bg-[#F0EDE8] hover:text-[#1A1A1A]")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "dashboard"  && <CratesDashboard crates={crates} />}
      {tab === "registry"   && <CrateRegistry crates={crates} onMarkLost={handleMarkLost} onMarkDamaged={handleMarkDamaged} onViewHistory={setHistCrate} />}
      {tab === "issue"      && <IssueCrate crates={crates} onIssue={handleIssue} />}
      {tab === "return"     && <ReturnCrate crates={crates} onReturn={handleReturn} />}
      {tab === "generate"   && <GenerateQR crates={crates} onGenerate={handleGenerate} />}
      {tab === "liability"  && <LiabilityReport crates={crates} />}

      {/* History modal */}
      {histCrate && <CrateHistoryModal crate={histCrate} onClose={() => setHistCrate(null)} />}

      {/* Damage remark modal */}
      {damageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <p className="font-bold text-[#1A1A1A]">Mark Crate as Damaged</p>
            <Input label="Damage Remarks" placeholder="Describe the damage…" value={damageRemark} onChange={e => setDamageRemark(e.target.value)} />
            <div className="flex gap-3">
              <Btn variant="secondary" className="flex-1" onClick={() => setDamageModal(null)}>Cancel</Btn>
              <Btn variant="danger" className="flex-1" onClick={confirmDamage}>Confirm Damage</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function WhatsAppPage() {

  const STORAGE_KEY = "dxi_whatsapp_orders_v1";

  // Configurable UPI ID for QR payments
  const UPI_ID = "owner@upi";

  const PRICE_LIST = {
    milk: 60,
    dahi: 80,
    paneer: 400
  };

  const [customer, setCustomer] = useState("");
  const [message, setMessage] = useState("");

  const [parsedItems, setParsedItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [orders, setOrders] = useState(
    readLocal(STORAGE_KEY) || []
  );

  useEffect(() => {
    writeLocal(STORAGE_KEY, orders);
  }, [orders]);

  function parseOrder() {

    const lines = message
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

    const items = [];

    let grandTotal = 0;

    lines.forEach(line => {

      const parts = line.split(" ");

      if (parts.length < 2) return;

      const product =
        parts[0].toLowerCase();

      const qty =
        Number(parts[1]);

      const price =
        PRICE_LIST[product] || 0;

      const amount =
        qty * price;

      grandTotal += amount;

      items.push({
        product,
        qty,
        price,
        amount
      });

    });

    setParsedItems(items);
    setTotal(grandTotal);
  }

  function buildUpiLink({ upiId, pn, totalAmount }) {
    const am = totalAmount || 0;
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR`;
  }

  function createOrder() {

    if (!customer) return;

    const createdAt = new Date().toISOString();
    const upiLink = buildUpiLink({ upiId: UPI_ID, pn: "DailyEase", totalAmount: total });

    const order = {
      id: crypto.randomUUID(),
      customer,
      items: parsedItems,
      total,
      status: "PAYMENT_PENDING",
      createdAt,
      paid: false,
      upiId: UPI_ID,
      upiLink
    };

    setOrders([order, ...orders]);

    setCustomer("");
    setMessage("");
    setParsedItems([]);
    setTotal(0);
  }

  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => !!o.paid);
  const unpaidOrders = orders.filter(o => !o.paid);

  const pendingPaymentAmount = unpaidOrders.reduce((s, o) => s + (o.total || 0), 0);
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);

  // Backward-compatible variable names used in the JSX below
  const pending = pendingPaymentAmount;
  const revenue = totalRevenue;

  function markPaid(orderId) {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, paid: true };
    }));
  }

  function printBill(order) {
    if (!order) return;

    const invoiceNo = String(order.id).slice(0, 12);
    const dateStr = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "";

    const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.upiLink || "")}`;

    const rowsHtml = (order.items || []).map(it => {
      const qty = it.qty ?? 0;
      const rate = it.price ?? 0;
      const amount = it.amount ?? Math.round(qty * rate);
      const label = it.product || it.key || "Item";
      return `
        <tr>
          <td style="padding:8px 6px; border-top:1px solid #eee; font-size:13px;">${label}</td>
          <td style="padding:8px 6px; border-top:1px solid #eee; text-align:right; font-size:13px;">${qty}</td>
          <td style="padding:8px 6px; border-top:1px solid #eee; text-align:right; font-size:13px;">₹${rate}</td>
          <td style="padding:8px 6px; border-top:1px solid #eee; text-align:right; font-size:13px; font-weight:600;">₹${amount}</td>
        </tr>`;
    }).join("");

    const safeCustomer = String(order.customer || "").replace(/</g, "<").replace(/>/g, ">");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>DAILYEASE Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color:#111; }
    h1 { margin:0; font-size:24px; letter-spacing:0.4px; }
    .meta { margin-top:6px; font-size:14px; color:#333; }
    .wrap { border:1px solid #ddd; border-radius:12px; padding:16px; margin-top:14px; }
    table { width:100%; border-collapse:collapse; margin-top:12px; }
    th { padding:10px 6px; text-align:left; border-bottom:2px solid #eee; font-size:12px; color:#666; text-transform:uppercase; letter-spacing:0.4px; }
    td { padding:8px 6px; font-size:13px; border-top:1px solid #eee; }
    td:last-child { text-align:right; }
    .grand { display:flex; justify-content:flex-end; margin-top:12px; font-size:18px; font-weight:900; }
    .qr { display:flex; justify-content:flex-end; margin-top:10px; }
    @media print { body { padding:0; } .wrap { border:none; padding:0; margin:0; } }
  </style>
</head>
<body>
  <h1>DAILYEASE</h1>
  <div class="meta">Invoice Number: <b>${invoiceNo}</b></div>
  <div class="meta">Customer Name: <b>${safeCustomer}</b></div>
  <div class="meta">Date: <b>${dateStr}</b></div>

  <div class="wrap">
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:right;">Qty</th>
          <th style="text-align:right;">Rate</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="grand">Grand Total: ₹${order.total || 0}</div>
    <div class="qr"><img src="${upiQrUrl}" width="200" height="200" alt="UPI QR" /></div>
  </div>

  <script>
    window.onload = () => { window.print(); };
  </script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  return (
    <div className="space-y-6">

      <div className="grid md:grid-cols-3 gap-4">

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Orders
          </p>
          <p className="text-3xl font-bold">
            {orders.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Payment Pending
          </p>
          <p className="text-3xl font-bold">
            {pending}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Revenue
          </p>
          <p className="text-3xl font-bold">
            ₹{
              orders.reduce(
                (s,o)=>s+o.total,
                0
              )
            }
          </p>
        </Card>

      </div>

      <Card className="p-5 space-y-4">

        <Input
          placeholder="Customer Name"
          value={customer}
          onChange={(e)=>
            setCustomer(e.target.value)
          }
        />

        <textarea
          className="w-full border rounded-xl p-3"
          rows="6"
          placeholder={`Milk 20
Dahi 5
Paneer 2`}
          value={message}
          onChange={(e)=>
            setMessage(e.target.value)
          }
        />

        <div className="flex gap-3">

          <Btn
            onClick={parseOrder}
          >
            Parse Order
          </Btn>

          <Btn
            onClick={createOrder}
          >
            Create Order
          </Btn>

        </div>

      </Card>

      {parsedItems.length > 0 && (

        <Card className="p-5">

          <h3 className="font-bold mb-4">
            Parsed Order
          </h3>

          {parsedItems.map(item => (

            <div
              key={item.product}
              className="flex justify-between py-2 border-b"
            >

              <span>
                {item.product}
              </span>

              <span>
                {item.qty} × ₹{item.price}
              </span>

            </div>

          ))}

          <div className="mt-4 text-xl font-bold">
            Total: ₹{total}
          </div>

        </Card>

      )}

        <Card className="p-5">

          <h3 className="font-bold mb-4">
            Orders
          </h3>

          <div className="space-y-3">

            {orders.map(order => {
              const isPaid = !!order.paid;
              const statusBadgeClass = isPaid
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700";

              const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.upiLink || "")}`;
              return (

                <div
                  key={order.id}
                  className="border rounded-xl p-4"
                >

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#1A1A1A]">
                        {order.customer}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Order ID: {order.id}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold">
                        ₹{order.total}
                      </div>
                      <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-2" style={{ backgroundColor: isPaid ? "#d1fae5" : "#fee2e2", color: isPaid ? "#059669" : "#dc2626" }}>
                        {isPaid ? "PAID" : "UNPAID"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-700">
                    <div className="font-semibold text-[#1A1A1A] mb-1">Items</div>
                    <div className="space-y-1">
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span>{it.product} ({it.qty} × ₹{it.price})</span>
                          <span className="font-semibold">₹{it.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 items-center">
                    <img src={upiQrUrl} alt="UPI QR" width="72" height="72" className="rounded-lg" />
                    <div className="flex-1 flex flex-col items-start justify-center">
                      <div className="text-xs text-gray-500">
                        Payment status: {isPaid ? "PAID" : "UNPAID"}
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {!isPaid && (
                          <Btn variant="primary" className="px-4 py-2 text-xs" onClick={() => markPaid(order.id)}>
                            Mark Paid
                          </Btn>
                        )}
                        <Btn variant="secondary" className="px-4 py-2 text-xs" onClick={() => printBill(order)}>
                          Print Bill
                        </Btn>
                      </div>
                    </div>
                  </div>

                </div>

              );
            })}

          </div>

        </Card>

    </div>
  );
}
function App() {
  const firebase   = useMemo(() => initFirebase(), []);
  const seedOrders = useMemo(() => buildSeedOrders(), []);
  const seedFarmers= useMemo(() => buildSeedFarmers(), []);

  const [route,       setRoute]       = useState(getRoute());
  const [user,        setUser]        = useState(readSession());
  const [milkmanUser, setMilkmanUser] = useState(() => readLocal(STORAGE_KEYS_MM.session));
  const [authReady,   setAuthReady]   = useState(!firebase.available);
  const [orders,      setOrders]      = useState([]);
  const [farmers,     setFarmers]     = useState([]);
  const [crates,      setCratesGlobal] = useState(() => readLocal(STORAGE_KEYS.crates) || []);
  const [dataReady,   setDataReady]   = useState(false);
  const [banner,      setBanner]      = useState("");

  const usingFB = firebase.available && user && user.provider === "firebase";

  useEffect(() => {
    const fn = () => setRoute(getRoute());
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  useEffect(() => {
    if (!firebase.available) { setAuthReady(true); return; }
    const unsub = firebase.auth.onAuthStateChanged(u => {
      if (u) {
        const s = { email: u.email || "firebase-user@dxi.in", name: u.displayName || "DXI Owner", provider: "firebase" };
        saveSession(s); setUser(s);
      } else {
        const fallback = readSession();
        if (fallback && fallback.provider === "demo") setUser(fallback);
        else { clearSession(); setUser(null); }
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [firebase]);

  useEffect(() => {
    if (!authReady) return;
    if (PROTECTED_ROUTES.includes(route) && !user) navigate("login");
  }, [route, user, authReady]);

  useEffect(() => {
    if (!user) { setDataReady(false); setOrders([]); setFarmers([]); return; }
    let cancelled = false;
    async function load() {
      setDataReady(false);
      const [o, f] = await Promise.all([loadCol("orders", seedOrders, firebase, usingFB), loadCol("farmers", seedFarmers, firebase, usingFB)]);
      if (cancelled) return;
      setOrders(sortByLatest(o)); setFarmers(f); setDataReady(true);
    }
    load();
    return () => { cancelled = true; };
  }, [user, usingFB, seedOrders, seedFarmers, firebase]);

  useEffect(() => { if (dataReady) writeLocal(STORAGE_KEYS.orders, orders); }, [orders, dataReady]);
  useEffect(() => { if (dataReady) writeLocal(STORAGE_KEYS.farmers, farmers); }, [farmers, dataReady]);
  useEffect(() => { if (!banner) return; const t = setTimeout(() => setBanner(""), 3500); return () => clearTimeout(t); }, [banner]);

  async function persist(col, doc) {
    if (!usingFB || !firebase.db) return;
    try { await firebase.db.collection(col).doc(doc.id).set(sanitize(doc), { merge: true }); }
    catch { setBanner("Cloud save failed. Local data is safe."); }
  }

  async function handleLogin(email, password) {
    const e = email.trim().toLowerCase(), p = password.trim();
    if (e === DEMO_ACCOUNT.email && p === DEMO_ACCOUNT.password) {
      const s = { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name, provider: "demo" };
      saveSession(s); setUser(s); setBanner("Demo dashboard loaded."); navigate("dashboard"); return { ok: true };
    }
    if (firebase.available) {
      try {
        const cred = await firebase.auth.signInWithEmailAndPassword(e, p);
        const s = { email: cred.user.email || e, name: cred.user.displayName || "DXI Owner", provider: "firebase" };
        saveSession(s); setUser(s); setBanner("Signed in with Firebase."); navigate("dashboard"); return { ok: true };
      } catch { return { ok: false, message: "Login failed. Check your credentials." }; }
    }
    return { ok: false, message: "Use demo credentials to continue." };
  }

  // Milkman login
  async function handleMilkmanLogin(email, password) {
    const e = email.trim().toLowerCase(), p = password.trim();
    const mm = MILKMAN_ACCOUNTS.find(m => m.email === e && m.password === p);
    if (mm) {
      writeLocal(STORAGE_KEYS_MM.session, mm);
      setMilkmanUser(mm);
      return { ok: true };
    }
    return { ok: false, message: "Invalid milkman credentials." };
  }

  function handleMilkmanLogout() {
    localStorage.removeItem(STORAGE_KEYS_MM.session);
    setMilkmanUser(null);
  }

  // Assign orders to milkmen
  async function handleAssignOrders(assignments) {
    // assignments = { orderId: milkmanId }
    let updatedOrders = [];
    setOrders(current => {
      const next = current.map(o => {
        if (assignments[o.id]) {
          const updated = { ...o, assignedTo: assignments[o.id], updatedAt: new Date().toISOString() };
          updatedOrders.push(updated);
          return updated;
        }
        return o;
      });
      return next;
    });
    // Persist all updated orders
    setTimeout(async () => {
      for (const o of updatedOrders) {
        await persist("orders", o);
      }
      setBanner(`${Object.keys(assignments).length} orders assigned to milkmen.`);
    }, 100);
  }

  async function handleLogout() {
    if (user && user.provider === "firebase" && firebase.auth) await firebase.auth.signOut();
    clearSession(); setUser(null); setBanner(""); navigate("login");
  }

  async function handleAddOrder(form) {
    const items = orderItems(form.quantities);
    const o = { id: `order-${slugify(form.customerName)}-${Date.now()}`, customerName: form.customerName.trim(), phone: form.phone.trim(), area: form.area.trim(), items, amount: items.reduce((s,i) => s+i.lineTotal,0), paymentStatus: form.paymentStatus, deliveryStatus: "Pending", notes: form.notes.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setOrders(c => sortByLatest([o, ...c])); await persist("orders", o); setBanner("Order saved.");
  }

  async function handleCycleDelivery(id, next) {
    let updated = null;
    setOrders(c => c.map(o => { if (o.id !== id) return o; updated = { ...o, deliveryStatus: next, updatedAt: new Date().toISOString() }; return updated; }));
    if (updated) { await persist("orders", updated); setBanner(`Status: ${next}`); }
  }

  async function handleMarkPaid(id) {
    let updated = null;
    setOrders(c => c.map(o => { if (o.id !== id) return o; updated = { ...o, paymentStatus: "Paid", updatedAt: new Date().toISOString() }; return updated; }));
    if (updated) { await persist("orders", updated); setBanner("Marked as paid."); }
  }

  function handleMilkmanCrateIssue(crateId, customerName, driverName) {
    setCratesGlobal(prev => {
      const updated = prev.map(c => c.id !== crateId ? c : {
        ...c, status: "OUT", customerName, driverName, issuedAt: new Date().toISOString(), returnedAt: null,
        history: [...(c.history||[]), { event: "ISSUED_OTP", at: new Date().toISOString(), note: `OTP verified — issued to ${customerName} via ${driverName}` }]
      });
      writeLocal(STORAGE_KEYS.crates, updated);
      return updated;
    });
  }

  function handleMilkmanCrateReturn(crateId) {
    setCratesGlobal(prev => {
      const c = prev.find(x => x.id === crateId);
      const updated = prev.map(x => x.id !== crateId ? x : {
        ...x, status: "RETURNED", returnedAt: new Date().toISOString(),
        history: [...(x.history||[]), { event: "RETURNED_OTP", at: new Date().toISOString(), note: `OTP verified — returned from ${c?.customerName || "customer"}` }]
      });
      writeLocal(STORAGE_KEYS.crates, updated);
      return updated;
    });
  }

  async function handleAddFarmer(form) {
    const total = toNum(form.morningLitres) + toNum(form.eveningLitres), fat = toNum(form.fat);
    const entry = { date: new Date().toISOString(), morningLitres: toNum(form.morningLitres), eveningLitres: toNum(form.eveningLitres), fat, totalLitres: total, payment: Math.round(total*fat*50) };
    const f = { id: `farmer-${slugify(form.name)}-${Date.now()}`, name: form.name.trim(), phone: form.phone.trim() || phone(farmers.length+61), village: form.village.trim(), rate: 50, joinedAt: new Date().toISOString(), dailyEntries: [entry] };
    setFarmers(c => [f, ...c]); await persist("farmers", f); setBanner("Farmer saved."); return f;
  }

  function sendReminder(entry) {
    const name = entry.name || entry.customerName || "Customer";
    const msg  = encodeURIComponent(`Hello ${name}, this is a friendly reminder from DXI. Your outstanding balance is ${formatCurrency(entry.amount)}. Please share payment confirmation. Thank you.`);
    const digits = String(entry.phone || "").replace(/\D/g, "");
    const num  = digits.length === 10 ? `91${digits}` : digits;
    if (num) window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  }

  const cl          = useMemo(() => creditLedger(orders), [orders]);
  const todayOrders = useMemo(() => sortByLatest(orders).filter(o => isToday(o.createdAt)), [orders]);
  const syncLabel   = usingFB ? "Firestore live sync" : "Demo local save";

  if (!authReady) return (
    <div className="grid min-h-screen place-items-center" style={{ background: "#FAF8F5" }}>
      <div className="rounded-2xl bg-white border border-[#E8E2D9] p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#C9A96E]">DXI</p>
        <p className="text-xl font-black text-[#1A1A1A] mt-2">Loading...</p>
      </div>
    </div>
  );

  // ── Milkman portal check ──
  if (route === "milkman-login") {
    if (milkmanUser) return <MilkmanPortal milkman={milkmanUser} orders={orders} crates={crates} onCycleDelivery={handleCycleDelivery} onMarkPaid={handleMarkPaid} onCrateIssue={handleMilkmanCrateIssue} onCrateReturn={handleMilkmanCrateReturn} onLogout={handleMilkmanLogout} />;
    return <MilkmanLoginPage onLogin={handleMilkmanLogin} />;
  }

  // If milkman is logged in and tries to access owner routes — send to milkman portal
  if (milkmanUser && !user) {
    if (dataReady) return <MilkmanPortal milkman={milkmanUser} orders={orders} crates={crates} onCycleDelivery={handleCycleDelivery} onMarkPaid={handleMarkPaid} onCrateIssue={handleMilkmanCrateIssue} onCrateReturn={handleMilkmanCrateReturn} onLogout={handleMilkmanLogout} />;
  }

  if (route === "login" && user) { navigate("dashboard"); return null; }
  if (route === "landing") return <LandingPage onNavigate={r => navigate(r)} />;
  if (route === "login" || !user) return <LoginPage firebaseReady={firebase.available} onLogin={handleLogin} onNavigate={r => navigate(r)} />;

  if (!dataReady) return (
    <div className="grid min-h-screen place-items-center" style={{ background: "#FAF8F5" }}>
      <div className="rounded-2xl bg-white border border-[#E8E2D9] p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#C9A96E]">DXI</p>
        <p className="text-xl font-black text-[#1A1A1A] mt-2">Loading data...</p>
      </div>
    </div>
  );

  let page = null;
if (route === "dashboard")
    page = <DashboardPage orders={orders} />;

else if (route === "orders")
    page = <OrdersPage orders={orders} onAddOrder={handleAddOrder} onCycleDelivery={handleCycleDelivery} onMarkOrderPaid={handleMarkPaid} onSendReminder={sendReminder} />;

else if (route === "farmers")
page = <FarmersPage farmers={farmers || []} />;

else if (route === "credits")
    page = <CreditTrackerPage creditLedger={cl} onSendReminder={sendReminder} />;

else if (route === "fleet")
    page = <FleetPage orders={orders} onAssignOrders={handleAssignOrders} />;

else if (route === "crates")
    page = <CratesPage crates={crates} setCrates={setCratesGlobal} />;

else if (route === "whatsapp")
    page = <WhatsAppPage />;

else
    page = <DeliveryPage todaysOrders={todayOrders} onChangeStatus={handleCycleDelivery} />;
  return (
    <AppShell route={route} onRouteChange={r => navigate(r)} currentUser={user} syncModeLabel={syncLabel} banner={banner} onLogout={handleLogout}>
      {page}
    </AppShell>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
