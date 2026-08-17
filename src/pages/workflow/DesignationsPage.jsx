import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { I } from '../../components/icons';
import { inp, lbl, pBtn, oBtn, tdS } from '../../constants/styleTokens';
import { useFetch } from '../../hooks/useFetch';

const EMPTY = { name: '', description: '' };

// ── Inline alert ──────────────────────────────────────────────────────────────
function Alert({ msg, color = C.red }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: '9px 13px', borderRadius: 8, marginBottom: 14,
      background: `${color}0d`, border: `1px solid ${color}30`,
      fontSize: 12, color,
    }}>
      {msg}
    </div>
  );
}

// ── Add/Edit modal ────────────────────────────────────────────────────────────
function DesignationModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(
    editing ? { name: editing.name, description: editing.description || '' } : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    if (!form.name.trim()) { setError('Designation name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await api.designations.update(editing.id, form);
      } else {
        await api.designations.create(form);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
          {editing ? 'Edit Designation' : 'Add Designation'}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
          Designations are used as approval steps in workflow templates.
        </div>
      </div>

      <Alert msg={error} />

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Designation Name *</label>
        <input
          style={inp}
          placeholder="e.g. Data Analyst, Placement Officer, VC"
          value={form.name}
          onChange={set('name')}
          autoFocus
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>Description (optional)</label>
        <input
          style={inp}
          placeholder="Short description of this approver's role"
          value={form.description}
          onChange={set('description')}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={oBtn} onClick={onClose}>Cancel</button>
        <button
          style={{ ...pBtn, opacity: saving ? .6 : 1 }}
          disabled={saving}
          onClick={handleSave}
        >
          <I.check size={14} />
          {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
        </button>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DesignationsPage() {
  const navigate = useNavigate();
  const [rev,         setRev]         = useState(0);
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toggling,    setToggling]    = useState(null);

  const { data, loading, error: fetchErr } = useFetch(
    () => api.designations.list(),
    [rev],
  );

  const rows  = Array.isArray(data) ? data : [];
  const saved = () => { setShowModal(false); setEditing(null); setRev(r => r + 1); };

  function openCreate() { setEditing(null); setShowModal(true); }
  function openEdit(row) { setEditing(row); setShowModal(true); }

  async function handleDelete(row) {
    setDeleteError('');
    if (!window.confirm(`Delete "${row.name}"?\n\nThis will fail if the designation is used in any active workflow template.`)) return;
    setDeletingId(row.id);
    try {
      await api.designations.remove(row.id);
      setRev(r => r + 1);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggle(row) {
    setToggling(row.id);
    try {
      await api.designations.update(row.id, { is_active: !row.is_active });
      setRev(r => r + 1);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setToggling(null);
    }
  }

  const notDeployed = fetchErr && (fetchErr.includes('404') || fetchErr.includes('Not Found') || fetchErr.includes('500'));

  return (
    <div className="page-enter">
      <PageHead
        title="Designations"
        sub="Manage approver designations used in NT workflow steps"
        action={
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', color: 'rgba(255,255,255,.7)',
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
            }}
          >
            ← Back
          </button>
        }
      />

      {showModal && (
        <DesignationModal
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={saved}
        />
      )}

      <Card
        title="All Designations"
        sub="Each designation can be added as a step in any workflow template"
        delay={0}
        action={
          <button style={pBtn} onClick={openCreate}>
            <I.addUser size={14} />
            Add Designation
          </button>
        }
      >
        {notDeployed ? (
          <div style={{
            padding: '20px 0', textAlign: 'center',
            color: C.muted, fontSize: 12, lineHeight: 1.8,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔧</div>
            <div style={{ fontWeight: 600, color: C.subtle, marginBottom: 4 }}>Backend endpoint not deployed yet</div>
            <div>
              Deploy <code style={{ background: 'rgba(255,255,255,.06)', padding: '1px 5px', borderRadius: 4 }}>GET /admin/nt-designations</code> first.
            </div>
            <div style={{ marginTop: 6 }}>See <strong>Docs/BACKEND_NT_WORKFLOW_CHANGES.md</strong> for implementation details.</div>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : (
          <>
            <Alert msg={deleteError} />

            {rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 12 }}>
                No designations yet. Add one to start building workflow templates.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Designation', 'Description', 'Type', 'Status', ''].map(h => (
                      <th key={h} style={{ ...tdS, color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, paddingBottom: 8 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} className="tr-row row-enter" style={{ opacity: row.is_active ? 1 : .5, animationDelay: `${i * 40}ms` }}>
                      <td style={tdS}>
                        <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{row.name}</div>
                      </td>
                      <td style={{ ...tdS, color: C.muted, fontSize: 12 }}>
                        {row.description || '—'}
                      </td>
                      <td style={tdS}>
                        <Badge color={row.is_system ? 'blue' : 'gray'}>
                          {row.is_system ? 'System' : 'Custom'}
                        </Badge>
                      </td>
                      <td style={tdS}>
                        <Badge color={row.is_active ? 'green' : 'gray'}>
                          {row.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td style={{ ...tdS, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleToggle(row)}
                            disabled={toggling === row.id}
                            style={{
                              padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
                              background: row.is_active ? 'rgba(251,191,36,.1)' : 'rgba(52,211,153,.1)',
                              color: row.is_active ? C.yellow : C.green,
                              fontSize: 11, fontWeight: 600,
                              opacity: toggling === row.id ? .5 : 1,
                            }}
                          >
                            {row.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          {!row.is_system && (
                            <>
                              <button
                                onClick={() => openEdit(row)}
                                style={{ padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(129,140,248,.1)', color: '#818cf8', fontSize: 11, fontWeight: 600 }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(row)}
                                disabled={deletingId === row.id}
                                style={{
                                  padding: '5px 11px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                  background: 'rgba(248,113,113,.1)', color: C.red, fontSize: 11, fontWeight: 600,
                                  opacity: deletingId === row.id ? .5 : 1,
                                }}
                              >
                                {deletingId === row.id ? '…' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </Card>

      {/* Info card */}
      <div style={{ marginTop: 14 }}>
        <Card title="How Designations Work" delay={80}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: I.addUser, color: C.accent,  text: 'Create a designation for each type of approver: "Reporting Officer", "Data Analyst", "VC", etc.' },
              { icon: I.doc,     color: '#a78bfa',  text: 'Add designations as ordered steps in a Workflow Template — any number of steps, any order.' },
              { icon: I.users,   color: C.green,    text: 'Assign the same designation to a user\'s profile. They will see submissions waiting at their step.' },
              { icon: I.check,   color: C.yellow,   text: 'When staff submits, the system resolves the correct template and creates a live workflow instance.' },
            ].map(({ icon: Icon, color, text }, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: `${color}14`, border: `1px solid ${color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                }}>
                  <Icon size={13} />
                </div>
                <div style={{ fontSize: 12, color: C.subtle, lineHeight: 1.6, paddingTop: 4 }}>{text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
