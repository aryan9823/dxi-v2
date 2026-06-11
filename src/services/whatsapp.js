// ── WhatsApp Cloud API OTP Service ───────────────────────────────────────────

const CFG = {
  token:         import.meta.env.VITE_WA_TOKEN         || '',
  phoneNumberId: import.meta.env.VITE_WA_PHONE_ID      || '',
  testMode:      import.meta.env.VITE_WA_TEST_MODE !== 'false',
};

export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendWhatsAppOTP(toPhone, otp, crateId, action) {
  if (!CFG.token || CFG.testMode) {
    console.log(`[WhatsApp TEST] OTP=${otp} to=${toPhone}`);
    return { success: true, testMode: true, otp };
  }

  const phone = `91${String(toPhone).replace(/\D/g, '').slice(-10)}`;
  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: {
      body: `DXI Dairy\n\n${action === 'delivery' ? 'Delivery' : 'Return'} OTP:\n\n*${otp}*\n\nCrate: ${crateId}\nValid 5 min. Do not share.`,
    },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${CFG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CFG.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    if (res.ok) return { success: true, testMode: false };
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err?.error?.message || 'API error', testMode: false };
  } catch (e) {
    console.error('[WhatsApp] Send failed:', e);
    return { success: false, error: e.message, testMode: false };
  }
}
