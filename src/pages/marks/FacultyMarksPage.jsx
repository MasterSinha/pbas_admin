import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { SCHOOLS } from '../../constants/schools';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';

const NT_ROLES = new Set(['non_teaching_staff', 'reporting_officer', 'registrar']);

/* ── Authority definitions ── */
const A = {
  self: { role: 'self',               label: 'Self',      color: '#94a3b8', partA: 'part_a_total',             partB: 'part_b_total',             total: 'grand_total'             },
  hod:  { role: 'hod',               label: 'HOD',       color: '#a78bfa', partA: 'hod_part_a',               partB: 'hod_part_b',               total: 'hod_total'               },
  ctr:  { role: 'center_head',       label: 'Ctr Head',  color: '#e879f9', partA: 'center_head_part_a',       partB: 'center_head_part_b',       total: 'center_head_total'       },
  dir:  { role: 'director',          label: 'Director',  color: '#fbbf24', partA: 'director_part_a',          partB: 'director_part_b',          total: 'director_total'          },
  dean: { role: 'dean',              label: 'Dean',      color: '#34d399', partA: 'dean_part_a',              partB: 'dean_part_b',              total: 'dean_total'              },
  vc:   { role: 'vc',                label: 'VC',        color: '#3b82f6', partA: 'vc_part_a',                partB: 'vc_part_b',                total: 'vc_total'                },
  ro:   { role: 'reporting_officer', label: 'Rep. Off',  color: '#a78bfa', partA: 'reporting_officer_part_a', partB: 'reporting_officer_part_b', total: 'reporting_officer_total' },
  reg:  { role: 'registrar',         label: 'Registrar', color: '#fbbf24', partA: 'registrar_part_a',         partB: 'registrar_part_b',         total: 'registrar_total'         },
};

function getAuthorities(school, appraisalRole) {
  const role = appraisalRole || 'faculty';
  if (role === 'non_teaching_staff' || role === 'staff') return [A.self, A.ro, A.reg, A.vc];
  if (role === 'reporting_officer') return [A.self, A.reg, A.vc];
  if (role === 'registrar')         return [A.self, A.vc];
  if (school === 'CISR')
    return role === 'center_head' ? [A.self, A.vc] : [A.self, A.ctr, A.vc];
  if (role === 'vc')       return [A.self];
  if (role === 'dean')     return [A.self, A.vc];
  if (role === 'director') return [A.self, A.dean, A.vc];
  if (role === 'hod')      return [A.self, A.dir, A.dean, A.vc];
  if (school === 'SoEMR')  return [A.self, A.hod, A.dir, A.dean, A.vc];
  return [A.self, A.dir, A.dean, A.vc];
}

const PS = {
  hod:               { label: 'HOD',       color: '#a78bfa' },
  center_head:       { label: 'Ctr Head',  color: '#e879f9' },
  director:          { label: 'Director',  color: '#fbbf24' },
  dean:              { label: 'Dean',      color: '#34d399' },
  reporting_officer: { label: 'Rep.Off',   color: '#a78bfa' },
  registrar:         { label: 'Registrar', color: '#fbbf24' },
  vc:                { label: 'VC',        color: '#3b82f6' },
  final:             { label: 'Final',     color: '#10b981' },
};

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

function getWaitingRole(status) {
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
  if (s.includes('submitted') || s.includes('pending')) return '__first__';
  return null;
}

function getBestScore(r) {
  const auths = getAuthorities(r.school, r.appraisal_role);
  const best  = Math.max(0, ...auths.filter(a => a.role !== 'self').map(a => r[a.total] || 0));
  return best > 0 ? best : (r.grand_total || 0);
}

function getStatusInfo(status = '') {
  const s = status.toLowerCase();
  if (s.includes('vc') || s === 'reviewed')
    return { color: '#34d399', bg: 'rgba(52,211,153,.12)',  border: 'rgba(52,211,153,.3)',  glow: 'rgba(52,211,153,.15)'  };
  if (s.includes('dean'))
    return { color: '#3b82f6', bg: 'rgba(59,130,246,.12)',  border: 'rgba(59,130,246,.3)',  glow: 'rgba(59,130,246,.12)'  };
  if (s.includes('director'))
    return { color: '#fbbf24', bg: 'rgba(251,191,36,.12)',  border: 'rgba(251,191,36,.3)',  glow: 'rgba(251,191,36,.1)'   };
  if (s.includes('hod'))
    return { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.3)', glow: 'rgba(167,139,250,.1)'  };
  if (s.includes('submitted') || s.includes('pending review'))
    return { color: '#fb923c', bg: 'rgba(251,146,60,.10)',  border: 'rgba(251,146,60,.3)',  glow: 'rgba(251,146,60,.08)'  };
  return { color: C.muted, bg: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.12)', glow: 'transparent' };
}

/* ────────────────────────────────────────────────────────────────
   SCORE BLOCK — premium glass card with Part A / Part B labels
──────────────────────────────────────────────────────────────── */
function ScoreBlock({ auth, row }) {
  const total = row[auth.total] || 0;
  const partA = row[auth.partA] || 0;
  const partB = row[auth.partB] || 0;
  const empty = !total;

  return (
    <div className="score-block" style={{
      flex: 1, minWidth: 82,
      borderRadius: 14, overflow: 'hidden',
      background: empty
        ? 'rgba(255,255,255,.02)'
        : `linear-gradient(160deg, ${auth.color}0f 0%, ${auth.color}05 100%)`,
      border: `1px solid ${empty ? 'rgba(255,255,255,.05)' : `${auth.color}22`}`,
      boxShadow: empty ? 'none' : `inset 0 1px 0 ${auth.color}15`,
    }}>
      {/* Authority label strip */}
      <div style={{
        padding: '7px 10px', textAlign: 'center',
        background: empty ? 'transparent' : `${auth.color}14`,
        borderBottom: `1px solid ${empty ? 'rgba(255,255,255,.04)' : `${auth.color}18`}`,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: empty ? 'rgba(255,255,255,.15)' : auth.color,
        }}>
          {auth.label}
        </span>
      </div>

      <div style={{ padding: '10px 11px' }}>
        {empty ? (
          <div style={{
            textAlign: 'center', padding: '12px 0',
            fontSize: 20, color: 'rgba(255,255,255,.07)', lineHeight: 1,
            fontFamily: "'JetBrains Mono',monospace",
          }}>—</div>
        ) : (
          <>
            {[['Part A', partA], ['Part B', partB]].map(([label, val]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '4px 0', marginBottom: 2,
              }}>
                <span style={{
                  fontSize: 9, color: 'rgba(255,255,255,.35)',
                  fontWeight: 600, letterSpacing: .3,
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 700, color: `${auth.color}cc`,
                }}>
                  {val.toFixed(1)}
                </span>
              </div>
            ))}

            <div style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${auth.color}25, transparent)`,
              margin: '8px 0 7px',
            }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 18, fontWeight: 800, color: auth.color, lineHeight: 1,
                textShadow: `0 0 20px ${auth.color}55`,
              }}>
                {total.toFixed(1)}
              </div>
              <div style={{
                fontSize: 8, color: `${auth.color}50`,
                letterSpacing: .9, textTransform: 'uppercase', marginTop: 4,
              }}>
                Total
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   REMARKS PANEL
──────────────────────────────────────────────────────────────── */
function RemarksPanel({ row, authorities }) {
  const reviewers = authorities.filter(a => a.role !== 'self' && row[`${a.role}_remarks`]);
  if (!reviewers.length)
    return (
      <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', padding: '4px 0' }}>
        No remarks submitted yet.
      </div>
    );

  return (
    <div className="remarks-expand" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 10,
    }}>
      {reviewers.map(a => (
        <div key={a.role} style={{
          padding: '12px 14px', borderRadius: 12,
          background: `${a.color}07`,
          border: `1px solid ${a.color}20`,
          boxShadow: `0 4px 16px ${a.color}08`,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: .9,
            textTransform: 'uppercase', color: a.color, marginBottom: 6,
          }}>
            {a.label}
          </div>
          <div style={{ fontSize: 12, color: C.subtle, lineHeight: 1.6 }}>
            {row[`${a.role}_remarks`]}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PIPELINE BAR — animated review queue
──────────────────────────────────────────────────────────────── */
function PipelineBar({ status, school, appraisalRole }) {
  const waitingRole = getWaitingRole(status);
  if (waitingRole === null) return null;

  const keys = getPipelineKeys(school, appraisalRole);
  let activeIdx = waitingRole === '__first__' ? 0
    : waitingRole === 'final'                 ? keys.length - 1
    : keys.indexOf(waitingRole);
  if (activeIdx === -1) activeIdx = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: .6,
        textTransform: 'uppercase', color: 'rgba(255,255,255,.18)',
        marginRight: 8, flexShrink: 0,
      }}>
        Queue
      </span>

      {keys.map((key, i) => {
        const stage  = PS[key];
        const done   = i < activeIdx;
        const active = i === activeIdx;

        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', flex: i < keys.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <div style={{
                width: active ? 10 : 7, height: active ? 10 : 7,
                borderRadius: '50%',
                background: done ? '#10b981' : active ? stage.color : 'rgba(255,255,255,.09)',
                border: `2px solid ${done ? '#10b981' : active ? stage.color : 'rgba(255,255,255,.12)'}`,
                boxShadow: active ? `0 0 10px ${stage.color}90, 0 0 20px ${stage.color}40` : 'none',
                transition: 'all .3s ease',
              }} />
              <span style={{
                fontSize: 8,
                fontWeight: active ? 800 : done ? 600 : 400,
                color: done ? '#10b981' : active ? stage.color : 'rgba(255,255,255,.18)',
                letterSpacing: .3, whiteSpace: 'nowrap',
              }}>
                {done ? '✓' : stage.label}
              </span>
            </div>

            {i < keys.length - 1 && (
              <div style={{
                flex: 1, height: 1.5, margin: '0 3px', marginBottom: 12, borderRadius: 2,
                background: done
                  ? 'linear-gradient(90deg, #10b981, #10b98160)'
                  : active
                    ? `linear-gradient(90deg, ${stage.color}70, rgba(255,255,255,.05))`
                    : 'rgba(255,255,255,.05)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   FACULTY CARD — premium glass card with hover lift + glow
──────────────────────────────────────────────────────────────── */
function FacultyCard({ r, index, animDelay }) {
  const [remarksOpen, setRemarksOpen] = useState(false);

  const authorities  = getAuthorities(r.school, r.appraisal_role);
  const reviewers    = authorities.filter(a => a.role !== 'self');
  const hasRemarks   = reviewers.some(a => r[`${a.role}_remarks`]);
  const hasPipeline  = getWaitingRole(r.status) !== null;
  const si           = getStatusInfo(r.status);
  const selfScore    = r.grand_total || 0;
  const bestTotal    = Math.max(0, ...reviewers.map(a => r[a.total] || 0));

  return (
    <div
      className="faculty-card"
      style={{
        borderRadius: 16, overflow: 'hidden',
        background: 'var(--c-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--c-border)',
        borderTop: `2px solid ${si.color}`,
        marginBottom: 12,
        boxShadow: `0 4px 24px rgba(0,0,0,.18), 0 0 0 0 ${si.glow}`,
        animation: `fadeUp .45s cubic-bezier(.22,1,.36,1) ${animDelay}ms both`,
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '14px 18px',
        display: 'flex', alignItems: 'flex-start', gap: 14,
        borderBottom: '1px solid rgba(255,255,255,.045)',
        background: `linear-gradient(135deg, ${si.glow}, transparent 60%)`,
      }}>
        {/* Index circle */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: `${si.color}12`,
          border: `1px solid ${si.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: si.color,
        }}>
          {index}
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: -.2 }}>
              {r.name || '—'}
            </span>
            {hasRemarks && (
              <span className="pill-pop" style={{
                fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
                background: 'rgba(59,130,246,.15)', color: '#60a5fa',
                border: '1px solid rgba(59,130,246,.25)', letterSpacing: .6,
                animationDelay: `${animDelay + 200}ms`,
              }}>
                REMARKS
              </span>
            )}
          </div>

          <div style={{
            fontSize: 10, color: C.muted,
            fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, letterSpacing: .2,
          }}>
            {r.email}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            {r.school && (
              <span style={{
                fontSize: 10, padding: '2px 9px', borderRadius: 20,
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)',
                color: C.subtle, fontFamily: "'JetBrains Mono',monospace",
              }}>
                {r.school}
              </span>
            )}
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textTransform: 'capitalize' }}>
              {r.appraisal_role?.replace(/_/g, ' ')}
              {r.department ? ` · ${r.department}` : ''}
            </span>
          </div>
        </div>

        {/* Status + score column */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            background: si.bg, color: si.color, border: `1px solid ${si.border}`,
            whiteSpace: 'nowrap', letterSpacing: .2,
            boxShadow: `0 2px 12px ${si.glow}`,
          }}>
            {r.status || 'Not Submitted'}
          </span>

          {(selfScore > 0 || bestTotal > 0) && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              {selfScore > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,.25)', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 1 }}>
                    Self
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,.35)', lineHeight: 1,
                  }}>
                    {selfScore.toFixed(1)}
                  </div>
                </div>
              )}
              {selfScore > 0 && bestTotal > 0 && (
                <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,.08)' }} />
              )}
              {bestTotal > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,.28)', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 1 }}>
                    Latest
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 20, fontWeight: 800, color: C.accent, lineHeight: 1,
                    textShadow: '0 0 16px rgba(59,130,246,.5)',
                  }}>
                    {bestTotal.toFixed(1)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Score blocks ── */}
      <div style={{ padding: '14px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {authorities.map(a => <ScoreBlock key={a.role} auth={a} row={r} />)}
      </div>

      {/* ── Pipeline ── */}
      {hasPipeline && (
        <div style={{
          padding: '10px 18px 12px',
          borderTop: '1px solid rgba(255,255,255,.04)',
          background: 'rgba(255,255,255,.01)',
        }}>
          <PipelineBar status={r.status} school={r.school} appraisalRole={r.appraisal_role} />
        </div>
      )}

      {/* ── Remarks toggle ── */}
      {hasRemarks && (
        <>
          <button
            onClick={() => setRemarksOpen(o => !o)}
            className="act-btn"
            style={{
              width: '100%', padding: '9px 18px', fontSize: 11, fontWeight: 600,
              color: remarksOpen ? '#60a5fa' : 'rgba(255,255,255,.3)',
              background: remarksOpen ? 'rgba(59,130,246,.06)' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 7,
              fontFamily: 'inherit',
              borderTop: '1px solid rgba(255,255,255,.04)',
              transition: 'color .2s ease, background .2s ease',
            }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              background: remarksOpen ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.05)',
              border: `1px solid ${remarksOpen ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, flexShrink: 0,
              transition: 'all .2s ease',
            }}>
              <span style={{
                display: 'inline-block',
                transform: remarksOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform .25s cubic-bezier(.22,1,.36,1)',
              }}>▾</span>
            </span>
            {remarksOpen ? 'Hide Remarks' : 'View Authority Remarks'}
          </button>
          {remarksOpen && (
            <div style={{ padding: '4px 18px 16px' }}>
              <RemarksPanel row={r} authorities={authorities} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   STATS BAR — glowing summary cards
──────────────────────────────────────────────────────────────── */
const STAT_DEFS = [
  { key: 'showing',   label: 'Showing',     color: '#f1f5f9', icon: '⊟' },
  { key: 'filled',    label: 'Self-Filled',  color: '#fb923c', icon: '◎' },
  { key: 'approved',  label: 'VC Approved',  color: '#34d399', icon: '◈' },
];

function StatsBar({ rows, filteredCount }) {
  const filled   = rows.filter(r => r.grand_total > 0).length;
  const approved = rows.filter(r => {
    const s = (r.status || '').toLowerCase();
    return s === 'reviewed' || s.includes('vc reviewed');
  }).length;

  const values = { showing: filteredCount, filled, approved };

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
      {STAT_DEFS.map(({ key, label, color, icon }, i) => (
        <div
          key={key}
          className="stat-enter"
          style={{
            flex: '1 1 120px', minWidth: 110,
            padding: '16px 20px', borderRadius: 16,
            background: `${color}07`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${color}18`,
            boxShadow: `0 4px 24px ${color}08, inset 0 1px 0 ${color}12`,
            animationDelay: `${i * 60}ms`,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Background glow orb */}
          <div style={{
            position: 'absolute', right: -10, top: -10,
            width: 60, height: 60, borderRadius: '50%',
            background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          }}>
            <span style={{ fontSize: 12, color: `${color}70` }}>{icon}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: .8,
              textTransform: 'uppercase', color: `${color}70`,
            }}>
              {label}
            </span>
          </div>

          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 28, fontWeight: 800, color, lineHeight: 1,
            textShadow: `0 0 24px ${color}40`,
          }}>
            {values[key]}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SKELETON LOADER — shimmer cards while loading
──────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      background: 'var(--c-card)', border: '1px solid var(--c-border)',
      borderTop: '2px solid rgba(255,255,255,.08)', marginBottom: 12, padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: '35%', borderRadius: 7, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: '55%', borderRadius: 5, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: '25%', borderRadius: 5 }} />
        </div>
        <div className="skeleton" style={{ width: 110, height: 26, borderRadius: 20, flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="skeleton" style={{ flex: 1, height: 88, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   HERO HEADER — premium gradient title with year badge
──────────────────────────────────────────────────────────────── */
function HeroHeader({ year }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      padding: '28px 0 24px', marginBottom: 20,
    }}>
      {/* Decorative background orbs */}
      <div className="orb-float" style={{
        position: 'absolute', right: '8%', top: '10%',
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="orb-float-alt" style={{
        position: 'absolute', right: '25%', bottom: '0%',
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="gradient-title" style={{
            fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1,
            marginBottom: 8,
          }}>
            Faculty Marks
          </h1>
          <p style={{
            fontSize: 13, color: C.muted, fontWeight: 500,
            animation: 'fadeUp .5s cubic-bezier(.22,1,.36,1) 100ms both',
          }}>
            Complete appraisal scores — teaching &amp; non-teaching staff
          </p>
        </div>

        {year && (
          <div className="pill-pop" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 24,
            background: 'rgba(59,130,246,.08)',
            border: '1px solid rgba(59,130,246,.2)',
            boxShadow: '0 4px 16px rgba(59,130,246,.1)',
            animationDelay: '200ms',
          }}>
            <div className="notif-dot" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#34d399', flexShrink: 0,
            }} />
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#93c5fd',
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: .4,
            }}>
              {year}
            </span>
          </div>
        )}
      </div>

      {/* Divider with gradient fade */}
      <div style={{
        marginTop: 20, height: 1,
        background: 'linear-gradient(90deg, rgba(59,130,246,.3), rgba(167,139,250,.2), transparent)',
      }} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   FILTER BAR — glass morphism with frosted inputs
──────────────────────────────────────────────────────────────── */
function FilterBar({ school, setSchool, role, setRole, search, setSearch, count, loading }) {
  const labelStyle = {
    display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: .8,
    textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 6,
  };
  const inputStyle = {
    padding: '9px 13px', borderRadius: 10, fontSize: 13,
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    color: C.text, fontFamily: 'inherit',
    outline: 'none', width: '100%',
    transition: 'border-color .18s ease, box-shadow .18s ease',
  };

  return (
    <div style={{
      padding: '18px 20px', borderRadius: 16, marginBottom: 16,
      background: 'rgba(255,255,255,.025)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,.07)',
      boxShadow: '0 4px 24px rgba(0,0,0,.12)',
      animation: 'fadeUp .38s cubic-bezier(.22,1,.36,1) 80ms both',
    }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>

        {/* School */}
        <div style={{ minWidth: 180 }}>
          <label style={labelStyle}>School</label>
          <select className="ifield" value={school}
            onChange={e => { setSchool(e.target.value); setRole(''); }}
            style={inputStyle}>
            <option value="">All Teaching Staff</option>
            {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.full}</option>)}
            <option disabled>──────────────</option>
            <option value="__nt__">Non-Teaching Staff</option>
          </select>
        </div>

        {/* Role */}
        <div style={{ minWidth: 160 }}>
          <label style={labelStyle}>Role</label>
          <select className="ifield" value={role} onChange={e => setRole(e.target.value)}
            style={inputStyle}>
            <option value="">All Roles</option>
            <option value="faculty">Faculty</option>
            <option value="hod">HOD</option>
            <option value="director">Director</option>
            <option value="dean">Dean</option>
            <option value="center_head">Center Head</option>
            <option disabled>──────────</option>
            <option value="non_teaching_staff">Non-Teaching Staff</option>
            <option value="reporting_officer">Reporting Officer</option>
            <option value="registrar">Registrar</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Search</label>
          <input className="ifield" type="text"
            placeholder="Name, email or school…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, display: 'block' }} />
        </div>

        {/* Record count chip */}
        <div style={{
          padding: '9px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,.03)',
          border: '1px solid rgba(255,255,255,.06)',
          fontSize: 12, color: C.muted, whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {loading ? (
            <>
              <div className="skeleton" style={{ width: 10, height: 10, borderRadius: '50%' }} />
              <span>Loading…</span>
            </>
          ) : (
            <>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: count > 0 ? '#34d399' : 'rgba(255,255,255,.2)',
                boxShadow: count > 0 ? '0 0 6px #34d39960' : 'none',
              }} />
              <span>
                <span style={{ fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>
                  {count}
                </span>
                {' '}record{count !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PRINT REPORT — professional A4 document
──────────────────────────────────────────────────────────────── */
function PrintReport({ rows, school, year, schoolFull, adminName, adminEmail }) {
  if (!rows.length) return null;

  const isNT  = school === '__nt__';
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const now   = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const getStatusStyle = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'reviewed' || s.includes('vc')) return { bar: '#16a34a', bg: '#dcfce7', fg: '#166534' };
    if (s.includes('dean'))                   return { bar: '#3b82f6', bg: '#dbeafe', fg: '#1e40af' };
    if (s.includes('director') || s.includes('center head')) return { bar: '#d97706', bg: '#fef3c7', fg: '#92400e' };
    if (s.includes('registrar'))              return { bar: '#7c3aed', bg: '#ede9fe', fg: '#5b21b6' };
    if (s.includes('hod') || s.includes('reporting')) return { bar: '#9333ea', bg: '#f3e8ff', fg: '#6b21a8' };
    if (s.includes('submitted') || s.includes('pending')) return { bar: '#ea580c', bg: '#ffedd5', fg: '#9a3412' };
    return { bar: '#94a3b8', bg: '#f1f5f9', fg: '#475569' };
  };

  const totalFilled   = rows.filter(r => r.grand_total > 0).length;
  const totalApproved = rows.filter(r => { const s = (r.status||'').toLowerCase(); return s === 'reviewed' || s.includes('vc'); }).length;
  const totalReview   = rows.filter(r => { const s = (r.status||'').toLowerCase(); return s && s !== 'reviewed' && !s.includes('vc') && r.grand_total > 0; }).length;

  const tdBase = {
    border: '1px solid #d1d5db', padding: '5px 8px', fontSize: 10,
    textAlign: 'center', fontFamily: 'monospace',
  };

  return (
    <div className="print-only" style={{
      display: 'none',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      color: '#0f172a',
      background: '#fff',
      fontSize: 11,
      padding: 0,
      width: '100%',
    }}>

      {/* ══════════ DOCUMENT HEADER ══════════ */}

      {/* Top accent bars */}
      <div style={{ height: 6, background: '#1e3a8a', marginBottom: 2 }} />
      <div style={{ height: 2, background: '#fbbf24', marginBottom: 0 }} />

      {/* Main header block — full-width dark background */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f8faff', border: '1px solid #dbeafe', borderTop: 'none' }}>
        <tbody>
          <tr>
            {/* Left — branding + title */}
            <td style={{ padding: '14px 18px 14px 18px', verticalAlign: 'middle', borderRight: '1px solid #dbeafe' }}>
              {/* University name */}
              <div style={{
                fontSize: 7.5, fontWeight: 800, letterSpacing: 2.2, color: '#1e40af',
                textTransform: 'uppercase', marginBottom: 6,
              }}>
                Dr. D. Y. Patil International University, Pune
              </div>

              {/* System title with large accent */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {/* Icon box */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: '#1e3a8a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 16, color: '#fff', fontWeight: 900, lineHeight: 1 }}>F</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: -.5 }}>
                    Faculty Appraisal System
                  </div>
                  <div style={{ fontSize: 9.5, color: '#475569', marginTop: 3, fontWeight: 500 }}>
                    Performance Evaluation &amp; Score Management Portal
                  </div>
                </div>
              </div>

              {/* Report subtitle pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px 4px 8px',
                background: '#1e3a8a', borderRadius: 4,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: .5 }}>
                  {isNT
                    ? 'Non-Teaching Staff · Appraisal Score Report'
                    : `${school} · ${schoolFull} · Appraisal Score Report`}
                </span>
              </div>
            </td>

            {/* Right — meta info */}
            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right', width: 210 }}>
              {/* CONFIDENTIAL */}
              <div style={{
                display: 'inline-block', padding: '3px 12px', marginBottom: 10,
                border: '1.5px solid #dc2626', borderRadius: 3,
                fontSize: 8, fontWeight: 900, color: '#dc2626',
                letterSpacing: 2.5, textTransform: 'uppercase',
              }}>
                Confidential
              </div>

              {/* Meta table */}
              <table style={{ borderCollapse: 'collapse', marginLeft: 'auto', fontSize: 9, width: '100%' }}>
                <tbody>
                  {[
                    ['Academic Year', year],
                    ['Date Generated', today],
                    ['Time', now],
                    ['Total Records', rows.length],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ color: '#64748b', paddingRight: 10, padding: '3px 10px 3px 0', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {k}
                      </td>
                      <td style={{ color: '#0f172a', fontWeight: 800, textAlign: 'left', padding: '3px 0', fontFamily: 'monospace', fontSize: 10 }}>
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Bottom accent line under header */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#1e3a8a,#3b82f6,#93c5fd,transparent)', marginBottom: 10 }} />

      {/* School + sort info strip */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
        <tbody>
          <tr>
            {[
              { label: 'School',    value: isNT ? 'All Schools (Non-Teaching)' : `${school} — ${schoolFull}` },
              { label: 'Year',      value: year },
              { label: 'Records',   value: rows.length },
              { label: 'Sorted By', value: 'Highest Marks First' },
            ].map((item, idx, arr) => (
              <td key={item.label} style={{
                padding: '7px 14px', background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRight: idx < arr.length - 1 ? 'none' : '1px solid #e2e8f0',
              }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>
                  {item.value}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* ══════════ EMPLOYEE RECORDS ══════════ */}
      {rows.map((r, i) => {
        const authorities = getAuthorities(r.school, r.appraisal_role);
        const best        = getBestScore(r);
        const ss          = getStatusStyle(r.status);
        const remarks     = authorities.filter(a => a.role !== 'self' && r[`${a.role}_remarks`]);

        return (
          <div key={r.email} style={{
            border: '1px solid #d1d5db',
            borderLeft: `4px solid ${ss.bar}`,
            borderRadius: 5,
            marginBottom: 8,
            background: '#fff',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
            overflow: 'hidden',
          }}>

            {/* ── Employee header ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '9px 12px 8px', verticalAlign: 'middle', background: `${ss.bar}08` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Rank badge */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                        background: ss.bar, color: '#fff', fontWeight: 900, fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        {/* Name + status on same line */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 3 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', letterSpacing: -.2 }}>
                            {r.name || '—'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {best > 0 && (
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 7, color: '#64748b', textTransform: 'uppercase', letterSpacing: .8 }}>Best Score</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#15803d', lineHeight: 1, fontFamily: 'monospace' }}>
                                  {best.toFixed(1)}
                                </div>
                              </div>
                            )}
                            <span style={{
                              fontSize: 8, fontWeight: 700,
                              padding: '3px 9px', borderRadius: 3,
                              background: ss.bg, color: ss.fg,
                              border: `1px solid ${ss.bar}60`,
                              whiteSpace: 'nowrap',
                            }}>
                              {r.status || 'Not Submitted'}
                            </span>
                          </div>
                        </div>
                        {/* Email + tags */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>
                            {r.email}
                          </span>
                          {r.school && (
                            <span style={{ fontSize: 8, background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>
                              {r.school}
                            </span>
                          )}
                          {r.appraisal_role && (
                            <span style={{ fontSize: 8, background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 3, fontWeight: 600, textTransform: 'capitalize' }}>
                              {r.appraisal_role.replace(/_/g, ' ')}
                            </span>
                          )}
                          {r.department && (
                            <span style={{ fontSize: 8, color: '#94a3b8' }}>· {r.department}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── Score table ── */}
            <div style={{ padding: '8px 10px 8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr>
                    <th style={{ ...tdBase, textAlign: 'left', fontFamily: 'inherit', fontWeight: 700, color: '#64748b', width: 58, background: '#f8fafc', fontSize: 9 }}>
                      Score
                    </th>
                    {authorities.map(a => (
                      <th key={a.role} style={{
                        ...tdBase, fontFamily: 'inherit', fontWeight: 900,
                        color: '#fff', fontSize: 9, letterSpacing: .7, textTransform: 'uppercase',
                        background: a.color,
                      }}>
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[['Part A', 'partA'], ['Part B', 'partB'], ['Total', 'total']].map(([rowLabel, key]) => (
                    <tr key={key}>
                      <td style={{
                        ...tdBase, textAlign: 'left', fontFamily: 'inherit',
                        fontWeight: key === 'total' ? 900 : 600,
                        color: key === 'total' ? '#0f172a' : '#374151',
                        fontSize: key === 'total' ? 10 : 9,
                        background: key === 'total' ? '#f1f5f9' : '#fafafa',
                        borderTop: key === 'total' ? '2px solid #cbd5e1' : undefined,
                      }}>
                        {rowLabel}
                      </td>
                      {authorities.map(a => {
                        const val = r[a[key]] || 0;
                        return (
                          <td key={a.role} style={{
                            ...tdBase,
                            fontWeight: key === 'total' ? 900 : 600,
                            fontSize: key === 'total' ? 13 : 10,
                            color: val > 0 ? (key === 'total' ? a.color : '#1e293b') : '#c0c7d1',
                            background: key === 'total'
                              ? (val > 0 ? `${a.color}15` : '#f8fafc')
                              : (val > 0 ? '#fff' : '#fafafa'),
                            borderTop: key === 'total' ? '2px solid #cbd5e1' : undefined,
                          }}>
                            {val > 0 ? val.toFixed(1) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Remarks ── */}
            {remarks.length > 0 && (
              <div style={{ padding: '0 12px 8px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .8, margin: '6px 0 4px' }}>
                  Reviewer Remarks
                </div>
                {remarks.map(a => (
                  <div key={a.role} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, color: a.color,
                      textTransform: 'uppercase', letterSpacing: .5, flexShrink: 0, minWidth: 55, paddingTop: 1,
                    }}>
                      {a.label}:
                    </span>
                    <span style={{ fontSize: 9, color: '#334155', lineHeight: 1.5, fontStyle: 'italic' }}>
                      &ldquo;{r[`${a.role}_remarks`]}&rdquo;
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ══════════ SUMMARY ══════════ */}
      <div style={{ marginTop: 14, marginBottom: 10 }}>
        <div style={{
          fontSize: 8, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase',
          letterSpacing: 1.5, marginBottom: 6, paddingLeft: 2,
        }}>
          ▸ Report Summary
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              {[
                { label: 'Total Records',  value: rows.length,   accent: '#1e3a8a', bg: '#eff6ff' },
                { label: 'Self-Filled',    value: totalFilled,   accent: '#c2410c', bg: '#fff7ed' },
                { label: 'Under Review',   value: totalReview,   accent: '#1d4ed8', bg: '#dbeafe' },
                { label: 'Fully Approved', value: totalApproved, accent: '#15803d', bg: '#dcfce7' },
              ].map((s, idx, arr) => (
                <td key={s.label} style={{
                  padding: '10px 16px', background: s.bg, textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  borderRight: idx < arr.length - 1 ? 'none' : '1px solid #e2e8f0',
                  borderTop: `3px solid ${s.accent}`,
                }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: s.accent, fontFamily: 'monospace', lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: .8, marginTop: 5, fontWeight: 700 }}>
                    {s.label}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <div style={{ height: 1, background: '#cbd5e1', marginBottom: 8, marginTop: 6 }} />
      <div style={{ height: 3, background: '#1e3a8a', marginBottom: 10 }} />

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'middle', color: '#64748b' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#0f172a', marginBottom: 2 }}>
                Dr. D. Y. Patil International University
              </div>
              <div style={{ color: '#64748b' }}>
                Faculty Appraisal System &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; For Internal Use Only
              </div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
              <table style={{ borderCollapse: 'collapse', marginLeft: 'auto', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: '#1e3a8a', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 900, margin: '0 auto',
                      }}>
                        {(adminName || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                    </td>
                    <td style={{ padding: '6px 12px 6px 4px', borderLeft: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 8, color: '#64748b', marginBottom: 1 }}>Printed by</div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', marginBottom: 1 }}>
                        {adminName || 'Administrator'}
                      </div>
                      <div style={{ fontSize: 9, color: '#1e40af', fontFamily: 'monospace', marginBottom: 1 }}>
                        {adminEmail}
                      </div>
                      <div style={{ fontSize: 8, color: '#94a3b8' }}>
                        {today} &nbsp;·&nbsp; {now}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────────── */
export default function FacultyMarksPage() {
  const profile = api.getProfile();

  const [school, setSchool] = useState('');
  const [role,   setRole]   = useState('');
  const [search, setSearch] = useState('');
  const [rows,   setRows]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const { data: rawStats } = useFetch(() => api.stats.get(), []);
  const effectiveYear = useMemo(() => normalizeStats(rawStats).availableYears[0] ?? null, [rawStats]);

  useEffect(() => {
    if (!effectiveYear) return;
    setLoading(true);
    setError(null);
    const schoolParam = school === '__nt__' ? '' : school;
    api.marks.list(effectiveYear, schoolParam)
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [effectiveYear, school]);

  const filtered = useMemo(() => {
    let result = rows.filter(r => !['admin', 'super_admin'].includes(r.appraisal_role));
    if (school === '__nt__')
      result = result.filter(r => NT_ROLES.has(r.appraisal_role));
    if (role)
      result = result.filter(r => r.appraisal_role === role);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.name?.toLowerCase().includes(q)  ||
        r.email?.toLowerCase().includes(q) ||
        r.school?.toLowerCase().includes(q)
      );
    }
    if (school && school !== '__nt__')
      result = [...result].sort((a, b) => getBestScore(b) - getBestScore(a));
    return result;
  }, [rows, search, school, role]);

  if (!['admin', 'super_admin'].includes(profile?.appraisal_role)) return <Navigate to="/" replace />;

  const schoolFull = SCHOOLS.find(s => s.code === school)?.full ?? school;

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm 4mm 6mm 2mm; }
          :root, html, html[data-theme="dark"], html[data-theme="light"] {
            color-scheme: light !important;
            --c-bg: #ffffff !important;
            --c-surf: #ffffff !important;
            --c-card: #ffffff !important;
            --c-sidebar-bg: #ffffff !important;
            --c-input-bg: #ffffff !important;
            --c-select-bg: #ffffff !important;
            --c-soft-bg: #ffffff !important;
            --c-skeleton-a: #f1f5f9 !important;
            --c-skeleton-b: #e2e8f0 !important;
          }
          body, html { background: #fff !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
          aside { display: none !important; }
          main { overflow: visible !important; padding: 0 !important; margin: 0 !important; width: 100% !important; background: #fff !important; scrollbar-gutter: auto !important; border: none !important; box-shadow: none !important; }
          div[style*="height: 100vh"] { display: block !important; overflow: visible !important; height: auto !important; background: #fff !important; border: none !important; box-shadow: none !important; }
          .page-enter { max-width: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; width: 100% !important; padding: 0 !important; }
          [style*="position: fixed"] { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* ── Print-only professional report ── */}
      <PrintReport
        rows={filtered}
        school={school}
        year={effectiveYear}
        schoolFull={schoolFull}
        adminName={profile?.full_name}
        adminEmail={profile?.email}
      />

      <div className="no-print">
        <HeroHeader year={effectiveYear} />
      </div>

      <div className="no-print">
        <FilterBar
          school={school} setSchool={setSchool}
          role={role}     setRole={setRole}
          search={search} setSearch={setSearch}
          count={filtered.length}
          loading={loading}
        />
      </div>

      {/* ── Print button — visible only when a specific school is selected ── */}
      {school && school !== '__nt__' && !loading && filtered.length > 0 && (
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={() => window.print()}
            className="act-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, letterSpacing: .3,
              background: 'rgba(59,130,246,.1)',
              border: '1px solid rgba(59,130,246,.28)',
              color: '#93c5fd',
              transition: 'background .18s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print {school} Report
          </button>
        </div>
      )}

      {error && (
        <div className="no-print" style={{
          marginBottom: 14, padding: '14px 18px', borderRadius: 12, fontSize: 13,
          color: '#f87171',
          background: 'rgba(248,113,113,.07)',
          border: '1px solid rgba(248,113,113,.2)',
          backdropFilter: 'blur(12px)',
          animation: 'scaleIn .2s ease both',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="no-print">
          {[1, 2, 3].map(n => <SkeletonCard key={n} />)}
        </div>
      ) : (
        <>
          {rows.length > 0 && (
            <div className="no-print">
              <StatsBar rows={rows} filteredCount={filtered.length} />
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="no-print" style={{
              textAlign: 'center', padding: '64px 0',
              animation: 'fadeUp .4s ease both',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: 'rgba(255,255,255,.2)',
              }}>
                ◎
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginBottom: 6 }}>
                {rows.length === 0 ? 'No records found' : 'No records match your filters'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>
                {rows.length > 0 ? 'Try adjusting the school, role or search term' : 'Check the selected academic year'}
              </div>
            </div>
          ) : (
            <div className="no-print">
              {filtered.map((r, i) => (
                <FacultyCard
                  key={r.email}
                  r={r}
                  index={i + 1}
                  animDelay={Math.min(i * 40, 400)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
