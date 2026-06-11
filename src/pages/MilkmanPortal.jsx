import { useState, useEffect, useRef } from 'react';
import { Card, Btn, Badge } from '../components/ui.jsx';
import { cn, formatCurrency, fmtItems, isToday, DELIVERY_STYLES, PAYMENT_STYLES, CRATE_STATUS_STYLES, safeArr } from '../utils.js';
import { readLocal, writeLocal, KEYS } from '../services/storage.js';
import { generateOTP, sendWhatsAppOTP } from '../services/whatsapp.js';

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


export default MilkmanPortal;
