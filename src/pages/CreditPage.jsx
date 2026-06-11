import { useState } from 'react';
import { Card, Btn, Badge, StatCard, EmptyState } from '../components/ui.jsx';
import { cn, formatCurrency, formatDate, formatDateFull, sumBy } from '../utils.js';

function CreditTrackerPage({ creditLedger: cl, onSendReminder }) {
  const total    = sumBy(cl, e => e.amount);
  const overdue  = (cl || []).filter(e => e.daysOutstanding > 30).length;

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
              {(cl || []).map(e => (
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
          {(cl || []).map(e => (
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

export { CreditTrackerPage as default };
