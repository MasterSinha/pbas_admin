const KEY = 'dyp_security_events';
const MAX = 1000;

export function logSecurityEvent(type, endpoint, statusCode, detail, email = null) {
  try {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,         // 'unauthorized' | 'forbidden' | 'rate_limited' | 'login_failed'
      endpoint,
      statusCode,
      detail,
      email,
      at: new Date().toISOString(),
    };
    const existing = getSecurityLog();
    localStorage.setItem(KEY, JSON.stringify([entry, ...existing].slice(0, MAX)));
  } catch {}
}

export function getSecurityLog() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function clearSecurityLog() {
  localStorage.removeItem(KEY);
}
