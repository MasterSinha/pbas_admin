import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { AUTO_REFRESH_INTERVAL, useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import ProgressBar from '../../components/ProgressBar';
import ChartTip from '../../components/ChartTip';
import SchoolProgress from '../../components/SchoolProgress';
import LiveBadge from '../../components/LiveBadge';

const CHART_MARGIN = { top: 5, right: 10, left: -20, bottom: 5 };

export default function SchoolStatisticsPage() {
  const { data: raw, loading, error, lastUpdated } = useFetch(() => api.stats.get(), [], { interval: AUTO_REFRESH_INTERVAL });
  const { bySchool } = useMemo(() => normalizeStats(raw), [raw]);

  return (
    <div className="page-enter">
      <PageHead title="School Statistics" sub="Submission breakdown by school" action={<LiveBadge lastUpdated={lastUpdated} />} />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card title="Bar Comparison" delay={0}>
            {bySchool.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bySchool} margin={CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis              tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="sub"  name="Submitted" fill={C.accent} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pend" name="Pending"   fill={C.red}    radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Completion Rates" delay={60}>
            <SchoolProgress schools={bySchool} showCount={false} emptyMsg="No data" />
          </Card>
        </div>
      )}
    </div>
  );
}
