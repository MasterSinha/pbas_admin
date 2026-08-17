import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { AUTO_REFRESH_INTERVAL, useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, smBtn, rateColor } from '../../constants/styleTokens';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import LiveBadge from '../../components/LiveBadge';
import ProgressBar from '../../components/ProgressBar';
import ChartTip from '../../components/ChartTip';
import { I } from '../../components/icons';

// ── Stage configs ─────────────────────────────────────────────────────────────

const T_STAGES = [
  { key: 'Submitted',               label: 'Submitted',      color: C.accent  },
  { key: 'Pending Review',          label: 'HOD Review',     color: '#a78bfa' },
  { key: 'Pending Director Review', label: 'Director',       color: C.yellow  },
  { key: 'Pending Dean Review',     label: 'Dean',           color: C.green   },
  { key: 'Pending VC Review',       label: 'VC Queue',       color: '#f472b6' },
  { key: 'Reviewed',                label: 'Approved',       color: '#22d3ee' },
];

const NT_STAGES = [
  { key: 'Draft',                      label: 'Submitted',    color: C.accent  },
  { key: 'Reporting Officer Reviewed', label: 'RO Reviewed',  color: '#a78bfa' },
  { key: 'Registrar Reviewed',         label: 'Registrar',    color: C.yellow  },
  { key: 'VC Approved',                label: 'VC Approved',  color: '#22d3ee' },
];

const ROLE_COLORS = {
  faculty:            C.accent,
  hod:                '#a78bfa',
  director:           C.yellow,
  dean:               C.green,
  registrar:          '#22d3ee',
  vc:                 '#f472b6',
  non_teaching_staff: C.orange,
  reporting_officer:  '#fb923c',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function fmtRole(r) {
  return r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPI({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="glass card-appear" style={{
      padding: '18px 20px', borderRadius: 12, position: 'relative', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,.06)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,transparent,${color}80,transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: .7,
            textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1,
            letterSpacing: -1, fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
        </div>
        <div style={{ padding: 10, borderRadius: 10,
          background: `${color}14`, border: `1px solid ${color}25` }}>
          <Icon size={17} stroke={color} />
        </div>
      </div>
    </div>
  );
}

function PipelineList({ pipeline, stages }) {
  const total = Object.values(pipeline).reduce((s, n) => s + (n ?? 0), 0);
  if (total === 0) return (
    <div style={{ textAlign: 'center', padding: '28px 0', color: C.muted, fontSize: 13 }}>
      No submissions yet
    </div>
  );
  return stages.map(({ key, label, color }) => {
    const n   = pipeline[key] ?? 0;
    const pct = total ? n / total : 0;
    return (
      <div key={key} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.subtle, fontWeight: 500 }}>{label}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text,
              fontFamily: "'JetBrains Mono',monospace" }}>{n}</span>
            <span style={{ fontSize: 10, color: C.muted, minWidth: 30, textAlign: 'right' }}>
              {Math.round(pct * 100)}%
            </span>
          </div>
        </div>
        <ProgressBar value={pct * 100} color={color} />
      </div>
    );
  });
}

function InsightChip({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
      borderRadius: 8, background: `${color}0d`, border: `1px solid ${color}22` }}>
      <Icon size={13} stroke={color} />
      <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace",
        marginLeft: 'auto' }}>{value}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [year, setYear]             = useState('');
  const [downloading, setDownloading] = useState(null);
  const [downloadErr, setDownloadErr] = useState(null);

  const { data: raw, loading, error, lastUpdated } = useFetch(
    () => api.stats.get(year || undefined),
    [year],
    { interval: AUTO_REFRESH_INTERVAL },
  );
  const stats = normalizeStats(raw);
  const { bySchool, pipeline, nonTeachingPipeline, byRole } = stats;

  const rate       = stats.total ? Math.round(stats.submitted / stats.total * 100) : 0;
  const tTotal     = Object.values(pipeline).reduce((s, n) => s + (n ?? 0), 0);
  const ntTotal    = Object.values(nonTeachingPipeline).reduce((s, n) => s + (n ?? 0), 0);
  const approved   = (pipeline['Reviewed'] ?? 0) + (nonTeachingPipeline['VC Approved'] ?? 0);

  const sortedSchools = [...bySchool].sort((a, b) =>
    (b.total ? b.sub / b.total : 0) - (a.total ? a.sub / a.total : 0)
  );
  const topSchool    = sortedSchools[0];
  const bottomSchool = sortedSchools[sortedSchools.length - 1];

  const roleData = Object.entries(byRole ?? {})
    .filter(([role]) => role !== 'admin')
    .map(([role, count]) => ({ name: fmtRole(role), value: count, color: ROLE_COLORS[role] ?? C.muted }))
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const handleExport = async (type) => {
    setDownloading(type); setDownloadErr(null);
    const params = year ? { academic_year: year } : {};
    try {
      const blob = await api.export[type](params);
      triggerDownload(blob, `${type}-${year || 'latest'}.csv`);
    } catch (e) {
      setDownloadErr(e.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="page-enter">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <PageHead title="Analytics & Reports" sub="Cycle-level insights, pipeline health and exports" action={<LiveBadge lastUpdated={lastUpdated} />} />
        <select value={year} onChange={e => setYear(e.target.value)}
          style={{ ...inp, width: 'auto', minWidth: 140, cursor: 'pointer', fontSize: 12, marginTop: 4 }}>
          <option value="">Latest cycle</option>
          {(stats.availableYears ?? []).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <>
          {/* ── KPI row ──────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <KPI label="Total Faculty"     value={stats.total}    sub="Registered"                     color={C.accent} icon={I.users}  />
            <KPI label="Submitted"         value={stats.submitted} sub={`${rate}% completion`}          color={C.green}  icon={I.check}  />
            <KPI label="Pending"           value={stats.pending}   sub="Yet to submit"                  color={C.red}    icon={I.clock}  />
            <KPI label="Fully Approved"    value={approved}        sub="Teaching + Non-Teaching"        color='#22d3ee'  icon={I.shield} />
          </div>

          {/* ── Insights bar ─────────────────────────────────────────────── */}
          {bySchool.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <InsightChip icon={I.star}   label="Top school"     color={C.green}
                value={topSchool ? `${topSchool.name} · ${Math.round(topSchool.sub / (topSchool.total || 1) * 100)}%` : '—'} />
              <InsightChip icon={I.clock}  label="Needs attention" color={C.red}
                value={bottomSchool ? `${bottomSchool.name} · ${Math.round(bottomSchool.sub / (bottomSchool.total || 1) * 100)}%` : '—'} />
              <InsightChip icon={I.chart}  label="Teaching pipeline" color={C.accent}
                value={`${tTotal} in-progress`} />
              {ntTotal > 0 && (
                <InsightChip icon={I.doc} label="Non-teaching pipeline" color={C.yellow}
                  value={`${ntTotal} in-progress`} />
              )}
            </div>
          )}

          {/* ── Pipelines ────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="Teaching Pipeline" sub="Forms by review stage" delay={0}>
              <PipelineList pipeline={pipeline} stages={T_STAGES} />
            </Card>

            <Card title="Non-Teaching Pipeline" sub="Staff forms by review stage" delay={60}>
              <PipelineList pipeline={nonTeachingPipeline} stages={NT_STAGES} />
            </Card>
          </div>

          {/* ── School performance ───────────────────────────────────────── */}
          {bySchool.length > 0 && (
            <Card title="School Performance" sub="Submitted vs pending — all schools" delay={80} style={{ marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>

                {/* Horizontal stacked bar chart */}
                <ResponsiveContainer width="100%" height={bySchool.length * 44 + 20}>
                  <BarChart layout="vertical" data={bySchool}
                    margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }}
                      axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={58}
                      tick={{ fill: C.subtle, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="sub"  name="Submitted" fill={C.accent}              radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="pend" name="Pending"   fill="rgba(248,113,113,.25)" radius={[0, 4, 4, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Completion rates */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .7,
                    textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6,
                    borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    Completion Rate
                  </div>
                  {sortedSchools.map((s, i) => {
                    const pct = s.total ? s.sub / s.total : 0;
                    const { badge } = rateColor(pct);
                    return (
                      <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '7px 0',
                        borderBottom: i < sortedSchools.length - 1 ? '1px solid var(--c-row-border)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace",
                            minWidth: 14, textAlign: 'right' }}>#{i + 1}</span>
                          <span style={{ fontSize: 12, color: C.subtle,
                            fontFamily: "'JetBrains Mono',monospace" }}>{s.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 10, color: C.muted,
                            fontFamily: "'JetBrains Mono',monospace" }}>{s.sub}/{s.total}</span>
                          <Badge color={badge}>{Math.round(pct * 100)}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* ── Role distribution + Export ───────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Role distribution */}
            <Card title="Role Distribution" sub="Faculty breakdown by role" delay={100}>
              {roleData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: C.muted, fontSize: 13 }}>
                  No role data
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={roleData} cx="50%" cy="50%" innerRadius={42} outerRadius={70}
                        dataKey="value" strokeWidth={0} paddingAngle={2}>
                        {roleData.map((r, i) => <Cell key={i} fill={r.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    {roleData.map((r, i) => (
                      <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 0',
                        borderBottom: i < roleData.length - 1 ? '1px solid var(--c-row-border)' : 'none' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%',
                          background: r.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: C.subtle, flex: 1 }}>{r.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text,
                          fontFamily: "'JetBrains Mono',monospace" }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Export */}
            <Card title="Export Reports" sub="Download data as CSV" delay={100}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .7,
                  textTransform: 'uppercase', marginBottom: 8 }}>Academic Year</div>
                <select value={year} onChange={e => setYear(e.target.value)}
                  style={{ ...inp, fontSize: 12, cursor: 'pointer' }}>
                  <option value="">Latest cycle</option>
                  {(stats.availableYears ?? []).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {[
                { key: 'submissions', label: 'Submission Report',
                  desc: 'All declarations with current review stage', icon: I.doc  },
                { key: 'faculty',     label: 'Faculty Export',
                  desc: 'Faculty list with school, role and status',  icon: I.users },
              ].map((e, i) => (
                <div key={e.key} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '13px 0',
                  borderBottom: i === 0 ? '1px solid var(--c-divider)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: 'var(--c-soft-bg)', border: '1px solid var(--c-divider)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <e.icon size={15} stroke={C.muted} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{e.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{e.desc}</div>
                    </div>
                  </div>
                  <button className="act-btn" disabled={downloading === e.key}
                    onClick={() => handleExport(e.key)}
                    style={{ ...smBtn, display: 'flex', alignItems: 'center', gap: 5,
                      opacity: downloading === e.key ? .5 : 1 }}>
                    <I.dl size={12} />
                    {downloading === e.key ? '…' : 'CSV'}
                  </button>
                </div>
              ))}

              {downloadErr && (
                <div style={{ marginTop: 12, fontSize: 12, color: C.red }}>{downloadErr}</div>
              )}

              <div style={{ marginTop: 14, padding: '9px 12px', borderRadius: 7, fontSize: 11,
                color: C.yellow, background: 'rgba(251,191,36,.07)',
                border: '1px solid rgba(251,191,36,.18)', lineHeight: 1.55 }}>
                Export endpoints are pending backend implementation. CSV buttons will activate once
                <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, margin: '0 3px' }}>
                  /admin/export/*
                </code>
                is deployed.
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
