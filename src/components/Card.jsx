import { useState, memo } from 'react';
import { C } from '../constants/colors';

const Card = memo(function Card({ title, sub, action, info, children, style = {}, delay = 0 }) {
  const [tip, setTip] = useState(false);

  return (
    <div className="glass glass-glow card-shimmer card-appear" style={{ padding: '20px 22px', animationDelay: `${delay}ms`, ...style }}>
      {(title || action) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, paddingBottom: 13,
          borderBottom: '1px solid var(--c-divider)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
              {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
            </div>

            {info && (
              <div
                style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}
                onMouseEnter={() => setTip(true)}
                onMouseLeave={() => setTip(false)}
              >
                <div style={{
                  width: 17, height: 17, borderRadius: '50%', cursor: 'help',
                  background: tip ? `${C.accent}18` : 'var(--c-soft-bg)',
                  border: `1px solid ${tip ? `${C.accent}40` : 'var(--c-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  color: tip ? C.accent : C.muted,
                  transition: 'all .15s',
                  userSelect: 'none',
                }}>
                  i
                </div>

                {tip && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 600,
                    width: 230, padding: '11px 13px', borderRadius: 10,
                    background: 'var(--c-surf)',
                    border: '1px solid var(--c-border)',
                    boxShadow: '0 16px 40px var(--c-shadow)',
                    fontSize: 11.5, color: C.subtle, lineHeight: 1.7,
                    animation: 'fadeIn .12s ease',
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      position: 'absolute', top: -5, left: 7,
                      width: 8, height: 8, borderRadius: 1,
                      background: 'var(--c-surf)',
                      border: '1px solid var(--c-border)',
                      transform: 'rotate(45deg)',
                      borderBottom: 'none', borderRight: 'none',
                    }} />
                    {info}
                  </div>
                )}
              </div>
            )}
          </div>

          {action}
        </div>
      )}
      {children}
    </div>
  );
});

export default Card;
