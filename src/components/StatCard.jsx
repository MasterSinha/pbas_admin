import { C } from '../constants/colors';

export default function StatCard({ label, value, delta, color, IconC, delay = 0 }) {
  return (
    <div className="glass glass-glow stat-card card-shimmer card-appear" style={{
      padding: '20px 22px', position: 'relative', overflow: 'hidden',
      animationDelay: `${delay}ms`,
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,transparent,${color}99,transparent)`,
      }} />
      {/* Background icon */}
      <div className="float" style={{ position: 'absolute', top: -14, right: -14, opacity: .05 }}>
        <IconC size={84} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontSize: 10, color: C.muted, fontWeight: 600,
            letterSpacing: .8, textTransform: 'uppercase', marginBottom: 9,
          }}>{label}</div>
          <div className="stat-value" style={{
            fontSize: 32, fontWeight: 800, color: C.text,
            lineHeight: 1, letterSpacing: -1.2,
            animationDelay: `${delay + 80}ms`,
          }}>{value}</div>
          {delta && (
            <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 500 }}>{delta}</div>
          )}
        </div>
        <div style={{
          padding: 11, borderRadius: 11,
          background: `${color}14`, border: `1px solid ${color}25`,
          transition: 'transform .2s ease, box-shadow .2s ease',
        }}>
          <IconC size={18} stroke={color} />
        </div>
      </div>
    </div>
  );
}
