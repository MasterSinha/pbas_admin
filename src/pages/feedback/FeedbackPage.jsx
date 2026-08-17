import { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeFeedback } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { smBtn } from '../../constants/styleTokens';
import Badge from '../../components/Badge';
import Av from '../../components/Av';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import PageHead from '../../components/PageHead';

const catColor = { Bug: 'red', Query: 'yellow' };
const stColor  = { Open: 'red', 'In review': 'yellow', Resolved: 'green', Planned: 'blue' };

export default function FeedbackPage() {
  const [viewing, setViewing] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState(null);

  const { data: raw, loading, error } = useFetch(() => api.feedback.list(), []);
  const items = useMemo(() => normalizeFeedback(raw), [raw]);
  const open  = useMemo(() => items.filter(b => b.status === 'Open'), [items]);

  const openDetail = async (id) => {
    setViewing(null); setDetailLoading(true); setDetailErr(null);
    try {
      const data = await api.feedback.get(id);
      setViewing(data);
    } catch (e) {
      setDetailErr(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHead title="Feedback &amp; Support" sub="Queries and bug reports from faculty" />

      {/* ── Detail modal ───────────────────────────────────────────── */}
      {(detailLoading || viewing || detailErr) && (
        <Modal maxWidth={520} onClose={() => { setViewing(null); setDetailErr(null); }}>

            {detailLoading && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 13 }}>
                Loading…
              </div>
            )}

            {detailErr && (
              <div style={{ color: C.red, fontSize: 13 }}>{detailErr}</div>
            )}

            {viewing && !detailLoading && (() => {
              const b = normalizeFeedback([viewing])[0];
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Av init={b.av} color={b.cat === 'Bug' ? C.red : C.yellow} size={34} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{b.user}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{b.date}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Badge color={catColor[b.cat] || 'gray'}>{b.cat}</Badge>
                      <Badge color={stColor[b.status] || 'gray'} dot>{b.status}</Badge>
                    </div>
                  </div>

                  {b.subject && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>
                      {b.subject}
                    </div>
                  )}

                  <div style={{ fontSize: 13, color: C.subtle, lineHeight: 1.7,
                    padding: '14px 16px', borderRadius: 8, background: 'rgba(255,255,255,.03)',
                    border: '1px solid rgba(255,255,255,.06)', marginBottom: 20, whiteSpace: 'pre-wrap' }}>
                    {b.msg || '(no message)'}
                  </div>

                  <button className="act-btn"
                    style={{ padding: '9px 18px', background: 'transparent', color: C.muted,
                      border: '1px solid var(--c-btn-border)', borderRadius: 8, cursor: 'pointer',
                      fontSize: 13, fontWeight: 600 }}
                    onClick={() => setViewing(null)}>
                    Close
                  </button>
                </>
              );
            })()}
        </Modal>
      )}

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <Card title="Queries & Bugs" action={<Badge color="red" dot>{open.length} open</Badge>} delay={0}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
              No feedback yet
            </div>
          ) : items.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '12px 0', borderBottom: i < items.length - 1 ? '1px solid var(--c-row-border)' : 'none' }}>
              <Av init={b.av} color={b.cat === 'Bug' ? C.red : C.yellow} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 4 }}>
                  {b.subject || b.msg}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{b.user} · {b.date}</span>
                  <Badge color={catColor[b.cat] || 'gray'}>{b.cat}</Badge>
                  <Badge color={stColor[b.status] || 'gray'} dot>{b.status}</Badge>
                </div>
              </div>
              <button className="act-btn" style={smBtn} onClick={() => openDetail(b.id)}>View</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
