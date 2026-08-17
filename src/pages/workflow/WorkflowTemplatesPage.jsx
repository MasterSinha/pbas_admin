import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import { I } from '../../components/icons';
import { inp, lbl, pBtn, oBtn } from '../../constants/styleTokens';
import { useFetch } from '../../hooks/useFetch';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Alert({ msg, color = C.red }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: '9px 13px', borderRadius: 8, marginBottom: 12,
      background: `${color}0d`, border: `1px solid ${color}30`,
      fontSize: 12, color,
    }}>
      {msg}
    </div>
  );
}

// ── Inline flow chain (Staff → Step1 → Step2 → …) ────────────────────────────
function FlowChain({ steps = [] }) {
  const nodes = [{ label: 'Staff', accent: C.accent, sub: 'submits form' }, ...steps.map(s => ({
    label: s.designation || `Step ${s.step_no}`,
    accent: 'rgba(255,255,255,.55)',
    sub: `Step ${s.step_no}`,
  }))];

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, marginTop: 12 }}>
      {nodes.map((node, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          {/* Node */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 14px', borderRadius: 10,
            background: i === 0 ? `${C.accent}12` : 'rgba(255,255,255,.04)',
            border: `1px solid ${i === 0 ? `${C.accent}30` : 'rgba(255,255,255,.09)'}`,
            minWidth: 80, textAlign: 'center',
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: i === 0 ? C.accent : 'rgba(255,255,255,.75)',
            }}>
              {node.label}
            </span>
            <span style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{node.sub}</span>
          </div>
          {/* Arrow */}
          {i < nodes.length - 1 && (
            <div style={{ padding: '0 6px', color: 'rgba(255,255,255,.2)', fontSize: 16, userSelect: 'none' }}>→</div>
          )}
        </div>
      ))}
      {nodes.length === 1 && (
        <div style={{ padding: '0 8px', color: C.muted, fontSize: 11 }}>
          No approval steps yet — add steps to activate this flow
        </div>
      )}
    </div>
  );
}

// ── Edit-flow modal ───────────────────────────────────────────────────────────
function EditFlowModal({ template, designations, onClose, onSaved }) {
  const [steps,      setSteps]      = useState([...(template.steps || [])]);
  const [addDesigId, setAddDesigId] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [addBusy,    setAddBusy]    = useState(false);
  const [removingNo, setRemovingNo] = useState(null);
  const [err,        setErr]        = useState('');

  const activeDesigs = designations.filter(d => d.is_active);
  const usedNames    = new Set(steps.map(s => s.designation));

  async function handleAdd() {
    if (!addDesigId) { setErr('Select an approver type.'); return; }
    const desig = activeDesigs.find(d => d.id === addDesigId);
    if (!desig) return;
    setErr(''); setAddBusy(true);
    try {
      const nextNo = steps.length > 0 ? Math.max(...steps.map(s => s.step_no)) + 1 : 1;
      const result = await api.workflowTemplates.addStep(template.id, {
        designation_id: addDesigId,
        is_required: isRequired,
        step_no: nextNo,
      });
      const newStep = result?.step || { step_no: nextNo, designation: desig.name, is_required: isRequired, id: Date.now() };
      setSteps(s => [...s, newStep]);
      setAddDesigId('');
    } catch (e) {
      setErr(e.message);
    } finally {
      setAddBusy(false);
    }
  }

  async function handleRemove(stepNo) {
    setRemovingNo(stepNo); setErr('');
    try {
      await api.workflowTemplates.removeStep(template.id, stepNo);
      setSteps(s => s.filter(x => x.step_no !== stepNo));
    } catch (e) {
      setErr(e.message);
    } finally {
      setRemovingNo(null);
    }
  }

  async function move(idx, dir) {
    const next = idx + dir;
    if (next < 0 || next >= steps.length) return;
    const arr = [...steps];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    const reordered = arr.map((s, i) => ({ ...s, step_no: i + 1 }));
    try {
      await api.workflowTemplates.reorderSteps(template.id, reordered.map(s => ({ step_no: s.step_no, designation: s.designation })));
      setSteps(reordered);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <Modal onClose={() => { onSaved(); onClose(); }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Edit Approval Steps</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
          <strong style={{ color: C.subtle }}>{template.name}</strong> — define who approves in order
        </div>
      </div>

      <Alert msg={err} />

      {/* Flow preview */}
      <div style={{ marginBottom: 16 }}>
        <FlowChain steps={steps} />
      </div>

      {/* Step list */}
      {steps.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
            Approval Steps
          </div>
          {steps.map((step, idx) => (
            <div key={step.step_no} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 5,
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
            }}>
              {/* Step number circle */}
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${C.accent}18`, border: `1.5px solid ${C.accent}30`,
                fontSize: 11, fontWeight: 700, color: C.accent,
              }}>
                {idx + 1}
              </div>

              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>
                {step.designation}
              </span>

              {/* Move up / down */}
              <button
                onClick={() => move(idx, -1)} disabled={idx === 0}
                style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: idx === 0 ? 'default' : 'pointer', background: 'rgba(255,255,255,.05)', color: idx === 0 ? 'rgba(255,255,255,.15)' : C.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Move up"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <button
                onClick={() => move(idx, 1)} disabled={idx === steps.length - 1}
                style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: idx === steps.length - 1 ? 'default' : 'pointer', background: 'rgba(255,255,255,.05)', color: idx === steps.length - 1 ? 'rgba(255,255,255,.15)' : C.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Move down"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <button
                onClick={() => handleRemove(step.step_no)} disabled={removingNo === step.step_no}
                style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,.08)', color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: removingNo === step.step_no ? .5 : 1 }}
                title="Remove"
              >
                <I.x size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add step row */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        padding: '10px 12px', borderRadius: 8,
        background: 'rgba(59,130,246,.04)', border: '1px dashed rgba(59,130,246,.25)',
        marginBottom: 20,
      }}>
        <select
          style={{ flex: 1, ...inp, fontSize: 12, padding: '7px 10px' }}
          value={addDesigId}
          onChange={e => { setAddDesigId(e.target.value); setErr(''); }}
        >
          <option value="">Add approver type…</option>
          {activeDesigs.map(d => (
            <option key={d.id} value={d.id} disabled={usedNames.has(d.name)}>
              {d.name}{usedNames.has(d.name) ? ' (already in flow)' : ''}
            </option>
          ))}
        </select>
        <button
          style={{ ...pBtn, padding: '7px 14px', fontSize: 12, flexShrink: 0 }}
          onClick={handleAdd}
          disabled={addBusy || !addDesigId}
        >
          {addBusy ? '…' : '+ Add'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={pBtn} onClick={() => { onSaved(); onClose(); }}>Done</button>
      </div>
    </Modal>
  );
}

// ── Assign modal ──────────────────────────────────────────────────────────────
const NT_ROLES = [
  { value: 'non_teaching_staff', label: 'Non-Teaching Staff' },
  { value: 'reporting_officer',  label: 'Reporting Officer'  },
  { value: 'registrar',          label: 'Registrar'          },
];

function AssignModal({ template, onClose, onAssigned }) {
  const [type,   setType]   = useState('appraisal_role');
  const [value,  setValue]  = useState('');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  async function handleAssign() {
    if (!value.trim()) { setErr('Please select or enter a value.'); return; }
    setSaving(true); setErr('');
    try {
      await api.workflowTemplates.assign({ template_id: template.id, [type]: value.trim() });
      onAssigned();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Assign Flow</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
          Use <strong style={{ color: C.subtle }}>{template.name}</strong> for these staff members
        </div>
      </div>
      <Alert msg={err} />

      {/* Simple toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { v: 'appraisal_role', label: 'By Role' },
          { v: 'department',     label: 'By Department' },
          { v: 'staff_email',    label: 'One Staff Member' },
        ].map(t => (
          <button
            key={t.v}
            onClick={() => { setType(t.v); setValue(''); }}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: type === t.v ? `${C.accent}18` : 'rgba(255,255,255,.04)',
              color: type === t.v ? C.accent : C.muted,
              outline: type === t.v ? `1px solid ${C.accent}35` : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        {type === 'appraisal_role' ? (
          <select style={{ ...inp, cursor: 'pointer' }} value={value} onChange={e => setValue(e.target.value)}>
            <option value="">Select role…</option>
            {NT_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        ) : (
          <input
            style={inp}
            placeholder={type === 'department' ? 'e.g. Administration' : 'staff@dypu.edu.in'}
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
          />
        )}
        <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
          {type === 'appraisal_role' && 'All staff with this role will use this flow (unless overridden individually).'}
          {type === 'department'     && 'All staff in this department will use this flow.'}
          {type === 'staff_email'    && 'This specific staff member will use this flow — overrides role and department.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={oBtn} onClick={onClose}>Cancel</button>
        <button style={{ ...pBtn, opacity: saving ? .6 : 1 }} disabled={saving} onClick={handleAssign}>
          <I.check size={14} />
          {saving ? 'Assigning…' : 'Assign'}
        </button>
      </div>
    </Modal>
  );
}

// ── Create flow modal ─────────────────────────────────────────────────────────
function CreateFlowModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  async function handleCreate() {
    if (!name.trim()) { setErr('Flow name is required.'); return; }
    setBusy(true); setErr('');
    try {
      const result = await api.workflowTemplates.create({ name: name.trim(), description: desc.trim() });
      onCreated(result);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Create Approval Flow</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
          Give it a name, then add approver steps after creation.
        </div>
      </div>
      <Alert msg={err} />
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Flow Name *</label>
        <input style={inp} placeholder="e.g. Standard NT Flow, Direct to Registrar…" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>Description (optional)</label>
        <input style={inp} placeholder="Brief description" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={oBtn} onClick={onClose}>Cancel</button>
        <button style={{ ...pBtn, opacity: busy ? .6 : 1 }} disabled={busy} onClick={handleCreate}>
          <I.check size={14} />
          {busy ? 'Creating…' : 'Create Flow'}
        </button>
      </div>
    </Modal>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ template, assignments, designations, onRefresh, onSetDefault, onDelete, isDeleting }) {
  const [editing,     setEditing]     = useState(false);
  const [assigning,   setAssigning]   = useState(false);
  const [setDefBusy,  setSetDefBusy]  = useState(false);
  const [err,         setErr]         = useState('');

  const myAssignments = assignments.filter(a => a.template_id === template.id);

  async function handleSetDefault() {
    setSetDefBusy(true); setErr('');
    try {
      await api.workflowTemplates.setDefault(template.id);
      onSetDefault(template.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSetDefBusy(false);
    }
  }

  return (
    <div style={{
      borderRadius: 12, padding: '18px 20px',
      background: 'rgba(255,255,255,.03)',
      border: `1.5px solid ${template.is_default ? `${C.accent}35` : 'rgba(255,255,255,.08)'}`,
      transition: 'border-color .15s',
    }}>
      {editing && (
        <EditFlowModal
          template={template}
          designations={designations}
          onClose={() => setEditing(false)}
          onSaved={onRefresh}
        />
      )}
      {assigning && (
        <AssignModal
          template={template}
          onClose={() => setAssigning(false)}
          onAssigned={() => { setAssigning(false); onRefresh(); }}
        />
      )}

      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{template.name}</span>
          {template.is_default && <Badge color="green">Default</Badge>}
          {!template.is_active && <Badge color="gray">Inactive</Badge>}
        </div>

        <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
          {!template.is_default && (
            <button
              onClick={handleSetDefault} disabled={setDefBusy}
              style={{ ...oBtn, padding: '5px 12px', fontSize: 11, gap: 5 }}
              title="Make this the default flow"
            >
              <I.star size={11} />
              {setDefBusy ? '…' : 'Set Default'}
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            style={{ ...oBtn, padding: '5px 12px', fontSize: 11, gap: 5 }}
          >
            <I.doc size={11} />
            Edit Steps
          </button>
          <button
            onClick={() => setAssigning(true)}
            style={{ ...oBtn, padding: '5px 12px', fontSize: 11, gap: 5 }}
          >
            <I.users size={11} />
            Assign
          </button>
          {!template.is_default && (
            <button
              onClick={() => onDelete(template)} disabled={isDeleting}
              style={{ padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,.08)', color: C.red, fontSize: 11, fontWeight: 600, opacity: isDeleting ? .5 : 1 }}
            >
              {isDeleting ? '…' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {template.description && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{template.description}</div>
      )}

      <Alert msg={err} />

      {/* Visual flow chain */}
      <FlowChain steps={template.steps || []} />

      {/* Assignments */}
      {myAssignments.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>
            Applies to
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {myAssignments.map(a => {
              const label = a.staff_email || a.department || a.appraisal_role || '—';
              const kind  = a.staff_email ? 'Individual' : a.department ? 'Department' : 'Role';
              return (
                <AssignmentChip key={a.id} label={label} kind={kind} id={a.id} onRemoved={onRefresh} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Assignment chip with remove ────────────────────────────────────────────────
function AssignmentChip({ label, kind, id, onRemoved }) {
  const [removing, setRemoving] = useState(false);
  const color = kind === 'Individual' ? '#818cf8' : kind === 'Department' ? C.yellow : C.green;

  async function handleRemove(e) {
    e.stopPropagation();
    setRemoving(true);
    try {
      await api.workflowTemplates.removeAssignment(id);
      onRemoved();
    } catch {
      setRemoving(false);
    }
  }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px 3px 10px', borderRadius: 20,
      background: `${color}10`, border: `1px solid ${color}28`,
      fontSize: 11, color,
    }}>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{label}</span>
      <span style={{ fontSize: 9, opacity: .6 }}>({kind})</span>
      <button
        onClick={handleRemove}
        disabled={removing}
        style={{
          width: 14, height: 14, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: removing ? .4 : .7, padding: 0, marginLeft: 2,
        }}
        title="Remove assignment"
      >
        <I.x size={8} />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorkflowTemplatesPage() {
  const navigate    = useNavigate();
  const [rev,       setRev]       = useState(0);
  const [showCreate,setShowCreate]= useState(false);
  const [deletingId,setDeletingId]= useState(null);
  const [deleteErr, setDeleteErr] = useState('');

  const { data: tplData,   loading: tplLoading,  error: tplErr  } = useFetch(() => api.workflowTemplates.list(), [rev]);
  const { data: desigData                                         } = useFetch(() => api.designations.list(),         [rev]);
  const { data: asgData                                           } = useFetch(() => api.workflowTemplates.listAssignments().catch(() => []), [rev]);

  const templates    = Array.isArray(tplData)   ? tplData   : [];
  const designations = Array.isArray(desigData)  ? desigData : [];
  const assignments  = Array.isArray(asgData)    ? asgData   : [];

  const [localDefaultId, setLocalDefaultId] = useState(null);
  const effectiveTemplates = templates.map(t => ({
    ...t,
    is_default: localDefaultId ? t.id === localDefaultId : t.is_default,
  }));

  const notDeployed = tplErr && (tplErr.includes('500') || tplErr.includes('404'));

  function handleCreated(result) {
    setShowCreate(false);
    setRev(r => r + 1);
  }

  async function handleDelete(tpl) {
    setDeleteErr('');
    if (!window.confirm(`Delete "${tpl.name}"? This cannot be undone.`)) return;
    setDeletingId(tpl.id);
    try {
      await api.workflowTemplates.remove(tpl.id);
      setRev(r => r + 1);
    } catch (e) {
      setDeleteErr(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page-enter">
      <PageHead
        title="Approval Flows"
        sub="Define the approval chain for non-teaching staff appraisals"
        action={
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'rgba(255,255,255,.7)', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}
          >
            ← Back
          </button>
        }
      />

      {showCreate && (
        <CreateFlowModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}

      {/* Info banner */}
      <div style={{
        padding: '13px 16px', borderRadius: 10, marginBottom: 16,
        background: `${C.accent}08`, border: `1px solid ${C.accent}20`,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{ fontSize: 16, flexShrink: 0 }}>💡</div>
        <div style={{ fontSize: 12, color: C.subtle, lineHeight: 1.7 }}>
          <strong style={{ color: C.text }}>How flows work: </strong>
          Each non-teaching staff member follows an approval flow when they submit their appraisal.
          The flow defines <em>who reviews in what order</em> — e.g. Reporting Officer → Registrar → VC.
          The <strong>specific person</strong> at each step (which RO, which Registrar) is set when you
          add the staff member in <strong>Faculty Management → Add Faculty</strong>.
        </div>
      </div>

      {notDeployed ? (
        <Card title="Approval Flows" delay={0}>
          <div style={{ padding: '20px 0', textAlign: 'center', color: C.muted, fontSize: 12, lineHeight: 1.8 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔧</div>
            <div style={{ fontWeight: 600, color: C.subtle, marginBottom: 4 }}>Migration not run yet</div>
            <div>Run <code style={{ background: 'rgba(255,255,255,.06)', padding: '1px 5px', borderRadius: 4 }}>migrations/018_nt_workflow_system.sql</code> on your database first.</div>
          </div>
        </Card>
      ) : tplLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12, animationDelay: `${i * 80}ms` }} />)}
        </div>
      ) : (
        <>
          <Alert msg={deleteErr} />

          {/* Template cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {effectiveTemplates.length === 0 ? (
              <Card title="No Flows Yet" delay={0}>
                <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 12 }}>
                  Create your first approval flow to get started.
                </div>
              </Card>
            ) : (
              effectiveTemplates.map((tpl, i) => (
                <div key={tpl.id} className="row-enter" style={{ animationDelay: `${i * 50}ms` }}>
                  <TemplateCard
                    template={tpl}
                    assignments={assignments}
                    designations={designations}
                    onRefresh={() => setRev(r => r + 1)}
                    onSetDefault={id => { setLocalDefaultId(id); setRev(r => r + 1); }}
                    onDelete={handleDelete}
                    isDeleting={deletingId === tpl.id}
                  />
                </div>
              ))
            )}
          </div>

          {/* Add new flow */}
          <button
            onClick={() => setShowCreate(true)}
            style={{
              marginTop: 14, width: '100%', padding: '13px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,.02)', border: '1.5px dashed rgba(255,255,255,.12)',
              color: C.muted, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.accent}40`; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = C.muted; }}
          >
            + Create New Approval Flow
          </button>
        </>
      )}
    </div>
  );
}
