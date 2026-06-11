import { useState } from 'react';
import { Card, Btn, Badge, Input, EmptyState } from '../components/ui.jsx';
import { cn, formatCurrency, fmtItems, orderItems, orderAmount, PRODUCT_CATALOG, DELIVERY_STYLES, PAYMENT_STYLES, sortByLatest, toNum } from '../utils.js';

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
              {(filtered || []).map(o => (
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
          {(filtered || []).map(o => (
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

export default OrdersPage;
export { FarmerForm };
