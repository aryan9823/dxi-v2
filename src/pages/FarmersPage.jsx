import { useEffect, useState } from 'react';
import { Card, Badge } from '../components/ui.jsx';
import { FarmerForm } from './OrdersPage.jsx';
import { cn, formatCompact, formatCurrency, formatDate, formatLitres, farmerSummary, sumBy } from '../utils.js';

function FarmersPage({ farmers, onAddFarmer }) {
  const safeFarmers = Array.isArray(farmers) ? farmers : [];
  const sums = safeFarmers.map(f => ({ ...f, summary: farmerSummary(f) }));
  const [sel, setSel] = useState(sums[0] ? sums[0].id : "");
  useEffect(() => { if (!sel && sums[0]) setSel(sums[0].id); }, [sel, sums]);
  const selected = (sums || []).find(f => f.id === sel) || sums[0] || null;
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
            <div className="rounded-xl bg-[#1A1A1A] p-4 text-white"><p className="text-xs text-white/40 mb-1">Total farmers</p><p className="text-2xl font-black">{safeFarmers.length}</p></div>
            <div className="rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] p-4"><p className="text-xs text-[#999] mb-1">This month's milk</p><p className="text-2xl font-black text-[#1A1A1A]">{formatLitres(monthL)}</p></div>
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-600 mb-1">Estimated payout</p><p className="text-2xl font-black text-emerald-700">{formatCompact(monthP)}</p></div>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-base font-bold text-[#1A1A1A]">Farmer List</p>
            <Badge label={`${safeFarmers.length} farmers`} tone="bg-[#F0EDE8] text-[#8B7355]" />
          </div>
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
              {(sums || []).map(f => (
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


export default FarmersPage;
