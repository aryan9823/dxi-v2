import { useEffect, useRef, useState } from 'react';
import { Btn, Input } from '../components/ui.jsx';
import { cn, MILKMAN_ACCOUNTS, DEMO_ACCOUNT } from '../utils.js';

function MilkmanLoginPage({ onLogin }) {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await onLogin(form.email, form.password);
    setLoading(false);
    if (!res.ok) setError(res.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#1A1A1A" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9A96E] mb-4">
            <span className="text-lg font-black text-white">DXI</span>
          </div>
          <h1 className="text-2xl font-black text-white">Milkman Login</h1>
          <p className="text-white/40 text-sm mt-1">DXI Delivery Portal</p>
        </div>
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/50 uppercase tracking-widest">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A96E] text-sm"
                placeholder="milkman1@dxi.in" />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/50 uppercase tracking-widest">Password</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A96E] text-sm"
                placeholder="milkman123" />
            </div>
            {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#C9A96E] py-3 text-sm font-bold text-white disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>
          <div className="mt-4 rounded-xl bg-white/5 p-3">
            <p className="text-xs text-white/30 mb-1">Demo credentials:</p>
            <p className="text-xs text-white/50">milkman1@dxi.in / milkman123</p>
          </div>
        </div>
        <p className="text-center mt-4 text-xs text-white/20">
          Owner? <button className="text-[#C9A96E]" onClick={() => { window.location.hash = "#/login"; }}>Owner login →</button>
        </p>
      </div>
    </div>
  );
}

// ─── WhatsApp OTP Helper ─────────────────────────────────────────────────────

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendWhatsAppOTP(toPhone, otp, customerName, crateId, action) {
  const cfg = window.DXI_WHATSAPP_CONFIG || {};

  // TEST MODE — just return the OTP without calling API
  if (!cfg.token || cfg.token === "YOUR_META_WHATSAPP_TOKEN" || cfg.testMode) {
    console.log(`[TEST MODE] OTP for ${toPhone}: ${otp}`);
    return { success: true, testMode: true };
  }

  const body = {
    messaging_product: "whatsapp",
    to: `91${toPhone.replace(/\D/g, "").slice(-10)}`,
    type: "text",
    text: {
      body: `DXI Dairy\n\nYour crate ${action === "delivery" ? "delivery" : "return"} OTP:\n\n*${otp}*\n\nCrate: ${crateId}\nValid for 5 minutes.\n\nDo not share this OTP.`
    }
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${cfg.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    return { success: false, error: err?.error?.message || "API error" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─── QR Scanner Component (camera) ──────────────────────────────────────────

function QRScanner({ onScan, onClose }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (e) {
        setError("Camera access denied. Please allow camera permission and retry.");
      }
    }

    function tick() {
      if (!active || !scanning) return;
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) { rafRef.current = requestAnimationFrame(tick); return; }
      const ctx = canvas.getContext("2d");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
        if (code && code.data) {
          setScanning(false);
          stopCamera();
          onScan(code.data);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    function stopCamera() {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <p className="text-sm font-bold text-white">Scan Crate QR Code</p>
        <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none px-2">×</button>
      </div>
      <div className="flex-1 relative flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {/* Scan frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#C9A96E] rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#C9A96E] rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#C9A96E] rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#C9A96E] rounded-br-xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-[#C9A96E]/60 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center">
          {error
            ? <p className="text-red-400 text-sm font-semibold px-4">{error}</p>
            : <p className="text-white/60 text-xs">Point camera at the crate QR code</p>
          }
        </div>
      </div>
    </div>
  );
}

// ─── OTP Verification Modal ──────────────────────────────────────────────────

function OTPModal({ crateId, customerName, customerPhone, action, milkmanName, onVerified, onCancel }) {
  const [otp]        = useState(generateOTP);
  const [input, setInput]   = useState("");
  const [sent, setSent]     = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState("");
  const [testOtp, setTestOtp] = useState("");
  const cfg = window.DXI_WHATSAPP_CONFIG || {};
  const isTest = !cfg.token || cfg.token === "YOUR_META_WHATSAPP_TOKEN" || cfg.testMode;

  // Auto-send OTP when modal opens
  useEffect(() => { handleSend(); }, []);

  async function handleSend() {
    setSending(true); setError("");
    const res = await sendWhatsAppOTP(customerPhone, otp, customerName, crateId, action);
    setSending(false);
    if (res.success) {
      setSent(true);
      if (res.testMode) setTestOtp(otp); // show on screen in test mode
    } else {
      setError(res.error || "Failed to send OTP");
      // Still show test OTP so dev can proceed
      setSent(true); setTestOtp(otp);
    }
  }

  function verify() {
    if (input.trim() === otp) {
      onVerified();
    } else {
      setError("Wrong OTP. Try again.");
      setInput("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full sm:max-w-sm bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="font-bold text-white text-base">OTP Verification</p>
          <button onClick={onCancel} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-1">
          <p className="text-xs text-white/40">Crate</p>
          <p className="font-mono font-bold text-[#C9A96E]">{crateId}</p>
          <p className="text-xs text-white/40 mt-2">{action === "delivery" ? "Delivering to" : "Returning from"}</p>
          <p className="font-semibold text-white">{customerName}</p>
          <p className="text-xs text-white/40">{customerPhone}</p>
        </div>

        {sending && (
          <div className="text-center py-2">
            <p className="text-sm text-white/60 animate-pulse">Sending OTP via WhatsApp…</p>
          </div>
        )}

        {sent && (
          <>
            {isTest && testOtp && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-center">
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">Test Mode — OTP</p>
                <p className="text-4xl font-black text-amber-400 tracking-widest">{testOtp}</p>
                <p className="text-xs text-amber-400/60 mt-1">Set testMode: false in firebase-config.js for production</p>
              </div>
            )}
            {!isTest && <p className="text-xs text-white/50 text-center">OTP sent to shopkeeper's WhatsApp ({customerPhone})</p>}

            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Enter OTP from shopkeeper</p>
              <input
                type="number"
                maxLength={6}
                placeholder="6-digit OTP"
                value={input}
                onChange={e => { setInput(e.target.value.slice(0,6)); setError(""); }}
                className="w-full rounded-2xl bg-white/10 border border-white/10 px-5 py-4 text-white text-2xl font-black tracking-widest text-center focus:outline-none focus:border-[#C9A96E]"
                autoFocus
              />
              {error && <p className="text-sm text-red-400 font-semibold text-center">{error}</p>}
              <button
                onClick={verify}
                disabled={input.length < 6}
                className="w-full rounded-2xl bg-[#C9A96E] py-4 text-base font-black text-white disabled:opacity-40">
                {action === "delivery" ? "✓ Confirm Delivery" : "✓ Confirm Return"}
              </button>
              <button onClick={handleSend} className="w-full text-xs text-white/30 hover:text-white/60 py-2">Resend OTP</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Crate Scan Flow (inside Milkman Portal) ─────────────────────────────────

function CrateScanFlow({ milkman, crates, onCrateIssue, onCrateReturn, onClose }) {
  // action = "delivery" | "return" | null
  const [action, setAction]     = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned]   = useState(null);   // crate object
  const [scanError, setScanError] = useState("");
  const [otpFlow, setOtpFlow]   = useState(false);
  const [done, setDone]         = useState(false);
  const [manualId, setManualId] = useState("");

  function handleScan(rawData) {
    const crateId = rawData.trim();
    const crate = (crates || []).find(c => c.crateId === crateId);
    if (!crate) { setScanError(`Crate "${crateId}" not found in system.`); return; }

    if (action === "delivery") {
      if (crate.status === "DELIVERED" || crate.status === "OUT") {
        // Already issued — just need OTP for delivery confirmation
        setScanned(crate); setScanError("");
      } else if (crate.status === "AVAILABLE" || crate.status === "RETURNED") {
        setScanned(crate); setScanError("");
      } else {
        setScanError(`Crate is ${crate.status} — cannot deliver.`); return;
      }
    } else {
      if (crate.status !== "OUT") { setScanError(`Crate is ${crate.status} — not currently out.`); return; }
      setScanned(crate); setScanError("");
    }
  }

  function handleManualLookup() {
    handleScan(manualId.trim());
  }

  function startOTP() {
    if (!scanned) return;
    setOtpFlow(true);
  }

  function handleVerified() {
    if (action === "delivery") {
      onCrateIssue(scanned.id, scanned.customerName || "Customer", milkman.name);
    } else {
      onCrateReturn(scanned.id);
    }
    setOtpFlow(false);
    setDone(true);
  }

  // Step 1 — choose action
  if (!action) return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center p-6 gap-5" style={{ background: "#1A1A1A" }}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white text-2xl px-2">×</button>
      <div className="h-16 w-16 rounded-2xl bg-[#C9A96E] flex items-center justify-center mb-2">
        <span className="text-3xl">📦</span>
      </div>
      <p className="text-2xl font-black text-white text-center">Crate Scanner</p>
      <p className="text-sm text-white/40 text-center">What are you doing?</p>
      <button onClick={() => setAction("delivery")}
        className="w-full max-w-xs rounded-2xl bg-[#C9A96E] py-5 text-lg font-black text-white">
        🚚 Delivering Crate
      </button>
      <button onClick={() => setAction("return")}
        className="w-full max-w-xs rounded-2xl bg-emerald-600 py-5 text-lg font-black text-white">
        ↩ Collecting Return
      </button>
    </div>
  );

  // Step 2 — scan
  if (!scanned && !done) return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "#1A1A1A" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={() => setAction(null)} className="text-white/40 hover:text-white text-sm">← Back</button>
        <p className="text-sm font-bold text-white">{action === "delivery" ? "🚚 Delivery" : "↩ Return"} — Scan Crate</p>
        <button onClick={onClose} className="text-white/40 hover:text-white text-2xl px-1">×</button>
      </div>

      {scanning ? (
        <QRScanner onScan={v => { setScanning(false); handleScan(v); }} onClose={() => setScanning(false)} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <button onClick={() => setScanning(true)}
            className="w-full max-w-xs rounded-3xl bg-[#C9A96E] py-8 flex flex-col items-center gap-3">
            <span className="text-5xl">📷</span>
            <span className="text-lg font-black text-white">Scan QR Code</span>
            <span className="text-xs text-white/60">Tap to open camera</span>
          </button>
          <p className="text-white/30 text-sm">or enter manually</p>
          <div className="flex gap-2 w-full max-w-xs">
            <input value={manualId} onChange={e => { setManualId(e.target.value); setScanError(""); }}
              placeholder="CRATE-000001"
              className="flex-1 rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#C9A96E]" />
            <button onClick={handleManualLookup} className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white text-sm font-bold hover:bg-white/20">Find</button>
          </div>
          {scanError && <p className="text-red-400 text-sm font-semibold text-center">{scanError}</p>}
        </div>
      )}
    </div>
  );

  // Step 3 — confirm crate details + send OTP
  if (scanned && !otpFlow && !done) return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center p-6" style={{ background: "#1A1A1A" }}>
      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setScanned(null); setScanError(""); }} className="text-white/40 hover:text-white text-sm">← Re-scan</button>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl px-1">×</button>
        </div>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-5 flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-white p-3">
            <QRImg value={scanned.crateId} size={120} />
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-black text-[#C9A96E]">{scanned.crateId}</p>
            <span className={cn("inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold", CRATE_STATUS_STYLES[scanned.status])}>{scanned.status}</span>
          </div>
          {scanned.customerName && (
            <div className="w-full rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-white/40 mb-1">{action === "delivery" ? "Delivering to" : "Collecting from"}</p>
              <p className="font-bold text-white">{scanned.customerName}</p>
              {scanned.driverName && <p className="text-xs text-white/40">Driver: {scanned.driverName}</p>}
            </div>
          )}
          {action === "delivery" && !scanned.customerName && (
            <p className="text-xs text-amber-400 text-center">⚠ No customer assigned — issue from owner portal first</p>
          )}
        </div>

        <button
          onClick={startOTP}
          disabled={action === "delivery" && !scanned.customerName}
          className="w-full rounded-2xl bg-[#C9A96E] py-5 text-lg font-black text-white disabled:opacity-40">
          Send OTP to Shopkeeper →
        </button>
      </div>
    </div>
  );

  // OTP modal
  if (otpFlow && scanned) return (
    <OTPModal
      crateId={scanned.crateId}
      customerName={scanned.customerName || "Customer"}
      customerPhone={scanned.customerPhone || "9999999999"}
      action={action}
      milkmanName={milkman.name}
      onVerified={handleVerified}
      onCancel={() => setOtpFlow(false)}
    />
  );

  // Done
  if (done) return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center p-6" style={{ background: "#1A1A1A" }}>
      <div className="text-center space-y-4">
        <div className="text-8xl animate-bounce">✅</div>
        <p className="text-3xl font-black text-white">
          {action === "delivery" ? "Crate Delivered!" : "Return Confirmed!"}
        </p>
        <p className="font-mono text-[#C9A96E] text-lg">{scanned?.crateId}</p>
        <p className="text-white/40 text-sm">{scanned?.customerName}</p>
        <button onClick={onClose} className="mt-6 rounded-2xl bg-[#C9A96E] px-10 py-4 text-base font-black text-white">Done</button>
        <button onClick={() => { setScanned(null); setDone(false); setAction(null); setScanError(""); }}
          className="block w-full rounded-2xl bg-white/10 py-3 text-sm font-bold text-white/60">
          Scan Another Crate
        </button>
      </div>
    </div>
  );

  return null;
}

// ─── Milkman Portal ─────────────────────────────────────────────────────────────


export default MilkmanLoginPage;
