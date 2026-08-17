const BADGE_COLORS = {
  green:  { bg: 'rgba(52,211,153,.12)',  tx: '#34d399', bd: 'rgba(52,211,153,.25)'  },
  red:    { bg: 'rgba(248,113,113,.12)', tx: '#f87171', bd: 'rgba(248,113,113,.25)' },
  yellow: { bg: 'rgba(251,191,36,.12)',  tx: '#fbbf24', bd: 'rgba(251,191,36,.25)'  },
  blue:   { bg: 'rgba(59,130,246,.12)',  tx: '#60a5fa', bd: 'rgba(59,130,246,.25)'  },
  gray:   { bg: 'rgba(148,163,184,.08)', tx: '#94a3b8', bd: 'rgba(148,163,184,.18)' },
  purple: { bg: 'rgba(129,140,248,.12)', tx: '#a5b4fc', bd: 'rgba(129,140,248,.25)' },
  orange: { bg: 'rgba(251,146,60,.12)',  tx: '#fb923c', bd: 'rgba(251,146,60,.25)'  },
};

export default function Badge({ children, color = 'blue', dot = false }) {
  const s = BADGE_COLORS[color] || BADGE_COLORS.gray;
  return (
    <span className="badge-appear" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: .4,
      background: s.bg, color: s.tx, border: `1px solid ${s.bd}`,
    }}>
      {dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: s.tx, flexShrink: 0,
          animation: 'glowPulse 2.5s ease-in-out infinite',
        }} />
      )}
      {children}
    </span>
  );
}
