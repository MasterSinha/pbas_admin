import { useState, useCallback, useMemo } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeUsers, normalizeStats } from '../../api/normalizers';
import { AUTO_REFRESH_INTERVAL, useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, tdS, selS } from '../../constants/styleTokens';
import { ALL_SCHOOL_CODES } from '../../constants/schools';
import { I } from '../../components/icons';
import Badge from '../../components/Badge';
import Av from '../../components/Av';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import LiveBadge from '../../components/LiveBadge';
import TH from '../../components/TH';

export default function PendingFacultyPage() {
  const [year, setYear]     = useState('');   // '' = use latest from stats
  const [school, setSchool] = useState('All');
  const [search, setSearch] = useState('');
  const [tick, setTick]     = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  // Fetch stats first to get available years
  const { data: rawStats, loading: statsLoading } = useFetch(() => api.stats.get(), [], { interval: AUTO_REFRESH_INTERVAL });
  const availableYears = useMemo(() => normalizeStats(rawStats).availableYears, [rawStats]);

  // academic_year is REQUIRED by the backend — resolve to latest if user hasn't picked one
  const effectiveYear = year || availableYears[0] || null;

  // Only call pending-faculty once we have a year
  const { data: rawPending, loading: pendingLoading, error: pendingError, lastUpdated } = useFetch(
    () => effectiveYear
      ? api.pending.list({ academic_year: effectiveYear })
      : Promise.resolve(null),
    [effectiveYear, tick],
    { interval: AUTO_REFRESH_INTERVAL },
  );

  const loading = statsLoading || pendingLoading;
  const pending = useMemo(() => normalizeUsers(rawPending ?? []), [rawPending]);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return pending.filter(f =>
      (school === 'All' || f.school === school) &&
      (f.name.toLowerCase().includes(q) ||
       f.email.toLowerCase().includes(q) ||
       f.dept.toLowerCase().includes(q))
    );
  }, [pending, school, search]);

  const bySchool = useMemo(() =>
    ALL_SCHOOL_CODES
      .map(s => ({ name: s, count: pending.filter(f => f.school === s).length }))
      .filter(s => s.count > 0),
  [pending]);

  return (
    <div className="page-enter">
      <PageHead
        title="Pending Faculty"
        sub={loading ? 'Loading…' : `${rows.length} faculty yet to submit`}
        action={<LiveBadge lastUpdated={lastUpdated} />}
      />

      {loading && <Loading />}
      {pendingError && <ApiError message={pendingError} />}

      {!loading && !pendingError && !effectiveYear && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: C.muted, fontSize: 13 }}>
          No appraisal cycle data available yet.
        </div>
      )}

      {!loading && !pendingError && effectiveYear && (
        <>
          {/* ── Toolbar ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {availableYears.length > 0 && (
              <select value={year} onChange={e => setYear(e.target.value)} style={selS}>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}

            <select value={school} onChange={e => setSchool(e.target.value)} style={selS}>
              <option value="All">All Schools</option>
              {ALL_SCHOOL_CODES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', opacity: .35 }}>
                <I.search size={13} />
              </div>
              <input className="ifield" placeholder="Search name, email, department…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inp, paddingLeft: 34 }} />
            </div>

            <Badge color="red" dot>{pending.length} pending</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: 14, alignItems: 'start' }}>
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Faculty', 'School', 'Department', 'Role'].map(h => <TH key={h}>{h}</TH>)}</tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ ...tdS, textAlign: 'center', padding: '20px 0', color: C.muted }}>
                          {pending.length === 0 ? 'All faculty have submitted' : 'No records match the filter'}
                        </td>
                      </tr>
                    ) : rows.map((f, i) => (
                      <tr key={f.id} className="tr-row" style={{ animationDelay: `${i * 30}ms` }}>
                        <td style={tdS}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Av init={f.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                                color={C.red} size={28} />
                            <div>
                              <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{f.name}</div>
                              <div style={{ fontSize: 10, color: C.muted }}>{f.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdS, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{f.school}</td>
                        <td style={{ ...tdS, fontSize: 12 }}>{f.dept}</td>
                        <td style={tdS}><Badge color="red">{f.role}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="By School" delay={60}>
              {bySchool.length === 0 ? (
                <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '8px 0' }}>
                  No pending faculty
                </div>
              ) : bySchool.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '8px 0',
                  borderBottom: i < bySchool.length - 1 ? '1px solid var(--c-row-border)' : 'none' }}>
                  <span style={{ fontSize: 12, color: C.subtle,
                    fontFamily: "'JetBrains Mono',monospace" }}>{s.name}</span>
                  <Badge color="red">{s.count}</Badge>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
