import { useState } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { inp, lbl, pBtn } from '../../constants/styleTokens';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

export default function CredentialDetailsPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState(null);

  const handleReset = async () => {
    if (!email || !password) {
      setStatus({ ok: false, msg: 'Email and new password are required.' });
      return;
    }
    setSaving(true); setStatus(null);
    try {
      await api.users.update(email, { password });
      setStatus({ ok: true, msg: `Password updated for ${email}.` });
      setEmail('');
      setPassword('');
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHead title="Reset Password" sub="Set a new password for a faculty account" />
      <div style={{ maxWidth: 480 }}>
        <Card title="Set New Password" delay={0}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Faculty Email</label>
            <input className="ifield" type="email" placeholder="faculty@university.edu"
              value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>New Password</label>
            <input className="ifield" type="password" placeholder="Enter new password"
              value={password} onChange={e => setPassword(e.target.value)} style={inp} />
          </div>

          {status && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
              color: status.ok ? C.green : C.red,
              background: status.ok ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)',
              border: `1px solid ${status.ok ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}` }}>
              {status.msg}
            </div>
          )}

          <button className="act-btn" style={pBtn} onClick={handleReset} disabled={saving}>
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </Card>
      </div>
    </div>
  );
}
