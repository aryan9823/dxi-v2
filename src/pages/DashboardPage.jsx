import { Card, Badge } from '../components/ui.jsx';
import { formatCurrency, fmtItems, isToday, DELIVERY_STYLES, PAYMENT_STYLES } from '../utils.js';

function sortByLatest(items, key = 'createdAt') {
  return [...items].sort((a, b) => new Date(b[key]) - new Date(a[key]));
}

function MetricCard({ title, value, subtitle, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-white border border-[#E8E2D9] text-[#1A1A1A]',
    brand: 'bg-[#1A1A1A] text-white',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-2xl p-5 ${tones[tone] || tones.neutral}`}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">{title}</p>
      <p className="text-3xl font-black mb-1">{value}</p>
      <p className="text-xs opacity-60">{subtitle}</p>
    </div>
  );
}

function DashboardPage({
  orders = [],
  credit = []
}) {
  const recent      = sortByLatest(orders).slice(0, 5);
  const todayOrders = (orders || []).filter(o => isToday(o.createdAt));
  const delivered   = (todayOrders || []).filter(o => o.deliveryStatus === "Delivered").length;
  const pending     = (todayOrders || []).filter(o => o.deliveryStatus !== "Delivered").length;
  const totalCredit = (credit || []).reduce((sum, entry) => sum + (Number(entry?.amount) || 0), 0);
  const todayRev    = todayOrders
    .filter((order) => order.paymentStatus !== "Credit")
    .reduce((sum, order) => sum + (Number(order?.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Today's orders"   value={todayOrders.length}      subtitle={`${delivered} delivered`}          tone="brand"   />
        <MetricCard title="Pending stops"    value={pending}                 subtitle="Need delivery updates"             tone="neutral" />
        <MetricCard title="Credit pending"   value={formatCurrency(totalCredit)} subtitle={`${credit.length} customers`} tone="red"     />
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
                {(recent || []).map(o => (
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
                <p className="text-xs text-white/40">Open credit accounts</p>
                <p className="text-2xl font-black mt-1">{credit.length}</p>
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


export default DashboardPage;
