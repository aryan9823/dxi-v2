import { useState } from 'react';
import { Card, Btn, Badge, StatCard } from '../components/ui.jsx';
import { cn, formatCurrency, formatDateFull, fmtItems } from '../utils.js';

function StatusButtons({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {["Pending", "Out for delivery", "Delivered"].map((status) => (
        <button
          key={status}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            value === status ? "bg-[#1A1A1A] text-white" : "bg-[#FAF8F5] border border-[#E8E2D9] text-[#666] hover:bg-[#F0EDE8]",
          )}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
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


export default DeliveryPage;
