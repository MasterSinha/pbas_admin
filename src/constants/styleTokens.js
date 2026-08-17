import { C } from './colors';

export const inp = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--c-input-border)",
  background: "var(--c-input-bg)",
  fontSize: 13,
  color: C.text,
  fontFamily: "inherit",
};

export const lbl = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: C.muted,
  marginBottom: 5,
  letterSpacing: .6,
  textTransform: "uppercase",
};

export const tdS = {
  padding: "11px 12px",
  fontSize: 13,
  color: C.subtle,
  borderBottom: "1px solid var(--c-row-border)",
  verticalAlign: "middle",
};

export const pBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 18px",
  background: "linear-gradient(135deg,#3b82f6,#2563eb)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: .2,
  boxShadow: "0 4px 14px rgba(59,130,246,.28)",
  transition: "filter .15s ease, transform .15s cubic-bezier(.22,1,.36,1), box-shadow .15s ease",
  willChange: "transform",
  position: "relative",
  overflow: "hidden",
};

export const oBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 18px",
  background: "transparent",
  color: C.subtle,
  border: "1px solid var(--c-btn-border)",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  transition: "background .15s ease, border-color .15s ease, color .15s ease",
};

export const smBtn = {
  padding: "5px 12px",
  background: "var(--c-soft-bg)",
  color: C.subtle,
  border: "1px solid var(--c-btn-border)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
};

export const selS = {
  padding: "7px 12px",
  borderRadius: 8,
  border: "1px solid var(--c-input-border)",
  background: "var(--c-input-bg)",
  color: "var(--c-text)",
  fontSize: 12,
  cursor: "pointer",
};

export function rateColor(pct) {
  if (pct >= .8) return { bar: `linear-gradient(90deg,${C.green},#059669)`,  badge: 'green'  };
  if (pct >= .6) return { bar: `linear-gradient(90deg,${C.accent},#2563eb)`, badge: 'blue'   };
  return              { bar: `linear-gradient(90deg,${C.yellow},#d97706)`, badge: 'yellow' };
}
