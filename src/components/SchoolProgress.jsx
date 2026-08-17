import { C } from '../constants/colors';
import Badge from './Badge';
import ProgressBar from './ProgressBar';
import { rateColor } from '../constants/styleTokens';

export default function SchoolProgress({ schools = [], showCount = true, emptyMsg = 'No school data available' }) {
  if (schools.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
        {emptyMsg}
      </div>
    );
  }
  return schools.map((s, i) => {
    const pct = s.total ? s.sub / s.total : 0;
    const { bar, badge } = rateColor(pct);
    return (
      <div key={s.name} style={{ marginBottom: i < schools.length - 1 ? 13 : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: C.subtle, fontWeight: 500 }}>{s.name}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {showCount && (
              <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
                {s.sub}/{s.total}
              </span>
            )}
            <Badge color={badge}>{Math.round(pct * 100)}%</Badge>
          </div>
        </div>
        <ProgressBar value={pct * 100} color={bar} />
      </div>
    );
  });
}
