import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { AUTO_REFRESH_INTERVAL, useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { I } from '../../components/icons';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import PageHead from '../../components/PageHead';
import SchoolProgress from '../../components/SchoolProgress';
import LiveBadge from '../../components/LiveBadge';

export default function SubmissionStatusPage() {
  const { data: raw, loading, error, lastUpdated } = useFetch(() => api.stats.get(), [], { interval: AUTO_REFRESH_INTERVAL });
  const stats = normalizeStats(raw);
  const rate  = stats.total ? Math.round(stats.submitted / stats.total * 100) : 0;

  return (
    <div className="page-enter">
      <PageHead title="Submission Status" sub="Quick overview of submission completion" action={<LiveBadge lastUpdated={lastUpdated} />} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard label="Submitted" value={loading ? '…' : stats.submitted} color={C.green}  IconC={I.check} delay={0}   />
        <StatCard label="Pending"   value={loading ? '…' : stats.pending}   color={C.red}    IconC={I.clock} delay={60}  />
        <StatCard label="Rate"      value={loading ? '…' : `${rate}%`}      color={C.accent} IconC={I.bar}   delay={120} />
      </div>

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <Card title="School-wise Status" delay={100}>
          <SchoolProgress schools={stats.bySchool} emptyMsg="No school data available" />
        </Card>
      )}
    </div>
  );
}
