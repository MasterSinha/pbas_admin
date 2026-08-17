import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '../../constants/colors'
import { api } from '../../api/client'
import { I } from '../../components/icons'

// ── Clean input ───────────────────────────────────────────────────────────────
function Field({ label, value, onChange, readOnly = false, type = 'text', hint, full = false }) {
  const [focused, setFocused] = useState(false)
  const lit = focused && !readOnly

  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 500,
        color: lit ? C.accent : C.muted,
        marginBottom: 6, transition: 'color .15s',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value ?? ''}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '9px 12px',
          background: readOnly ? 'transparent' : lit ? 'rgba(59,130,246,.06)' : 'rgba(255,255,255,.04)',
          border: `1.5px solid ${readOnly ? 'rgba(255,255,255,.06)' : lit ? `${C.accent}88` : 'rgba(255,255,255,.10)'}`,
          borderRadius: 8,
          color: readOnly ? C.subtle : C.text,
          fontSize: 13, fontFamily: 'inherit',
          outline: 'none', transition: 'all .15s',
          cursor: readOnly ? 'default' : 'text',
        }}
      />
      {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// ── Section label with extending rule ────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color: C.muted,
        textTransform: 'uppercase', letterSpacing: .9, whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)' }} />
    </div>
  )
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const stored = api.getProfile() || {}

  const [form, setForm] = useState({
    full_name:           stored.full_name           || '',
    employee_id:         stored.employee_id         || '',
    designation:         stored.designation         || '',
    department:          stored.department          || '',
    phone:               stored.phone               || '',
    qualification:       stored.qualification       || '',
    teaching_experience: stored.teaching_experience || '',
  })

  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const initials = (form.full_name || stored.email || 'AD')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const updated = await api.profile.update(form)
      localStorage.setItem('admin_profile', JSON.stringify({ ...stored, ...updated }))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-enter" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Page title */}
      <div style={{ marginBottom: 18, animation: 'fadeUp .35s cubic-bezier(.22,1,.36,1) both' }}>
        <h2 style={{
          fontSize: 22, fontWeight: 800, letterSpacing: -.5, margin: 0, lineHeight: 1.2,
          background: 'linear-gradient(135deg,#f1f5f9 30%,#94a3b8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Edit Profile
        </h2>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4, marginBottom: 0 }}>
          Manage your personal information and preferences
        </p>
        <div style={{ marginTop: 8, height: 2, width: 36, borderRadius: 2, background: 'linear-gradient(90deg,#3b82f6,#818cf8)', animation: 'accentLine .5s cubic-bezier(.22,1,.36,1) .1s both' }} />
      </div>

      {/* Two-pane grid — fills remaining height */}
      <div style={{
        height: 'calc(100vh - 160px)',
        display: 'grid',
        gridTemplateColumns: '248px 1fr',
        gap: 14,
        overflow: 'hidden',
      }}>

        {/* ── Left: profile card with cover ─────────────────────────────── */}
        <div
          className="glass card-appear"
          style={{ borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', animationDelay: '0ms' }}
        >
          {/* Cover gradient strip */}
          <div style={{
            height: 64, flexShrink: 0, position: 'relative',
            background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#3b82f6 100%)',
            overflow: 'hidden',
          }}>
            {/* Subtle dot grid overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.12) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }} />
            {/* Glow */}
            <div style={{
              position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)',
              width: 120, height: 60, borderRadius: '50%',
              background: 'rgba(255,255,255,.12)', filter: 'blur(18px)',
            }} />
          </div>

          {/* Avatar — overlaps cover */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -34, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: '#fff',
              fontFamily: "'JetBrains Mono',monospace",
              border: '3px solid rgba(255,255,255,.15)',
              boxShadow: '0 4px 22px rgba(59,130,246,.45)',
              marginBottom: 10,
            }}>
              {initials}
            </div>

            <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, textAlign: 'center' }}>
              {form.full_name || stored.email || 'Admin'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
              <span style={{
                padding: '2px 9px', borderRadius: 5,
                background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.28)',
                fontSize: 9, fontWeight: 800, color: C.accent,
                textTransform: 'uppercase', letterSpacing: .9,
              }}>
                {(stored.appraisal_role || 'admin').replace('_', ' ')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: C.green }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, boxShadow: `0 0 5px ${C.green}`, display: 'inline-block' }} />
                Active
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,.06)', marginLeft: 20, marginRight: 20, flexShrink: 0 }} />

          {/* Account info rows */}
          <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
            {[
              { label: 'Email',  value: stored.email },
              { label: 'Role',   value: (stored.appraisal_role || 'admin').replace('_', ' ') },
              { label: 'School', value: stored.school },
              ...(form.employee_id ? [{ label: 'Employee ID', value: form.employee_id }] : []),
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  padding: '9px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginBottom: 2 }}>{row.label}</div>
                <div style={{ fontSize: 12.5, color: C.subtle, wordBreak: 'break-all', lineHeight: 1.4 }}>{row.value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Quick actions — pinned to bottom */}
          <div style={{ padding: '14px 20px 20px', flexShrink: 0 }}>
            <div style={{ height: 1, background: 'rgba(255,255,255,.06)', marginBottom: 14 }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
              Quick Actions
            </div>
            <button
              onClick={() => navigate('/settings/security')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                color: C.subtle, fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit',
                transition: 'all .15s', marginBottom: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,.08)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,.22)'; e.currentTarget.style.color = C.accent }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = C.subtle }}
            >
              <I.lock size={13} stroke="currentColor" />
              Change Password
            </button>
            <button
              onClick={() => { api.logout(); navigate('/login') }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                background: 'rgba(248,113,113,.05)', border: '1px solid rgba(248,113,113,.12)',
                color: 'rgba(248,113,113,.7)', fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,.10)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,.25)'; e.currentTarget.style.color = C.red }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,.05)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,.12)'; e.currentTarget.style.color = 'rgba(248,113,113,.7)' }}
            >
              <I.lock size={13} stroke="currentColor" />
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Right: form ────────────────────────────────────────────────── */}
        <div
          className="glass card-appear"
          style={{ borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden', animationDelay: '60ms' }}
        >
          {/* Card header */}
          <div style={{ padding: '20px 26px 16px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Profile Information</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Fields marked below can be updated anytime</div>
          </div>

          {/* Scrollable form */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 26px' }}>

            <SectionLabel label="Personal" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', marginBottom: 24 }}>
              <Field label="Full Name"   value={form.full_name}   onChange={set('full_name')}   />
              <Field label="Employee ID" value={form.employee_id} onChange={set('employee_id')} />
              <Field label="Designation" value={form.designation} onChange={set('designation')} />
              <Field label="Department"  value={form.department}  onChange={set('department')}  />
            </div>

            <SectionLabel label="Academic & Contact" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
              <Field label="Phone Number"        value={form.phone}               onChange={set('phone')}               type="tel" />
              <Field label="Qualification"       value={form.qualification}       onChange={set('qualification')}       />
              <Field label="Teaching Experience" value={form.teaching_experience} onChange={set('teaching_experience')} hint="e.g. 8 years" full />
            </div>

          </div>

          {/* Save bar */}
          <div style={{
            padding: '14px 26px', flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,.06)',
            background: 'rgba(255,255,255,.02)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14,
          }}>

            {/* Feedback inline */}
            <div style={{ flex: 1 }}>
              {error && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 12px', borderRadius: 7, fontSize: 12,
                  background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.20)',
                  color: C.red,
                }}>
                  <I.x size={13} stroke={C.red} /> {error}
                </div>
              )}
              {success && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 12px', borderRadius: 7, fontSize: 12,
                  background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.20)',
                  color: C.green,
                }}>
                  <I.check size={13} stroke={C.green} /> Profile updated successfully.
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 24px', borderRadius: 9, border: 'none',
                cursor: saving ? 'default' : 'pointer',
                background: saving ? 'rgba(59,130,246,.3)' : C.accent,
                color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                boxShadow: saving ? 'none' : '0 2px 12px rgba(59,130,246,.35)',
                opacity: saving ? 0.6 : 1,
                transition: 'all .18s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#2563eb' }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = C.accent }}
            >
              {saving
                ? <><I.refresh size={14} stroke="#fff" /> Saving…</>
                : <><I.check size={14} stroke="#fff" /> Save Changes</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
