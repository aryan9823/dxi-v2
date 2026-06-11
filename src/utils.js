// ── DXI Shared Constants & Utilities ─────────────────────────────────────────

export const PRODUCT_CATALOG = [
  { key: 'milk',   label: 'Milk',   unit: 'L',  rate: 62  },
  { key: 'paneer', label: 'Paneer', unit: 'kg', rate: 360 },
  { key: 'dahi',   label: 'Dahi',   unit: 'kg', rate: 110 },
  { key: 'lassi',  label: 'Lassi',  unit: 'L',  rate: 75  },
];

export const NAV_ITEMS = [
  { route: 'dashboard', label: 'Dashboard', short: 'Home'     },
  { route: 'orders',    label: 'Orders',    short: 'Orders'   },
  { route: 'farmers',   label: 'Farmers',   short: 'Farmers'  },
  { route: 'credits',   label: 'Credit',    short: 'Credit'   },
  { route: 'delivery',  label: 'Delivery',  short: 'Deliver'  },
  { route: 'fleet',     label: 'Fleet',     short: 'Fleet'    },
  { route: 'crates',    label: 'Crates',    short: 'Crates'   },
  { route: 'whatsapp',  label: 'WhatsApp',  short: 'WA'       },
  { route: 'profile',   label: 'Profile',   short: 'Profile'  },
];

export const PROTECTED_ROUTES = NAV_ITEMS.map((item) => item.route);

export const MILKMAN_ACCOUNTS = [
  { id: 'mm-1', email: 'milkman1@dxi.in', password: 'milkman123', name: 'Ramesh Kumar',   role: 'milkman' },
  { id: 'mm-2', email: 'milkman2@dxi.in', password: 'milkman123', name: 'Suresh Yadav',   role: 'milkman' },
  { id: 'mm-3', email: 'milkman3@dxi.in', password: 'milkman123', name: 'Dinesh Singh',   role: 'milkman' },
  { id: 'mm-4', email: 'milkman4@dxi.in', password: 'milkman123', name: 'Manoj Prasad',   role: 'milkman' },
  { id: 'mm-5', email: 'milkman5@dxi.in', password: 'milkman123', name: 'Vijay Sharma',   role: 'milkman' },
];

export const DEMO_ACCOUNT = {
  email: 'owner@dairyease.in', password: 'dairyease123', name: 'DXI Admin', provider: 'demo',
};

export const DAIRY_HQ = { lat: 23.7957, lng: 86.4304 }; // Dhanbad — update to your location

export const CRATE_LIABILITY_PER = 300;

export const STORAGE_KEYS_MM = {
  session: 'dxi_milkman_session_v1',
  locations: 'dxi_milkman_locations_v1',
  assigned: 'dxi_assigned_orders_v1',
};

export const CRATE_STATUS_STYLES = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  OUT:       'bg-blue-100 text-blue-700',
  RETURNED:  'bg-stone-100 text-stone-600',
  LOST:      'bg-red-100 text-red-700',
  DAMAGED:   'bg-amber-100 text-amber-700',
};

export const DELIVERY_STYLES = {
  Pending:            'bg-amber-100 text-amber-700',
  'Out for delivery': 'bg-blue-100 text-blue-700',
  Delivered:          'bg-emerald-100 text-emerald-700',
};

export const PAYMENT_STYLES = {
  Paid:    'bg-emerald-100 text-emerald-700',
  Credit:  'bg-red-100 text-red-700',
  Pending: 'bg-amber-100 text-amber-700',
};

// ── Utility functions ────────────────────────────────────────────────────────

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(v) {
  const n = Number(v) || 0;
  return '₹' + n.toLocaleString('en-IN');
}

export function formatCompact(v) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(v) || 0);
}

export function formatLitres(v) {
  return `${Number(v || 0).toFixed(1)} L`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); }
  catch { return '—'; }
}

export function formatDateFull(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-IN'); }
  catch { return '—'; }
}

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function isToday(iso) {
  return String(iso).slice(0, 10) === getTodayKey();
}

export function isThisMonth(iso) {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function daysSince(iso) {
  if (!iso) return 0;
  const ms = new Date(getTodayKey()) - new Date(String(iso).slice(0, 10));
  return Math.max(0, Math.round(ms / 86400000));
}

export function fmtItems(items) {
  if (!Array.isArray(items) || !items.length) return '—';
  return items.map(i => `${i?.label || ''} ${i?.quantity || 0}${i?.unit || ''}`).filter(Boolean).join(', ');
}

export function orderItems(q) {
  return (PRODUCT_CATALOG || []).filter(p => Number(q?.[p.key]) > 0).map(p => ({
    key: p.key, label: p.label, unit: p.unit, rate: p.rate,
    quantity: Number(q[p.key]) || 0,
    lineTotal: Math.round((Number(q[p.key]) || 0) * p.rate),
  }));
}

export function orderAmount(q) {
  return orderItems(q).reduce((s, i) => s + i.lineTotal, 0);
}

export function farmerSummary(f) {
  const entries = Array.isArray(f?.dailyEntries)
    ? f.dailyEntries
    : Array.isArray(f?.collections)
      ? f.collections
      : [];
  const monthEntries = safeArr(entries).filter((entry) => isThisMonth(entry?.date));
  const totalLitres = monthEntries.reduce(
    (sum, entry) => sum + (Number(entry?.totalLitres) || Number(entry?.litres) || Number(entry?.morningLitres || 0) + Number(entry?.eveningLitres || 0)),
    0,
  );
  const totalPayment = monthEntries.reduce(
    (sum, entry) => sum + (Number(entry?.payment) || Number(entry?.paid) || 0),
    0,
  );
  const averageFat = monthEntries.length
    ? monthEntries.reduce((sum, entry) => sum + (Number(entry?.fat) || 0), 0) / monthEntries.length
    : 0;
  const todayEntry = monthEntries.find((entry) => isToday(entry?.date));
  const todayLitres = todayEntry
    ? Number(todayEntry?.totalLitres) || Number(todayEntry?.litres) || Number(todayEntry?.morningLitres || 0) + Number(todayEntry?.eveningLitres || 0)
    : 0;

  return {
    totalLitres,
    totalPayment,
    averageFat,
    todayLitres,
    entries: monthEntries,
    avgFat: averageFat.toFixed(1),
    rate: Number(f?.rate) || 0,
    earned: totalPayment,
    totalPaid: totalPayment,
    balance: 0,
  };
}

export function safeArr(val) {
  return Array.isArray(val) ? val : [];
}

export function sanitize(value) {
  return JSON.parse(JSON.stringify(value));
}


export const STORAGE_KEYS = {
  orders:  'dxi_orders_v1',
  farmers: 'dxi_farmers_v1',
  crates:  'dxi_crates_v1',
  session: 'dxi_session_v1',
};

export function creditLedger(orders) {
  const map = {};
  safeArr(orders).filter(o => o.paymentStatus === 'Credit').forEach(o => {
    if (!map[o.customerName]) map[o.customerName] = { name: o.customerName, phone: o.phone, orders: [] };
    map[o.customerName].orders.push(o);
  });
  return Object.values(map).map(c => ({
    ...c,
    total:  c.orders.reduce((s, o) => s + (Number(o.amount) || 0), 0),
    oldest: safeArr(c.orders).map(o => o.createdAt).sort()[0],
  }));
}

export const ROUTE_META = {
  dashboard: { title: 'Dashboard',    sub: 'Your dairy business at a glance' },
  orders:    { title: 'Orders',        sub: "Manage today's orders"           },
  farmers:   { title: 'Farmers',       sub: 'Farmer management & payments'   },
  credits:   { title: 'Credit Ledger', sub: 'Track outstanding payments'     },
  delivery:  { title: 'Delivery',      sub: "Today's delivery status"        },
  fleet:     { title: 'Fleet',         sub: 'Live milkman tracking'          },
  crates:    { title: 'Crate Ledger',  sub: 'Track crate movement'           },
  whatsapp:  { title: 'WhatsApp',      sub: 'Order automation'               },
  profile:   { title: 'Profile',       sub: 'Account & settings'             },
};
export function slugify(t) {
  return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function sortByLatest(arr, k = "createdAt") {
  const list = Array.isArray(arr) ? arr : [];
  return [...list].sort((a, b) => new Date(b?.[k] || 0) - new Date(a?.[k] || 0));
}

export function toNum(v) {
  const p = parseFloat(v);
  return isFinite(p) ? p : 0;
}

export function sumBy(arr, fn) {
  return (arr || []).reduce((s, x) => s + fn(x), 0);
}
