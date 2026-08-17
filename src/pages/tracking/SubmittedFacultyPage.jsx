import { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { AUTO_REFRESH_INTERVAL, useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import TH from '../../components/TH';
import { tdS, selS } from '../../constants/styleTokens';

export default function SubmittedFacultyPage() {
  const [year, setYear] = useState('');

  const { data: raw, loading, error } = useFetch(
    () => api.stats.get(year || undefined),
    [year],
    { interval: AUTO_REFRESH_INTERVAL },
  );
  const stats = useMemo(() => normalizeStats(raw), [raw]);
  const { totalSubmitted, pipelineEntries } = useMemo(() => ({
    totalSubmitted: stats.bySchool.reduce((s, r) => s + r.sub, 0),
    pipelineEntries: Object.entries(stats.pipeline),
  }), [stats]);

  return (
    <div className="page-enter">
      <PageHead title="Submitted Faculty" sub="Appraisal submission overview by school and status" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            {stats.availableYears.length > 0 && (
              <select value={year}
                onChange={e => setYear(e.target.value)}
                style={selS}>
                <option value="">Latest cycle</option>
                {stats.availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            <Badge color="green" dot>{totalSubmitted} submitted</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>
            <Card title="By School">
              {stats.bySchool.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
                  No data available
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['School', 'Submitted', 'Pending', 'Total'].map(h => <TH key={h}>{h}</TH>)}</tr>
                  </thead>
                  <tbody>
                    {stats.bySchool.map((s, i) => (
                      <tr key={s.name} className="tr-row" style={{ animationDelay: `${i * 40}ms` }}>
                        <td style={{ ...tdS, color: C.text, fontWeight: 600 }}>{s.name}</td>
                        <td style={tdS}><Badge color="green">{s.sub}</Badge></td>
                        <td style={tdS}><Badge color={s.pend > 0 ? 'red' : 'green'}>{s.pend}</Badge></td>
                        <td style={{ ...tdS, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {pipelineEntries.length > 0 && (
              <Card title="Review Pipeline" delay={60}>
                <div style={{ minWidth: 200 }}>
                  {pipelineEntries.map(([status, count], i) => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '9px 0',
                      borderBottom: i < pipelineEntries.length - 1 ? '1px solid var(--c-row-border)' : 'none' }}>
                      <span style={{ fontSize: 12, color: C.subtle }}>{status}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text,
                        fontFamily: "'JetBrains Mono',monospace" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
