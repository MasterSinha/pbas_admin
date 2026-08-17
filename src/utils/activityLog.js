const KEY = 'dyp_admin_activity';
const MAX = 500;

export function logAction(type, title, detail, meta = {}) {
  try {
    const entry = { id: Date.now(), type, title, detail, meta, at: new Date().toISOString() };
    const existing = getLog();
    localStorage.setItem(KEY, JSON.stringify([entry, ...existing].slice(0, MAX)));
  } catch {}
}

export function getLog() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function clearLog() {
  localStorage.removeItem(KEY);
}
