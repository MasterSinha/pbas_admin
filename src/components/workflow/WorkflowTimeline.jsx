import { C } from '../../constants/colors';

// ── Status configuration — extend here as new statuses are added ──────────────
const STATUS_META = {
  APPROVED:  { color: '#34d399', icon: '✓', label: 'Approved'  },
  PENDING:   { color: '#fbbf24', icon: '…', label: 'Pending'   },
  WAITING:   { color: 'rgba(255,255,255,.2)', icon: '○', label: 'Waiting'   },
  REJECTED:  { color: '#f87171', icon: '✕', label: 'Rejected'  },
  COMPLETED: { color: '#34d399', icon: '✓', label: 'Completed' },
};
const DEFAULT_META = { color: C.muted, icon: '?', label: 'Unknown' };

// ── WorkflowStatusBadge ───────────────────────────────────────────────────────
export function WorkflowStatusBadge({ status }) {
  const m = STATUS_META[status?.toUpperCase()] ?? DEFAULT_META;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: `${m.color}14`, color: m.color, border: `1px solid ${m.color}30`,
      fontFamily: "'JetBrains Mono',monospace", letterSpacing: .3, flexShrink: 0,
    }}>
      <span style={{ fontSize: 8 }}>{m.icon}</span>
      {m.label}
    </span>
  );
}

// ── Single step row ───────────────────────────────────────────────────────────
function StepRow({ stepNo, designation, status, isCurrent, isLast, stepColors }) {
  const m     = STATUS_META[status?.toUpperCase()] ?? DEFAULT_META;
  const color = isCurrent ? m.color : m.color;
  const dim   = status?.toUpperCase() === 'WAITING';

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {/* Left: dot + connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800,
          background: dim ? 'rgba(255,255,255,.04)' : `${color}18`,
          border: `2px solid ${dim ? 'rgba(255,255,255,.1)' : color}`,
          color: dim ? 'rgba(255,255,255,.2)' : color,
          boxShadow: isCurrent ? `0 0 10px ${color}40` : 'none',
          transition: 'all .2s',
        }}>
          {m.icon}
        </div>
        {!isLast && (
          <div style={{
            width: 1.5, flex: 1, minHeight: 16, marginTop: 3,
            background: dim
              ? 'rgba(255,255,255,.06)'
              : `linear-gradient(to bottom, ${color}50, rgba(255,255,255,.05))`,
          }} />
        )}
      </div>

      {/* Right: content */}
      <div style={{ paddingBottom: isLast ? 0 : 14, flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: isCurrent ? 700 : 600,
            color: dim ? 'rgba(255,255,255,.3)' : color,
            whiteSpace: 'nowrap',
          }}>
            {designation || `Step ${stepNo}`}
          </span>

          {isCurrent && (
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 10,
              background: `${color}18`, color, border: `1px solid ${color}30`,
              textTransform: 'uppercase', letterSpacing: .5,
            }}>
              Current
            </span>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <WorkflowStatusBadge status={status} />
          </div>
        </div>

        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
          Step {stepNo}
        </div>
      </div>
    </div>
  );
}

// ── Staff submitter row (step 0) ──────────────────────────────────────────────
function SubmitterRow({ isLast }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800,
          background: `${C.accent}18`, border: `2px solid ${C.accent}`,
          color: C.accent,
        }}>
          ✎
        </div>
        {!isLast && (
          <div style={{
            width: 1.5, flex: 1, minHeight: 16, marginTop: 3,
            background: `linear-gradient(to bottom, ${C.accent}50, rgba(255,255,255,.05))`,
          }} />
        )}
      </div>
      <div style={{ paddingBottom: 14, paddingTop: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.accent }}>Staff</span>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Fills &amp; submits form</div>
      </div>
    </div>
  );
}

// ── WorkflowTimeline ──────────────────────────────────────────────────────────
/**
 * Renders a dynamic NT approval chain.
 *
 * Props:
 *   steps      — Array<{ stepNo, designation, status }>  (from API or hook)
 *   currentStep — number | null  (which step is currently active)
 *   loading    — boolean
 *   showStaff  — boolean  (prepend a "Staff (submitter)" row)
 */
export default function WorkflowTimeline({ steps = [], currentStep = null, loading = false, showStaff = false }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton" style={{
            height: 36, borderRadius: 8,
            animationDelay: `${i * 80}ms`,
          }} />
        ))}
      </div>
    );
  }

  if (!steps.length) {
    return (
      <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: '12px 0', lineHeight: 1.7 }}>
        Select a role to see<br />the approval workflow
      </div>
    );
  }

  return (
    <div>
      {showStaff && <SubmitterRow isLast={false} />}
      {steps.map((s, i) => (
        <StepRow
          key={s.stepNo ?? i}
          stepNo={s.stepNo ?? i + 1}
          designation={s.designation}
          status={s.status ?? 'WAITING'}
          isCurrent={currentStep != null && s.stepNo === currentStep}
          isLast={i === steps.length - 1}
        />
      ))}
    </div>
  );
}
