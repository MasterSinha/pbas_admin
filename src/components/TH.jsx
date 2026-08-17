import { C } from '../constants/colors';

export default function TH({ children }) {
  return (
    <th style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: C.muted, padding: "8px 12px", letterSpacing: .8, textTransform: "uppercase", borderBottom: "1px solid var(--c-divider)", background: "var(--c-soft-bg)" }}>
      {children}
    </th>
  );
}
