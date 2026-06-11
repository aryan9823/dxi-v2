import { useState, useEffect } from 'react';
import { Card, Btn, Badge, Input } from '../components/ui.jsx';
import { cn, formatCurrency, safeArr } from '../utils.js';
import { readLocal, writeLocal, KEYS } from '../services/storage.js';

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
  const paidOrders = (orders || []).filter(o => !!o.paid);
  const unpaidOrders = (orders || []).filter(o => !o.paid);

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
              (orders || []).reduce(
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

          {(parsedItems || []).map(item => (

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

            {(orders || []).map(order => {
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


export default WhatsAppPage;
