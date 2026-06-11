import { useState, useEffect, useRef } from 'react';
import { Card, Btn, Badge, StatCard } from '../components/ui.jsx';
import { cn, fmtItems, formatCurrency, isToday, MILKMAN_ACCOUNTS, DAIRY_HQ, DELIVERY_STYLES, STORAGE_KEYS_MM } from '../utils.js';
import { readLocal, writeLocal, KEYS } from '../services/storage.js';

function FleetPage({ orders, onAssignOrders }) {
  const todayOrders    = (orders || []).filter(o => isToday(o.createdAt));
  const unassigned     = (todayOrders || []).filter(o => !o.assignedTo);
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
    const pending = (todayOrders || []).filter(o => o.deliveryStatus !== "Delivered");
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
    const assigned  = (todayOrders || []).filter(o => o.assignedTo === mm.id);
    const delivered = assigned.filter(o => o.deliveryStatus === "Delivered").length;
    const pending   = assigned.filter(o => o.deliveryStatus === "Pending").length;
    const outFor    = assigned.filter(o => o.deliveryStatus === "Out for delivery").length;
    const loc       = locations[mm.id];
    const lastSeen  = loc ? new Date(loc.timestamp) : null;
    const minsAgo   = lastSeen ? Math.round((new Date() - lastSeen) / 60000) : null;
    const isOnline  = minsAgo !== null && minsAgo < 10;

    return { ...mm, assigned: assigned.length, delivered, pending, outFor, loc, minsAgo, isOnline };
  });

  const totalDelivered = (todayOrders || []).filter(o => o.deliveryStatus === "Delivered").length;
  const totalPending   = (todayOrders || []).filter(o => o.deliveryStatus === "Pending").length;

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
          {(milkmanStats || []).filter(m => m.isOnline).map((mm, i) => (
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
          {(milkmanStats || []).map((mm, i) => (
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
              {(todayOrders || []).map(o => {
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


export default FleetPage;
