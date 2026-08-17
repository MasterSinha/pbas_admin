import { C } from '../constants/colors';

export default function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.surf,
      border: '1px solid var(--c-border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 12px 36px var(--c-stat-shadow)',
      backdropFilter: 'blur(12px)',
      animation: 'scaleIn .14s cubic-bezier(.22,1,.36,1) both',
    }}>
      {label && (
        <div style={{ color: C.subtle, marginBottom: 7, fontWeight: 600, fontSize: 11, letterSpacing: .4 }}>
          {label}
        </div>
      )}
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || C.text, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color || C.accent, flexShrink: 0 }} />
          <span style={{ color: C.muted }}>{p.name}:</span>
          <strong style={{ color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}
