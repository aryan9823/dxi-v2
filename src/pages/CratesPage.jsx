import { useState, useEffect, useRef } from 'react';
import { Card, Btn, Badge, Input, StatCard, EmptyState } from '../components/ui.jsx';
import { cn, formatCurrency, formatDate, formatDateFull, isToday, CRATE_LIABILITY_PER, CRATE_STATUS_STYLES, safeArr } from '../utils.js';
import { readLocal, writeLocal, KEYS } from '../services/storage.js';
import { generateOTP, sendWhatsAppOTP } from '../services/whatsapp.js';

// ─── CRATES MODULE v2 — QR-based Individual Crate Tracking ────────────────────


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
  const available = (crates || []).filter(c => c.status === "AVAILABLE").length;
  const out       = (crates || []).filter(c => c.status === "OUT").length;
  const returned  = (crates || []).filter(c => c.status === "RETURNED").length;
  const lost      = (crates || []).filter(c => c.status === "LOST").length;
  const damaged   = (crates || []).filter(c => c.status === "DAMAGED").length;
  const retToday  = (crates || []).filter(c => c.status === "RETURNED" && c.returnedAt && isToday(c.returnedAt)).length;
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
          (crates || []).filter(c => c.status === "OUT" && c.customerName).forEach(c => {
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
          (crates || []).filter(c => c.driverName).forEach(c => {
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

  const filtered = (crates || []).filter(c => {
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
        {(filtered || []).map(c => (
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
    const c = (crates || []).find(x => x.crateId.toLowerCase() === crateId.trim().toLowerCase());
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
        <p className="text-sm font-bold text-[#1A1A1A] mb-3">Available Crates ({(crates || []).filter(c => c.status === "AVAILABLE").length})</p>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {(crates || []).filter(c => c.status === "AVAILABLE").map(c => (
            <button key={c.id} onClick={() => { setCrateId(c.crateId); setFound(null); setError(""); }}
              className="font-mono text-xs px-2.5 py-1 rounded-lg border border-[#E8E2D9] bg-[#FAF8F5] hover:border-[#C9A96E] hover:bg-[#F0EDE8] transition-colors">
              {c.crateId}
            </button>
          ))}
          {(crates || []).filter(c => c.status === "AVAILABLE").length === 0 && <p className="text-xs text-[#999]">No available crates.</p>}
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
    const c = (crates || []).find(x => x.crateId.toLowerCase() === crateId.trim().toLowerCase());
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
        <p className="text-sm font-bold text-[#1A1A1A] mb-3">Crates Currently Out ({(crates || []).filter(c => c.status === "OUT").length})</p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {(crates || []).filter(c => c.status === "OUT").map(c => (
            <button key={c.id} onClick={() => { setCrateId(c.crateId); setFound(null); setError(""); }}
              className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] hover:border-[#C9A96E] hover:bg-[#F0EDE8] transition-colors">
              <span className="font-mono text-xs font-bold text-[#1A1A1A]">{c.crateId}</span>
              <span className="text-xs text-[#666]">{c.customerName}</span>
            </button>
          ))}
          {(crates || []).filter(c => c.status === "OUT").length === 0 && <p className="text-xs text-[#999]">No crates currently out.</p>}
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
  (crates || []).filter(c => c.status === "OUT" && c.customerName).forEach(c => {
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
      {(crates || []).filter(c=>c.status==="LOST").length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-bold text-red-600 mb-3">Lost Crates ({(crates || []).filter(c=>c.status==="LOST").length})</p>
          <div className="flex flex-wrap gap-2">
            {(crates || []).filter(c=>c.status==="LOST").map(c=>(
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
    setCrates(prev => (prev || []).map(c => {
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
    const c = (crates || []).find(x => x.id === id);
    updateCrate(id, { status: "RETURNED", returnedAt: new Date().toISOString() },
      { event: "RETURNED", note: `Returned from ${c?.customerName || "customer"}` });
  };

  const handleMarkLost = (id) => {
    const c = (crates || []).find(x => x.id === id);
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

export default CratesPage;
