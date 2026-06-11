// ── Safe localStorage wrapper — never crashes ─────────────────────────────

export const KEYS = {
  orders:    'dxi_orders_v1',
  farmers:   'dxi_farmers_v1',
  crates:    'dxi_crates_v1',
  session:   'dxi_session_v1',
  mmSession: 'dxi_mm_session_v1',
  locations: 'dxi_mm_locations_v1',
};

export function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[storage] readLocal failed:', key, e);
    return null;
  }
}

export function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[storage] writeLocal failed:', key, e);
  }
}

export function removeLocal(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('[storage] removeLocal failed:', key, e);
  }
}
