import { useState, useEffect } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, lbl, pBtn } from '../../constants/styleTokens';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import Toggle from '../../components/Toggle';

export default function SettingsPage() {
  const [saved, setSaved]           = useState(false);
  const [saveErr, setSaveErr]       = useState(null);
  const [savingSection, setSavingSection] = useState(null);
  const [sectionErr, setSectionErr] = useState({});
  const [form, setForm] = useState({
    FRONTEND_URL: '', APP_URL: '', ALLOW_MOCK_USER: 'false',
    MAIL_SERVER: '', MAIL_PORT: '', MAIL_USERNAME: '',
    MAIL_PASSWORD: '', MAIL_FROM: '', MAIL_TLS: 'true', MAIL_SSL: 'false',
    USE_LOCAL_STORAGE: 'true', GCP_STORAGE_BUCKET: '',
  });

  const [maintenance, setMaintenance] = useState(false);
  const [allowRegs, setAllowRegs]     = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [debugLog, setDebugLog]       = useState(false);

  const { data: cfg, loading, error } = useFetch(() => api.config.get(), []);

  useEffect(() => {
    if (cfg) {
      setForm(p => ({
        ...p,
        FRONTEND_URL:       cfg.FRONTEND_URL       ?? cfg.frontend_url ?? '',
        APP_URL:            cfg.APP_URL            ?? cfg.app_url      ?? '',
        ALLOW_MOCK_USER:    cfg.ALLOW_MOCK_USER    ?? 'false',
        MAIL_SERVER:        cfg.MAIL_SERVER        ?? '',
        MAIL_PORT:          cfg.MAIL_PORT          ?? '',
        MAIL_USERNAME:      cfg.MAIL_USERNAME      ?? '',
        MAIL_PASSWORD:      cfg.MAIL_PASSWORD      ?? '',
        MAIL_FROM:          cfg.MAIL_FROM          ?? '',
        MAIL_TLS:           cfg.MAIL_TLS           ?? 'true',
        MAIL_SSL:           cfg.MAIL_SSL           ?? 'false',
        USE_LOCAL_STORAGE:  cfg.USE_LOCAL_STORAGE  ?? 'true',
        GCP_STORAGE_BUCKET: cfg.GCP_STORAGE_BUCKET ?? '',
      }));
    }
  }, [cfg]);

  const saveSection = async (section, keys) => {
    setSavingSection(section);
    setSectionErr(p => ({ ...p, [section]: null }));
    const payload = Object.fromEntries(keys.map(k => [k, form[k]]));
    try {
      await api.config.update(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSectionErr(p => ({ ...p, [section]: e.message }));
    } finally {
      setSavingSection(null);
    }
  };

  const flagRows = [
    { l: 'Maintenance Mode',    d: 'Block all logins except admin',  v: maintenance,  s: setMaintenance  },
    { l: 'Allow Registrations', d: 'New faculty can request access', v: allowRegs,    s: setAllowRegs    },
    { l: 'Email Notifications', d: 'Send automated email reminders', v: emailNotifs,  s: setEmailNotifs  },
    { l: 'Debug Logging',       d: 'Verbose server-side logging',    v: debugLog,     s: setDebugLog     },
  ];

  return (
    <div className="page-enter">
      <PageHead title="System Settings" sub="URLs, email, storage and feature flags" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <Card title="System Configuration" delay={0}>
            {[
              { l: 'Frontend URL', k: 'FRONTEND_URL', p: 'https://…' },
              { l: 'Backend URL',  k: 'APP_URL',      p: 'https://…' },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 14 }}>
                <label style={lbl}>{f.l}</label>
                <input className="ifield" value={form[f.k]} placeholder={f.p}
                  onChange={e => setForm(v => ({ ...v, [f.k]: e.target.value }))} style={inp} />
              </div>
            ))}
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="mock-user" checked={form.ALLOW_MOCK_USER === 'true'}
                onChange={e => setForm(v => ({ ...v, ALLOW_MOCK_USER: e.target.checked ? 'true' : 'false' }))} />
              <label htmlFor="mock-user" style={{ ...lbl, marginBottom: 0, cursor: 'pointer' }}>
                Allow Mock User (dev only — bypasses login)
              </label>
            </div>
            {sectionErr.urls && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{sectionErr.urls}</div>}
            <button className="act-btn" style={pBtn}
              onClick={() => saveSection('urls', ['FRONTEND_URL', 'APP_URL', 'ALLOW_MOCK_USER'])}
              disabled={savingSection === 'urls'}>
              {saved && savingSection === null ? '✓ Saved' : savingSection === 'urls' ? 'Saving…' : 'Save Changes'}
            </button>
          </Card>

          <Card title="Feature Flags" delay={60}>
            {flagRows.map((f, i) => (
              <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < flagRows.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{f.l}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{f.d}</div>
                </div>
                <Toggle val={f.v} onChange={f.s} />
              </div>
            ))}
          </Card>

          <Card title="Email / SMTP" delay={80}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[
                { l: 'SMTP Server',  k: 'MAIL_SERVER',   p: 'smtp.gmail.com',    span: false },
                { l: 'SMTP Port',    k: 'MAIL_PORT',     p: '587',               span: false },
                { l: 'Username',     k: 'MAIL_USERNAME', p: 'noreply@dypiu.edu', span: false },
                { l: 'Password',     k: 'MAIL_PASSWORD', p: '••••••••',          span: false, type: 'password' },
                { l: 'From Address', k: 'MAIL_FROM',     p: 'noreply@dypiu.edu', span: true  },
              ].map(f => (
                <div key={f.k} style={f.span ? { gridColumn: '1 / -1' } : {}}>
                  <label style={lbl}>{f.l}</label>
                  <input className="ifield" type={f.type ?? 'text'} value={form[f.k]} placeholder={f.p}
                    onChange={e => setForm(v => ({ ...v, [f.k]: e.target.value }))} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              {[{ id: 'tls', label: 'Use TLS', k: 'MAIL_TLS' }, { id: 'ssl', label: 'Use SSL', k: 'MAIL_SSL' }].map(opt => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id={opt.id} checked={form[opt.k] === 'true'}
                    onChange={e => setForm(v => ({ ...v, [opt.k]: e.target.checked ? 'true' : 'false' }))} />
                  <label htmlFor={opt.id} style={{ ...lbl, marginBottom: 0, cursor: 'pointer' }}>{opt.label}</label>
                </div>
              ))}
            </div>
            {sectionErr.email && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{sectionErr.email}</div>}
            <button className="act-btn" style={pBtn}
              onClick={() => saveSection('email', ['MAIL_SERVER','MAIL_PORT','MAIL_USERNAME','MAIL_PASSWORD','MAIL_FROM','MAIL_TLS','MAIL_SSL'])}
              disabled={savingSection === 'email'}>
              {savingSection === 'email' ? 'Saving…' : 'Save Email Config'}
            </button>
          </Card>

          <Card title="Storage" delay={100}>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="local-storage" checked={form.USE_LOCAL_STORAGE === 'true'}
                onChange={e => setForm(v => ({ ...v, USE_LOCAL_STORAGE: e.target.checked ? 'true' : 'false' }))} />
              <label htmlFor="local-storage" style={{ ...lbl, marginBottom: 0, cursor: 'pointer' }}>
                Use local storage (./uploads folder)
              </label>
            </div>
            <div style={{ marginBottom: 18, opacity: form.USE_LOCAL_STORAGE === 'true' ? .4 : 1 }}>
              <label style={lbl}>GCS Bucket Name</label>
              <input className="ifield" value={form.GCP_STORAGE_BUCKET}
                placeholder="my-bucket-name"
                disabled={form.USE_LOCAL_STORAGE === 'true'}
                onChange={e => setForm(v => ({ ...v, GCP_STORAGE_BUCKET: e.target.value }))} style={inp} />
            </div>
            {sectionErr.storage && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{sectionErr.storage}</div>}
            <button className="act-btn" style={pBtn}
              onClick={() => saveSection('storage', ['USE_LOCAL_STORAGE', 'GCP_STORAGE_BUCKET'])}
              disabled={savingSection === 'storage'}>
              {savingSection === 'storage' ? 'Saving…' : 'Save Storage Config'}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
