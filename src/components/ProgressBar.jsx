import { useState, useEffect } from 'react';

export default function ProgressBar({ value, color }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 60);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ height: 6, background: 'var(--c-track)', borderRadius: 4, overflow: 'hidden' }}>
      <div className="progress-fill" style={{ width: `${w}%`, height: '100%', borderRadius: 4, background: color }} />
    </div>
  );
}
