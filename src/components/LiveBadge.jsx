import { useState, useEffect } from 'react';
import { C } from '../constants/colors';

function timeAgo(ts) {
  if (!ts) return null;
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export default function LiveBadge({ lastUpdated }) {
  const [label, setLabel] = useState(() => timeAgo(lastUpdated));

  useEffect(() => {
    setLabel(timeAgo(lastUpdated));
    const id = setInterval(() => setLabel(timeAgo(lastUpdated)), 5000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  if (!lastUpdated) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
      <span className="notif-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
      <span>Live · {label}</span>
    </div>
  );
}
