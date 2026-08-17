import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { SCHOOLS } from '../../constants/schools';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

/* ── Queue stage definitions (in review order) ── */
const QUEUES = [
  { role: 'hod',               label: 'HOD',        color: '#a78bfa' },
  { role: 'center_head',       label: 'Center Head', color: '#e879f9' },
  { role: 'reporting_officer', label: 'Rep. Officer',color: '#c084fc' },
  { role: 'director',          label: 'Director',   color: '#fbbf24' },
  { role: 'registrar',         label: 'Registrar',  color: '#fb923c' },
  { role: 'dean',              label: 'Dean',       color: '#34d399' },
  { role: 'vc',                label: 'VC',         color: '#3b82f6' },
];

/* ── Same pipeline logic as FacultyMarksPage ── */
function getPipelineKeys(school, appraisalRole) {
  const role = appraisalRole || 'faculty';
  if (role === 'non_teaching_staff' || role === 'staff')
    return ['reporting_officer', 'registrar', 'vc', 'final'];
  if (school === 'CISR')
    return role === 'center_head' ? ['vc', 'final'] : ['center_head', 'vc', 'final'];
  if (role === 'vc')       return ['final'];
  if (role === 'dean')     return ['vc', 'final'];
  if (role === 'director') return ['dean', 'vc', 'final'];
  if (role === 'hod')      return ['director', 'dean', 'vc', 'final'];
  if (school === 'SoEMR')  return ['hod', 'director', 'dean', 'vc', 'final'];
  return ['director', 'dean', 'vc', 'final'];
}

function getWaitingRole(status, school, appraisalRole) {
  const s = (status || '').toLowerCase().trim();
  if (!s || s === 'pending') return null;
  if (s === 'reviewed' || s === 'vc reviewed') return 'final';
  if (s.includes('dean reviewed'))              return 'vc';
  if (s.includes('director reviewed'))          return 'dean';
  if (s.includes('hod reviewed'))               return 'director';
  if (s.includes('center head reviewed'))       return 'vc';
  if (s.includes('registrar reviewed'))         return 'final';
  if (s.includes('reporting officer reviewed')) return 'registrar';
  if (s.includes('vc'))         return 'vc';
  if (s.includes('dean'))       return 'dean';
  if (s.includes('director'))   return 'director';
  if (s.includes('center head') || s.includes('center_head')) return 'center_head';
  if (s.includes('registrar'))  return 'registrar';
  if (s.includes('reporting'))  return 'reporting_officer';
  if (s.includes('hod'))        return 'hod';
  if (s.includes('submitted') || s.includes('pending')) {
    return getPipelineKeys(school, appraisalRole)[0] || null;
  }
  return null;
}

function daysSince(isoStr) {
  if (!isoStr) return null;
  return Math.floor((Date.now() - new Date(isoStr).getTime()) / 86400000);
}

/* ── Days waiting badge — green < 7d, amber 7–14d, red > 14d ── */
function DaysBadge({ days }) {
  if (days === null || days === undefined)
    return <span style={{ fontSize: 10, color: C.muted }}>—</span>;
  const color = days > 14 ? '#f87171' : days > 7 ? '#fbbf24' : '#34d399';
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: `${color}14`, color, border: `1px solid ${color}30`,
      fontFamily: "'JetBrains Mono',monospace",
    }}>
      {days}d
    </span>
  );
}

/* ── Single faculty row inside a queue section ── */
function FacultyRow({ r, color }) {
  const days = daysSince(r.submitted_at);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '9px 14px', borderRadius: 8,
      background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
      marginBottom: 6,
    }}>
      {/* Name + email */}
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.name || '—'}</div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
          {r.email}
        </div>
      </div>

      {/* School badge */}
      {r.school && (
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 20,
          background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)',
          color: C.subtle, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0,
        }}>
          {r.school}
        </span>
      )}

      {/* Role + dept */}
      <span style={{ fontSize: 10, color: C.muted, textTransform: 'capitalize', flexShrink: 0 }}>
        {r.appraisal_role?.replace(/_/g, ' ')}
        {r.department ? ` · ${r.department}` : ''}
      </span>

      {/* Self score */}
      {r.grand_total > 0 && (
        <span style={{
          fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
          color: 'rgba(255,255,255,.35)', flexShrink: 0,
        }}>
          Self: {r.grand_total.toFixed(0)}
        </span>
      )}

      {/* Days waiting */}
      <DaysBadge days={days} />
    </div>
  );
}

/* ── Queue section card ── */
function QueueSection({ queue, items }) {
  const [open, setOpen] = useState(true);
  const sorted = [...items].sort((a, b) => {
    const da = daysSince(a.submitted_at) ?? -1;
    const db = daysSince(b.submitted_at) ?? -1;
    return db - da;
  });

  const maxDays = Math.max(0, ...sorted.map(r => daysSince(r.submitted_at) ?? 0));
  const urgent  = sorted.filter(r => (daysSince(r.submitted_at) ?? 0) > 14).length;

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      background: 'var(--c-card)', border: `1px solid ${queue.color}22`,
      marginBottom: 12,
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: `${queue.color}08`,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          borderBottom: open ? `1px solid ${queue.color}18` : 'none',
        }}
      >
        {/* Color dot */}
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: queue.color, flexShrink: 0,
          boxShadow: `0 0 6px ${queue.color}80`,
        }} />

        <span style={{ fontSize: 13, fontWeight: 700, color: queue.color, flex: 1, textAlign: 'left' }}>
          {queue.label} Queue
        </span>

        {/* Count pill */}
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 20,
          background: `${queue.color}18`, color: queue.color,
          border: `1px solid ${queue.color}30`,
        }}>
          {items.length} pending
        </span>

        {/* Urgent badge */}
        {urgent > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(248,113,113,.12)', color: '#f87171',
            border: '1px solid rgba(248,113,113,.25)',
          }}>
            {urgent} overdue
          </span>
        )}

        {/* Max days */}
        {maxDays > 0 && (
          <span style={{ fontSize: 10, color: C.muted }}>
            longest: <span style={{ color: maxDays > 14 ? '#f87171' : maxDays > 7 ? '#fbbf24' : '#34d399', fontWeight: 700 }}>
              {maxDays}d
            </span>
          </span>
        )}

        <span style={{
          fontSize: 10, color: C.muted,
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          display: 'inline-block', transition: 'transform .2s',
        }}>▾</span>
      </button>

      {/* Faculty list */}
      {open && (
        <div style={{ padding: '10px 12px' }}>
          {sorted.map(r => (
            <FacultyRow key={r.email} r={r} color={queue.color} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Summary count card ── */
function SummaryCard({ queue, count }) {
  if (!count) return null;
  return (
    <div style={{
      flex: '1 1 120px', padding: '14px 16px', borderRadius: 10,
      background: `${queue.color}08`, border: `1px solid ${queue.color}22`,
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26,
        fontWeight: 800, color: queue.color, lineHeight: 1 }}>
        {count}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: .5,
        textTransform: 'uppercase', color: `${queue.color}99`, marginTop: 5 }}>
        {queue.label}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function PendingReviewsPage() {
  const profile = api.getProfile();

  const [year,   setYear]   = useState('');
  const [school, setSchool] = useState('');
  const [rows,   setRows]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Fetch available years from the DB (same source as Overview)
  const { data: rawStats } = useFetch(() => api.stats.get(), []);
  const availableYears = useMemo(() => normalizeStats(rawStats).availableYears, [rawStats]);
  const effectiveYear  = year || availableYears[0] || null;

  useEffect(() => {
    if (!effectiveYear) return;
    setLoading(true);
    setError(null);
    api.marks.list(effectiveYear, school)
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [effectiveYear, school]);

  /* ── Build queue buckets ── */
  const queues = useMemo(() => {
    const buckets = {};
    for (const r of rows.filter(r => !['admin', 'super_admin'].includes(r.appraisal_role))) {
      const role = getWaitingRole(r.status, r.school, r.appraisal_role);
      if (!role || role === 'final') continue;
      if (!buckets[role]) buckets[role] = [];
      buckets[role].push(r);
    }
    return buckets;
  }, [rows]);

  const totalPending = Object.values(queues).reduce((s, arr) => s + arr.length, 0);
  const activeQueues = QUEUES.filter(q => queues[q.role]?.length > 0);

  if (!['admin', 'super_admin'].includes(profile?.appraisal_role)) return <Navigate to="/" replace />;

  return (
    <div className="page-enter">
      <PageHead
        title="Pending Reviews"
        sub="Appraisals waiting at each review stage — sorted by days waiting"
      />

      {/* ── Filters ── */}
      <Card delay={0} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: .6,
              textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              Academic Year
            </label>
            <select className="ifield" value={effectiveYear || ''} onChange={e => setYear(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)', color: C.text }}>
              {availableYears.length === 0
                ? <option value="">Loading…</option>
                : availableYears.map(y => <option key={y} value={y}>{y}</option>)
              }
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: .6,
              textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              School
            </label>
            <select className="ifield" value={school} onChange={e => setSchool(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)', color: C.text }}>
              <option value="">All Schools</option>
              {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.full}</option>)}
            </select>
          </div>

          <div style={{ fontSize: 11, color: C.muted, paddingBottom: 2, marginLeft: 'auto' }}>
            {loading ? 'Loading…' : (
              <span>
                <span style={{ fontWeight: 700, color: totalPending > 0 ? '#fbbf24' : '#34d399' }}>
                  {totalPending}
                </span> pending across {activeQueues.length} stage{activeQueues.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, fontSize: 13,
          color: C.red, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 13 }}>
          Loading…
        </div>
      ) : (
        <>
          {/* ── Summary row ── */}
          {activeQueues.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {QUEUES.map(q => (
                <SummaryCard key={q.role} queue={q} count={queues[q.role]?.length ?? 0} />
              ))}
            </div>
          )}

          {/* ── Queue sections ── */}
          {activeQueues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
              No pending reviews — all appraisals are up to date
            </div>
          ) : (
            activeQueues.map(q => (
              <QueueSection key={q.role} queue={q} items={queues[q.role]} />
            ))
          )}
        </>
      )}
    </div>
  );
}
