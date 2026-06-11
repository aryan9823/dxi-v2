// DXI WhatsApp Cloud API Service (Testing Mode Only)
// Exposes: window.DXI_WHATSAPP_SERVICE.sendWhatsAppMessage(phone, message)
(function () {
  function getConfig() {
    const cfg = window.DXI_WHATSAPP_CONFIG || {};
    return {
      accessToken: cfg.accessToken ?? cfg.token ?? "",
      phoneNumberId: cfg.phoneNumberId ?? "",
      whatsappBusinessAccountId: cfg.whatsappBusinessAccountId ?? cfg.businessAccountId ?? "",
      testMode: cfg.testMode === true,
    };
  }

  function formatPhoneToE164Like(phone) {
    // Accepts: 10-digit (assumed IN), or full like +91XXXXXXXXXX
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";

    // If 10 digits -> assume IN country code 91
    if (digits.length === 10) return `91${digits}`;

    // If starts with country code (e.g., 91...) keep as-is
    return digits;
  }

  async function sendWhatsAppMessage(phone, message) {
    const cfg = getConfig();

    const to = formatPhoneToE164Like(phone);
    if (!to) {
      return { ok: false, error: "Invalid phone. Provide at least 10 digits." };
    }

    if (!message || !String(message).trim()) {
      return { ok: false, error: "Message cannot be empty." };
    }

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: String(message) },
    };

    // TEST MODE ONLY — do not call Meta Graph
    if (cfg.testMode) {
      return {
        ok: true,
        testMode: true,
        data: {
          wouldCall: {
            method: "POST",
            url: `https://graph.facebook.com/v23.0/${cfg.phoneNumberId}/messages`,
            payload,
          },
        },
      };
    }

    // Production calls intentionally supported but OUT OF SCOPE.
    // We keep a strict guard to prevent accidental usage.
    if (!cfg.accessToken || cfg.accessToken === "skip" || !cfg.phoneNumberId || cfg.phoneNumberId === "skip") {
      return {
        ok: false,
        error: "WhatsApp Cloud API not configured (testMode=false but tokens are missing).",
      };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v23.0/${cfg.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = raw;
      }

      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          data,
          error: (data && data.error && data.error.message) ? data.error.message : "Request failed",
          raw,
        };
      }

      return { ok: true, status: res.status, data };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  }

  window.DXI_WHATSAPP_SERVICE = {
    sendWhatsAppMessage,
  };
})();

