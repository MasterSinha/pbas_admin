import { useState, useMemo } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats, normalizeUsers } from '../../api/normalizers';
import { AUTO_REFRESH_INTERVAL, useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { I } from '../../components/icons';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import LiveBadge from '../../components/LiveBadge';
import ProgressBar from '../../components/ProgressBar';
import {
  ENGG_SCHOOL_CODES, NON_ENGG_SCHOOL_CODES, TEACHING_SCHOOL_CODES, ALL_SCHOOL_CODES,
  SCHOOL_META, SOEMR_DEPTS,
} from '../../constants/schools';

// ── Stage maps (backend Declaration.status → pipeline key) ───────────────────

const STAGE_KEY = {
  'Pending Review':          'hod',
  'Submitted':               'hod',
  'Pending Director Review': 'director',
  'Pending Dean Review':     'dean',
  'Pending VC Review':       'vc',
  'Reviewed':                'done',
};

const NT_STAGE_KEY = {
  'Pending RO Review':          'ro',
  'Draft':                      'ro',
  'Pending Registrar Review':   'registrar',
  'Reporting Officer Reviewed': 'registrar',
  'Registrar Reviewed':         'vc',
  'VC Approved':                'done',
};

const CISR_STAGE_KEY = {
  'Submitted':                  'center_head',
  'Pending Center Head Review': 'center_head',
  'Pending VC Review':          'vc',
  'Reviewed':                   'done',
};

// ── Pipeline stage definitions ────────────────────────────────────────────────

const T_STAGES = [
  { key: 'not_submitted', label: 'Not Submitted', color: C.red,     icon: I.clock  },
  { key: 'hod',           label: 'HOD Queue',     color: '#a78bfa', icon: I.school },
  { key: 'director',      label: 'Director',      color: C.yellow,  icon: I.star   },
  { key: 'dean',          label: 'Dean',          color: C.green,   icon: I.shield },
  { key: 'vc',            label: 'VC Queue',      color: '#f472b6', icon: I.users  },
  { key: 'done',          label: 'Approved',      color: C.accent,  icon: I.check  },
];

const NT_STAGES = [
  { key: 'not_submitted', label: 'Not Submitted', color: C.red,     icon: I.clock  },
  { key: 'ro',            label: 'RO Queue',      color: '#a78bfa', icon: I.users  },
  { key: 'registrar',     label: 'Registrar',     color: C.yellow,  icon: I.star   },
  { key: 'vc',            label: 'VC Queue',      color: '#f472b6', icon: I.shield },
  { key: 'done',          label: 'Approved',      color: C.accent,  icon: I.check  },
];

const CISR_STAGES = [
  { key: 'not_submitted', label: 'Not Submitted', color: C.red,     icon: I.clock  },
  { key: 'center_head',   label: 'Center Head',   color: '#e879f9', icon: I.star   },
  { key: 'vc',            label: 'VC Queue',      color: '#f472b6', icon: I.users  },
  { key: 'done',          label: 'Approved',      color: C.accent,  icon: I.check  },
];

// ── Stage descriptions ────────────────────────────────────────────────────────

const T_STAGE_DESC = {
  not_submitted: 'Form not yet filled or submitted',
  hod:           'Submitted — awaiting HOD review (SoEMR only)',
  director:      'With Director for review',
  dean:          'Director reviewed — with Dean',
  vc:            'Dean reviewed — with VC',
  done:          'VC approved — cycle complete',
};

const CISR_STAGE_DESC = {
  not_submitted: 'Form not yet filled or submitted',
  center_head:   'Submitted — awaiting Center Head review',
  vc:            'Center Head reviewed — with VC',
  done:          'VC approved — cycle complete',
};

// ── School-aware pipeline helpers ─────────────────────────────────────────────

// CISR uses Center Head instead of Director/Dean; SoEMR is the only school with HODs.
function getSchoolStages(schoolCode) {
  if (schoolCode === 'CISR')  return CISR_STAGES;
  if (schoolCode === 'SoEMR') return T_STAGES;
  return T_STAGES.filter(s => s.key !== 'hod');
}

function getSchoolStageKey(schoolCode) {
  if (schoolCode === 'CISR')  return CISR_STAGE_KEY;
  if (schoolCode === 'SoEMR') return STAGE_KEY;
  // For standard schools, 'Submitted' / 'Pending Review' means it's with the Director.
  return {
    'Pending Review':          'director',
    'Submitted':               'director',
    'Pending Director Review': 'director',
    'Pending Dean Review':     'dean',
    'Pending VC Review':       'vc',
    'Reviewed':                'done',
  };
}

const NT_STAGE_DESC = {
  not_submitted: 'Form not yet submitted',
  ro:            'Submitted — awaiting Reporting Officer review',
  registrar:     'RO reviewed — with Registrar',
  vc:            'Registrar reviewed — with VC',
  done:          'VC approved — cycle complete',
};

// ── Transparency rules ────────────────────────────────────────────────────────

function getTransparency(schoolCode, role) {
  if (schoolCode === 'CISR') {
    if (role === 'faculty') return [
      { reviewer: 'Center Head (CISR)', sees: 'Faculty self-score',                hides: null },
      { reviewer: 'VC',                 sees: 'Faculty + Center Head scores',       hides: null },
    ];
    if (role === 'center_head') return [
      { reviewer: 'VC', sees: 'Center Head self-score', hides: null },
    ];
    return [];
  }

  const track = SCHOOL_META[schoolCode]?.track;

  if (schoolCode === 'SoEMR') {
    if (role === 'faculty') return [
      { reviewer: 'HOD (dept-specific)',  sees: 'Faculty self-score',                      hides: null },
      { reviewer: 'Director (SoEMR)',     sees: 'Faculty self-score only',                 hides: 'HOD score hidden' },
      { reviewer: 'Dean of Engineering',  sees: 'Faculty self-score only',                 hides: 'HOD + Director scores hidden' },
      { reviewer: 'VC',                   sees: 'All 4 scores (Faculty · HOD · Director · Dean)', hides: null },
    ];
    if (role === 'hod') return [
      { reviewer: 'Director (SoEMR)',    sees: 'HOD self-score',        hides: null },
      { reviewer: 'Dean of Engineering', sees: 'HOD self-score only',   hides: 'Director score hidden' },
      { reviewer: 'VC',                  sees: 'HOD + Director + Dean', hides: null },
    ];
    if (role === 'director') return [
      { reviewer: 'Dean of Engineering', sees: 'Director self-score', hides: null },
      { reviewer: 'VC',                  sees: 'Director + Dean',     hides: null },
    ];
    if (role === 'dean') return [{ reviewer: 'VC', sees: 'Dean self-score', hides: null }];
  }

  if (track === 'engineering') {
    if (role === 'faculty') return [
      { reviewer: `Director (${schoolCode})`, sees: 'Faculty self-score',        hides: null },
      { reviewer: 'Dean of Engineering',      sees: 'Faculty self-score only',   hides: 'Director score hidden' },
      { reviewer: 'VC',                       sees: 'Faculty + Director + Dean', hides: null },
    ];
    if (role === 'director') return [
      { reviewer: 'Dean of Engineering', sees: 'Director self-score', hides: null },
      { reviewer: 'VC',                  sees: 'Director + Dean',     hides: null },
    ];
    if (role === 'dean') return [{ reviewer: 'VC', sees: 'Dean self-score', hides: null }];
  }

  if (track === 'non_engineering') {
    if (role === 'faculty') return [
      { reviewer: `Director (${schoolCode})`, sees: 'Faculty self-score',        hides: null },
      { reviewer: 'Dean of Non-Engineering',  sees: 'Faculty + Director scores', hides: null },
      { reviewer: 'VC',                       sees: 'All scores',                hides: null },
    ];
    if (role === 'director') return [
      { reviewer: 'Dean of Non-Engineering', sees: 'Director self-score', hides: null },
      { reviewer: 'VC',                      sees: 'Director + Dean',     hides: null },
    ];
    if (role === 'dean') return [{ reviewer: 'VC', sees: 'Dean self-score', hides: null }];
  }

  return [];
}

function getNTTransparency(role) {
  if (role === 'non_teaching_staff') return [
    { reviewer: 'Reporting Officer', sees: 'Staff self-score',                      hides: null },
    { reviewer: 'Registrar',         sees: 'Staff self-score only',                 hides: 'Reporting Officer score hidden' },
    { reviewer: 'VC',                sees: 'All 3 scores (Staff · RO · Registrar)', hides: null },
  ];
  if (role === 'reporting_officer') return [
    { reviewer: 'Registrar', sees: 'RO self-score',  hides: null },
    { reviewer: 'VC',        sees: 'RO + Registrar', hides: null },
  ];
  if (role === 'registrar') return [
    { reviewer: 'VC', sees: 'Registrar self-score', hides: null },
  ];
  return [];
}

// ── Module-level constants (stable references, never recreated) ───────────────

const TEACHING_ROLES_SET = new Set(['faculty', 'hod', 'director', 'dean', 'center_head']);
const NT_ROLES_SET        = new Set(['non_teaching_staff', 'reporting_officer', 'registrar']);
const TRACK_TABS = [
  { k: 'teaching',     label: 'Teaching Staff'     },
  { k: 'non_teaching', label: 'Non-Teaching Staff' },
];
const ROLE_COLORS = { faculty: C.accent, hod: '#a78bfa', director: C.yellow, dean: C.green, center_head: '#e879f9' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function stageCounts(pipeline, map) {
  const out = {};
  Object.entries(pipeline ?? {}).forEach(([stage, n]) => {
    const k = map[stage] ?? 'other';
    out[k] = (out[k] ?? 0) + (n ?? 0);
  });
  return out;
}

function routeLabel(schoolCode, role) {
  if (schoolCode === 'CISR') {
    if (role === 'faculty')     return 'Faculty → Center Head (CISR) → VC';
    if (role === 'center_head') return 'Center Head → VC';
    return '';
  }
  const isEng = ENGG_SCHOOL_CODES.includes(schoolCode);
  if (role === 'faculty' && schoolCode === 'SoEMR') return 'Faculty → HOD (dept) → Director (SoEMR) → Dean (Eng) → VC';
  if (role === 'faculty' && isEng)                  return `Faculty → Director (${schoolCode}) → Dean (Eng) → VC`;
  if (role === 'faculty')                           return `Faculty → Director (${schoolCode}) → Dean (Non-Eng) → VC`;
  if (role === 'hod')                               return 'HOD → Director (SoEMR) → Dean (Eng) → VC';
  if (role === 'director' && isEng)                 return `Director → Dean (Eng) → VC`;
  if (role === 'director')                          return `Director → Dean (Non-Eng) → VC`;
  if (role === 'dean')                              return 'Dean → VC';
  return '';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Av({ name, color, size = 28 }) {
  const init = (name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}1a`, border: `1.5px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.32), fontWeight: 700, color,
    }}>{init}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
      color: C.muted, marginBottom: 10, paddingBottom: 6,
      borderBottom: '1px solid rgba(255,255,255,.05)',
    }}>{children}</div>
  );
}

function TransPanel({ nodes, role, school, route }) {
  const TCOLS = ['#a78bfa', C.yellow, C.green, '#f472b6', C.accent];
  return (
    <>
      {nodes.length === 0 ? (
        <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
          No transparency rules for this selection
        </div>
      ) : nodes.map((node, i) => {
        const col = TCOLS[i] ?? C.muted;
        const isLast = i === nodes.length - 1;
        return (
          <div key={i} style={{ display: 'flex', gap: 9 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, marginTop: 2, flexShrink: 0 }} />
              {!isLast && <div style={{ width: 1.5, flex: 1, background: 'rgba(255,255,255,.07)', marginTop: 4, minHeight: 20 }} />}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 14, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: col }}>{node.reviewer}</div>
              <div style={{ fontSize: 10, color: C.green, marginTop: 2 }}>✓ {node.sees}</div>
              {node.hides && <div style={{ fontSize: 10, color: C.red, marginTop: 1 }}>✕ {node.hides}</div>}
            </div>
          </div>
        );
      })}
      {route && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)',
          fontSize: 10, color: C.muted, lineHeight: 1.65 }}>
          <span style={{ fontWeight: 700, color: C.subtle }}>Route: </span>{route}
        </div>
      )}
    </>
  );
}

// Vertical pipeline timeline — shows all stages simultaneously
function PipelineTimeline({ stages, stgCounts, stageGroups, hasFacultyStatus, isDept, stageDesc }) {
  return (
    <div>
      {stages.map((s, idx) => {
        const n           = stgCounts[s.key] ?? 0;
        const people      = stageGroups?.[s.key] ?? [];
        const showNames   = hasFacultyStatus || s.key === 'not_submitted';
        const displayList = showNames ? people : [];
        const isLast      = idx === stages.length - 1;
        const isActive    = n > 0;

        return (
          <div key={s.key} style={{ display: 'flex' }}>
            {/* Left: dot + vertical connector line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26, flexShrink: 0, paddingTop: 3 }}>
              <div style={{
                width: 11, height: 11, borderRadius: '50%', flexShrink: 0,
                background: isActive ? s.color : 'rgba(255,255,255,.1)',
                border: `2px solid ${isActive ? s.color : 'rgba(255,255,255,.12)'}`,
                boxShadow: isActive ? `0 0 8px ${s.color}55` : 'none',
              }} />
              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: displayList.length > 0 ? 36 : 22,
                  marginTop: 4,
                  background: isActive
                    ? `linear-gradient(to bottom, ${s.color}55, rgba(255,255,255,.05))`
                    : 'rgba(255,255,255,.06)',
                }} />
              )}
            </div>

            {/* Right: stage content */}
            <div style={{ flex: 1, paddingLeft: 10, paddingBottom: isLast ? 0 : (displayList.length > 0 ? 18 : 12) }}>
              {/* Stage header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: displayList.length > 0 ? 8 : 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: .4, textTransform: 'uppercase',
                  color: isActive ? s.color : 'rgba(255,255,255,.25)',
                }}>{s.label}</span>

                {/* Count badge */}
                <span style={{
                  fontSize: 13, fontWeight: 800, lineHeight: 1,
                  fontFamily: "'JetBrains Mono',monospace",
                  color: isActive ? s.color : 'rgba(255,255,255,.15)',
                  background: isActive ? `${s.color}18` : 'rgba(255,255,255,.03)',
                  border: `1px solid ${isActive ? `${s.color}35` : 'rgba(255,255,255,.06)'}`,
                  padding: '2px 9px', borderRadius: 20,
                }}>{n}</span>

                {/* Description for count-only view */}
                {!showNames && isActive && (
                  <span style={{ fontSize: 10, color: C.muted, fontStyle: 'italic' }}>
                    {stageDesc?.[s.key] ?? ''}
                  </span>
                )}
              </div>

              {/* Not-submitted or subStatusMap names */}
              {displayList.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,.02)', borderRadius: 9,
                  border: `1px solid ${s.color}18`, padding: '2px 0',
                }}>
                  {displayList.map((f, j) => {
                    const roleLabel = f.role && f.role !== 'faculty'
                      ? f.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      : null;
                    return (
                    <div key={f.email ?? j} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px',
                      borderBottom: j < displayList.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                    }}>
                      <Av name={f.name} color={s.color} size={24} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                          {[
                            f.designation !== '—' ? f.designation : null,
                            isDept && f.dept !== '—' ? f.dept : null,
                          ].filter(Boolean).join(' · ') || f.email}
                        </div>
                      </div>
                      {roleLabel && (
                        <span style={{
                          fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 8, flexShrink: 0,
                          background: 'rgba(255,255,255,.06)', color: C.muted,
                          textTransform: 'uppercase', letterSpacing: .4,
                        }}>{roleLabel}</span>
                      )}
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                        background: `${s.color}18`, color: s.color,
                      }}>{s.key === 'not_submitted' ? 'Pending' : s.label}</span>
                    </div>
                  );})}
                </div>
              )}

              {/* Count-only description when no names and stage has submissions */}
              {!showNames && isActive && stageDesc?.[s.key] && (
                <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                  {stageDesc[s.key]}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AppraisalCyclePage() {
  const [track,          setTrack]          = useState('teaching');
  const [selectedSchool, setSelectedSchool] = useState('SoCSEA');
  const [transRole,      setTransRole]      = useState('faculty');
  const [ntTransRole,    setNtTransRole]    = useState('non_teaching_staff');

  const { data: raw,        loading: sL, error: sErr, lastUpdated } = useFetch(() => api.stats.get(), [], { interval: AUTO_REFRESH_INTERVAL });
  const { data: rawUsers,   loading: uL } = useFetch(() => api.users.list(), [], { interval: AUTO_REFRESH_INTERVAL });
  const { data: rawPending, loading: pL } = useFetch(
    () => raw?.academic_year
      ? api.pending.list({ academic_year: raw.academic_year })
      : Promise.resolve(null),
    [raw?.academic_year],
    { interval: AUTO_REFRESH_INTERVAL },
  );
  // Per-faculty submission status — reuse marks endpoint (returns email + status for all faculty)
  const { data: rawSubs } = useFetch(
    () => raw?.academic_year
      ? api.marks.list(raw.academic_year, '').catch(() => null)
      : Promise.resolve(null),
    [raw?.academic_year],
    { interval: AUTO_REFRESH_INTERVAL },
  );

  const stats    = useMemo(() => normalizeStats(raw),            [raw]);
  const allUsers = useMemo(() => normalizeUsers(rawUsers ?? []), [rawUsers]);
  const loading  = sL || uL || pL;

  const subStatusMap = useMemo(() => {
    const map = {};
    if (Array.isArray(rawSubs)) rawSubs.forEach(s => { if (s.email) map[s.email] = s.status; });
    return map;
  }, [rawSubs]);

  const bySchoolPipeline = useMemo(() => raw?.by_school_submitted    ?? {}, [raw]);
  const bySchoolReg      = useMemo(() => raw?.by_school_registered   ?? {}, [raw]);
  const byDept           = useMemo(() => raw?.by_department_submitted ?? {}, [raw]);

  const pendingEmails = useMemo(() => {
    const arr = rawPending === null
      ? allUsers.filter(u => TEACHING_ROLES_SET.has(u.role))
      : (Array.isArray(rawPending) ? rawPending : []);
    return new Set(arr.map(f => f.email));
  }, [rawPending, allUsers]);

  const usersBySchool = useMemo(() => {
    const map = {};
    allUsers.forEach(u => {
      const sc = u.school !== '—' ? u.school : '__none__';
      if (!map[sc]) map[sc] = [];
      map[sc].push(u);
    });
    return map;
  }, [allUsers]);

  const tCounts = useMemo(() => {
    const tc = stageCounts(stats.pipeline, STAGE_KEY);
    tc['not_submitted'] = stats.pending;
    return tc;
  }, [stats]);

  const { ntCounts, ntUsers, ntPending, ntSubs, ntStageGroups, hasFacultyStatusNT } = useMemo(() => {
    const users   = allUsers.filter(u => NT_ROLES_SET.has(u.role));
    const pend    = users.filter(u => pendingEmails.has(u.email));
    const counts  = stageCounts(stats.nonTeachingPipeline, NT_STAGE_KEY);
    counts['not_submitted'] = pend.length;
    const subs      = users.filter(u => !pendingEmails.has(u.email));
    const hasStatus = subs.some(u => subStatusMap[u.email]);
    return {
      ntCounts: counts, ntUsers: users, ntPending: pend, ntSubs: subs, hasFacultyStatusNT: hasStatus,
      ntStageGroups: {
        not_submitted: pend,
        ro: hasStatus
          ? subs.filter(u => ['Pending RO Review', 'Draft'].includes(subStatusMap[u.email]))
          : [],
        registrar: hasStatus
          ? subs.filter(u => ['Pending Registrar Review', 'Reporting Officer Reviewed'].includes(subStatusMap[u.email]))
          : [],
        vc:   hasStatus ? subs.filter(u => subStatusMap[u.email] === 'Registrar Reviewed') : [],
        done: hasStatus ? subs.filter(u => subStatusMap[u.email] === 'VC Approved')        : [],
      },
    };
  }, [allUsers, pendingEmails, stats.nonTeachingPipeline, subStatusMap]);

  const {
    selMeta, selUsers, selFaculty, selHODs, selDirs, selCenterHeads,
    selNotSubmitted, selSubmitted,
    selPipeline, selSchoolStages, selStgCounts,
    selReg, selSub, selPct, barCol,
    hasFacultyStatus, isSoEMR, isCISR, stageGroups,
  } = useMemo(() => {
    const meta        = SCHOOL_META[selectedSchool] ?? {};
    const users       = usersBySchool[selectedSchool] ?? [];
    const faculty     = users.filter(u => u.role === 'faculty');
    const hods        = users.filter(u => u.role === 'hod');
    const dirs        = users.filter(u => u.role === 'director');
    const centerHeads = users.filter(u => u.role === 'center_head');
    const notSub      = faculty.filter(f =>  pendingEmails.has(f.email));
    const subm        = faculty.filter(f => !pendingEmails.has(f.email));

    // All teaching-role members who have submitted (faculty + HOD + director + dean + center_head)
    // Used for stage name lists so HODs/Directors/Deans appear in VC Queue etc.
    const allTeachingSubm = users.filter(u =>
      TEACHING_ROLES_SET.has(u.role) && !pendingEmails.has(u.email)
    );

    const pipeline    = bySchoolPipeline[selectedSchool] ?? {};
    const schoolKey    = getSchoolStageKey(selectedSchool);
    const schoolStages = getSchoolStages(selectedSchool);
    const stgCounts    = stageCounts(pipeline, schoolKey);
    stgCounts['not_submitted'] = notSub.length;
    const reg    = bySchoolReg[selectedSchool] ?? faculty.length;
    const sub    = Object.values(pipeline).reduce((s, n) => s + n, 0);
    const pct    = reg ? Math.round(sub / reg * 100) : 0;
    const col    = pct >= 80 ? `linear-gradient(90deg,${C.green},#059669)`
                 : pct >= 60 ? `linear-gradient(90deg,${C.accent},#2563eb)`
                 :             `linear-gradient(90deg,${C.yellow},#d97706)`;
    const hasStatus = allTeachingSubm.some(u => subStatusMap[u.email]);
    const isEMR     = selectedSchool === 'SoEMR';
    const isCISR    = selectedSchool === 'CISR';
    return {
      selMeta: meta, selUsers: users, selFaculty: faculty, selHODs: hods, selDirs: dirs,
      selCenterHeads: centerHeads,
      selNotSubmitted: notSub, selSubmitted: subm,
      selPipeline: pipeline, selSchoolStages: schoolStages,
      selStgCounts: stgCounts, selReg: reg, selSub: sub, selPct: pct, barCol: col,
      hasFacultyStatus: hasStatus, isSoEMR: isEMR, isCISR,
      stageGroups: {
        not_submitted: notSub,
        hod: isEMR && hasStatus
          ? allTeachingSubm.filter(u => ['Pending Review', 'Submitted'].includes(subStatusMap[u.email]))
          : [],
        center_head: isCISR && hasStatus
          ? allTeachingSubm.filter(u => ['Submitted', 'Pending Center Head Review'].includes(subStatusMap[u.email]))
          : [],
        director: hasStatus && !isCISR
          ? allTeachingSubm.filter(u => isEMR
              ? subStatusMap[u.email] === 'Pending Director Review'
              : ['Pending Review', 'Submitted', 'Pending Director Review'].includes(subStatusMap[u.email]))
          : [],
        dean: hasStatus && !isCISR
          ? allTeachingSubm.filter(u => subStatusMap[u.email] === 'Pending Dean Review')
          : [],
        vc:   hasStatus
          ? allTeachingSubm.filter(u => subStatusMap[u.email] === 'Pending VC Review')
          : [],
        done: hasStatus
          ? allTeachingSubm.filter(u => subStatusMap[u.email] === 'Reviewed')
          : [],
      },
    };
  }, [selectedSchool, usersBySchool, bySchoolPipeline, bySchoolReg, pendingEmails, subStatusMap]);

  const { transRoles, transNodes, transRoute } = useMemo(() => ({
    transRoles: selectedSchool === 'CISR'
      ? [{ k: 'faculty', label: 'Faculty' }, { k: 'center_head', label: 'Center Head' }]
      : selectedSchool === 'SoEMR'
        ? [{ k: 'faculty', label: 'Faculty' }, { k: 'hod', label: 'HOD' }, { k: 'director', label: 'Director' }, { k: 'dean', label: 'Dean' }]
        : [{ k: 'faculty', label: 'Faculty' }, { k: 'director', label: 'Director' }, { k: 'dean', label: 'Dean' }],
    transNodes: getTransparency(selectedSchool, transRole),
    transRoute: routeLabel(selectedSchool, transRole),
  }), [selectedSchool, transRole]);

  // ── Queue sidebar helper ──────────────────────────────────────────────────────
  const schoolQueueRow = (sc, col) => {
    const sPipeline = bySchoolPipeline[sc] ?? {};
    const sCounts   = stageCounts(sPipeline, getSchoolStageKey(sc));
    const notSubCnt = (usersBySchool[sc] ?? []).filter(u => u.role === 'faculty' && pendingEmails.has(u.email)).length;
    const badges = [
      { k: 'not_submitted', n: notSubCnt,                  c: C.red     },
      // HOD queue only meaningful for SoEMR
      ...(sc === 'SoEMR' ? [{ k: 'hod', n: sCounts['hod'] ?? 0, c: '#a78bfa' }] : []),
      // CISR uses Center Head instead of Director/Dean
      ...(sc === 'CISR'
        ? [{ k: 'center_head', n: sCounts['center_head'] ?? 0, c: '#e879f9' }]
        : [
            { k: 'director', n: sCounts['director'] ?? 0, c: C.yellow },
            { k: 'dean',     n: sCounts['dean']     ?? 0, c: C.green  },
          ]
      ),
      { k: 'vc',            n: sCounts['vc']       ?? 0,   c: '#f472b6' },
    ].filter(x => x.n > 0);
    const isActive = selectedSchool === sc;
    return (
      <div key={sc} onClick={() => setSelectedSchool(sc)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 8px', borderRadius: 7, marginBottom: 3, cursor: 'pointer',
        background: isActive ? `${col}0a` : 'rgba(255,255,255,.02)',
        border: `1px solid ${isActive ? `${col}30` : 'rgba(255,255,255,.05)'}`,
        transition: 'all .12s',
      }}>
        <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500,
          color: isActive ? col : C.subtle, fontFamily: "'JetBrains Mono',monospace" }}>{sc}</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {badges.map(x => (
            <span key={x.k} style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
              background: `${x.c}15`, color: x.c, fontFamily: "'JetBrains Mono',monospace" }}>{x.n}</span>
          ))}
          {badges.length === 0 && (
            <span style={{ fontSize: 9, color: C.muted, fontStyle: 'italic' }}>clear</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter">
      <PageHead
        title="Appraisal Cycle"
        sub={`${stats.academicYear ?? 'Current cycle'} · ${stats.total} registered · ${stats.submitted} submitted`}
        action={<LiveBadge lastUpdated={lastUpdated} />}
      />

      {/* Track tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {TRACK_TABS.map(t => (
          <button key={t.k} className="act-btn" onClick={() => setTrack(t.k)} style={{
            padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: track === t.k ? `${C.accent}14` : 'rgba(255,255,255,.03)',
            border: `1px solid ${track === t.k ? `${C.accent}40` : 'rgba(255,255,255,.08)'}`,
            color: track === t.k ? C.accent : C.subtle,
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <Loading />}
      {sErr    && <ApiError message={sErr} />}

      {!loading && !sErr && (
        <div key={track} style={{ animation: 'fadeUp .3s cubic-bezier(.22,1,.36,1) both' }}>

          {/* ══════════ TEACHING ══════════ */}
          {track === 'teaching' && (
            <>
              {/* Overall stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
                {[
                  { l: 'Total Faculty',  v: stats.total,           c: C.subtle },
                  { l: 'Submitted',      v: stats.submitted,        c: C.green  },
                  { l: 'Not Submitted',  v: stats.pending,          c: C.red    },
                  { l: 'Fully Approved', v: tCounts['done'] ?? 0,   c: C.accent },
                ].map((s, i) => (
                  <div key={s.l} className="glass card-appear" style={{ padding: '14px 18px', animationDelay: `${i * 45}ms` }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 6 }}>{s.l}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Main 2-column grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 268px', gap: 14, alignItems: 'start' }}>

                {/* ── Left: School detail + pipeline ── */}
                <div>

                  {/* School selector pills with submission % */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {ALL_SCHOOL_CODES.map(code => {
                      const isEngg   = ENGG_SCHOOL_CODES.includes(code);
                      const isNonEng = NON_ENGG_SCHOOL_CODES.includes(code);
                      const tagCol   = !isEngg && !isNonEng ? C.yellow : isEngg ? C.accent : C.green;
                      const reg      = bySchoolReg[code] ?? 0;
                      const sub      = Object.values(bySchoolPipeline[code] ?? {}).reduce((s, n) => s + n, 0);
                      const pct      = reg ? Math.round(sub / reg * 100) : 0;
                      const isActive = selectedSchool === code;
                      return (
                        <button key={code} onClick={() => setSelectedSchool(code)} className="act-btn" style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
                          border: `1px solid ${isActive ? tagCol : 'rgba(255,255,255,.08)'}`,
                          background: isActive ? `${tagCol}12` : 'rgba(255,255,255,.02)',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace",
                            color: isActive ? tagCol : C.muted }}>{code}</span>
                          {reg > 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: pct >= 80 ? C.green : pct >= 50 ? C.accent : C.yellow,
                              background: pct >= 80 ? 'rgba(52,211,153,.12)' : pct >= 50 ? 'rgba(59,130,246,.12)' : 'rgba(251,191,36,.12)',
                              padding: '1px 6px', borderRadius: 8,
                            }}>{pct}%</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected school card */}
                  <div className="glass" style={{ padding: '20px 22px' }}>

                    {/* School header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.accent,
                          fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>{selectedSchool}</div>
                        <div style={{ fontSize: 12, color: C.subtle }}>{selMeta.full}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                          Reports to: <span style={{ color: C.green, fontWeight: 600 }}>{selMeta.dean}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>Submission Rate</div>
                        <div style={{ fontSize: 28, fontWeight: 800,
                          color: selPct >= 80 ? C.green : selPct >= 60 ? C.accent : C.yellow,
                          fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{selPct}%</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{selSub} / {selReg} submitted</div>
                      </div>
                    </div>

                    <ProgressBar value={selPct} color={barCol} />

                    {/* Center Head — CISR only */}
                    {isCISR && selCenterHeads.length > 0 && (
                      <div style={{ marginTop: 16, marginBottom: 16 }}>
                        <SectionLabel>Center Head — CISR</SectionLabel>
                        {selCenterHeads.map((ch, j) => (
                          <div key={ch.email} style={{
                            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0',
                            borderBottom: j < selCenterHeads.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                          }}>
                            <Av name={ch.name} color='#e879f9' size={28} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{ch.name}</div>
                              {ch.designation !== '—' && (
                                <div style={{ fontSize: 10, color: C.muted }}>{ch.designation}</div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', marginRight: 6 }}>
                              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: .4 }}>CH Queue</div>
                              <div style={{ fontSize: 16, fontWeight: 800,
                                color: (selStgCounts['center_head'] ?? 0) > 0 ? '#e879f9' : C.muted,
                                fontFamily: "'JetBrains Mono',monospace" }}>
                                {selStgCounts['center_head'] ?? 0}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                              background: pendingEmails.has(ch.email) ? 'rgba(248,113,113,.12)' : 'rgba(52,211,153,.1)',
                              color: pendingEmails.has(ch.email) ? C.red : C.green }}>
                              {pendingEmails.has(ch.email) ? 'Not Submitted' : 'Submitted'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Director(s) — non-CISR schools */}
                    {!isCISR && selDirs.length > 0 && (
                      <div style={{ marginTop: 16, marginBottom: 16 }}>
                        <SectionLabel>Director{selDirs.length > 1 ? 's' : ''} — {selectedSchool}</SectionLabel>
                        {selDirs.map((dir, j) => (
                          <div key={dir.email} style={{
                            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0',
                            borderBottom: j < selDirs.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                          }}>
                            <Av name={dir.name} color={C.yellow} size={28} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{dir.name}</div>
                              {dir.designation !== '—' && (
                                <div style={{ fontSize: 10, color: C.muted }}>{dir.designation}</div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', marginRight: 6 }}>
                              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: .4 }}>Dir. Queue</div>
                              <div style={{ fontSize: 16, fontWeight: 800,
                                color: (selStgCounts['director'] ?? 0) > 0 ? C.yellow : C.muted,
                                fontFamily: "'JetBrains Mono',monospace" }}>
                                {selStgCounts['director'] ?? 0}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                              background: pendingEmails.has(dir.email) ? 'rgba(248,113,113,.12)' : 'rgba(52,211,153,.1)',
                              color: pendingEmails.has(dir.email) ? C.red : C.green }}>
                              {pendingEmails.has(dir.email) ? 'Not Submitted' : 'Submitted'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SoEMR: Department breakdown */}
                    {selectedSchool === 'SoEMR' && (
                      <div style={{ marginBottom: 18 }}>
                        <SectionLabel>Departments (SoEMR)</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {SOEMR_DEPTS.map(dept => {
                            const deptFac     = selFaculty.filter(f => f.dept === dept);
                            const deptHOD     = selHODs.find(h => h.dept === dept);
                            const deptPending = deptFac.filter(f =>  pendingEmails.has(f.email));
                            const deptSub     = deptFac.filter(f => !pendingEmails.has(f.email));
                            const deptCounts  = stageCounts(byDept[dept] ?? {}, STAGE_KEY);
                            const hodQ = deptCounts['hod'] ?? 0;
                            const dirQ = deptCounts['director'] ?? 0;
                            const shortDept = dept.replace(' Engineering', '');
                            return (
                              <div key={dept} style={{ padding: '11px 13px', borderRadius: 9,
                                background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 3 }}>{shortDept}</div>
                                {deptHOD ? (
                                  <div style={{ fontSize: 10, color: '#a78bfa', marginBottom: 6 }}>
                                    HOD: {deptHOD.name}
                                    <span style={{ marginLeft: 5, padding: '1px 5px', borderRadius: 8,
                                      background: pendingEmails.has(deptHOD.email) ? 'rgba(248,113,113,.12)' : 'rgba(52,211,153,.1)',
                                      color: pendingEmails.has(deptHOD.email) ? C.red : C.green, fontSize: 9 }}>
                                      {pendingEmails.has(deptHOD.email) ? 'pending' : 'submitted'}
                                    </span>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 10, color: C.muted, fontStyle: 'italic', marginBottom: 6 }}>No HOD</div>
                                )}
                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                  {deptSub.length > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                      background: 'rgba(52,211,153,.1)', color: C.green }}>{deptSub.length} submitted</span>
                                  )}
                                  {deptPending.length > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                      background: 'rgba(248,113,113,.1)', color: C.red }}>{deptPending.length} not submitted</span>
                                  )}
                                  {hodQ > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                      background: 'rgba(167,139,250,.12)', color: '#a78bfa' }}>{hodQ} @HOD</span>
                                  )}
                                  {dirQ > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                      background: 'rgba(251,191,36,.1)', color: C.yellow }}>{dirQ} @Director</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Appraisal Pipeline Timeline ── */}
                    <div style={{ marginTop: 18 }}>
                      <SectionLabel>Appraisal Pipeline — {selectedSchool}</SectionLabel>

                      {selFaculty.length === 0 ? (
                        <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                          No faculty registered for {selectedSchool}
                        </div>
                      ) : (
                        <>
                          <PipelineTimeline
                            stages={selSchoolStages}
                            stgCounts={selStgCounts}
                            stageGroups={stageGroups}
                            hasFacultyStatus={hasFacultyStatus}
                            isDept={isSoEMR}
                            stageDesc={isCISR ? CISR_STAGE_DESC : T_STAGE_DESC}
                          />

                          {/* Note when per-faculty names not yet available */}
                          {!hasFacultyStatus && selSubmitted.length > 0 && (
                            <div style={{
                              marginTop: 12, padding: '10px 13px', borderRadius: 8, fontSize: 11, lineHeight: 1.6,
                              color: C.muted, background: 'rgba(255,255,255,.025)',
                              border: '1px solid rgba(255,255,255,.06)',
                            }}>
                              Individual faculty names per stage will appear once the backend exposes{' '}
                              <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.subtle }}>
                                GET /api/v1/admin/submissions
                              </code>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Right sidebar ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Queue Overview */}
                  <Card title="Queue Overview" sub="Across all schools" delay={40}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, marginBottom: 6,
                        textTransform: 'uppercase', letterSpacing: .5 }}>Engineering</div>
                      {ENGG_SCHOOL_CODES.map(sc => schoolQueueRow(sc, C.accent))}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.green, marginBottom: 6,
                        textTransform: 'uppercase', letterSpacing: .5 }}>Non-Engineering</div>
                      {NON_ENGG_SCHOOL_CODES.map(sc => schoolQueueRow(sc, C.green))}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.yellow, marginBottom: 6,
                        textTransform: 'uppercase', letterSpacing: .5 }}>CISR</div>
                      {schoolQueueRow('CISR', C.yellow)}
                    </div>
                  </Card>

                  {/* Transparency Rules */}
                  <Card title="Transparency Rules" sub={`Score visibility · ${selectedSchool}`} delay={80}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                      {transRoles.map(r => {
                        const col = ROLE_COLORS[r.k] ?? C.muted;
                        const isAct = transRole === r.k;
                        return (
                          <button key={r.k} onClick={() => setTransRole(r.k)} className="act-btn" style={{
                            padding: '4px 10px', borderRadius: 14, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                            border: `1px solid ${isAct ? col : 'rgba(255,255,255,.08)'}`,
                            background: isAct ? `${col}14` : 'transparent',
                            color: isAct ? col : C.muted,
                          }}>{r.label}</button>
                        );
                      })}
                    </div>
                    <TransPanel nodes={transNodes} role={transRole} school={selectedSchool} route={transRoute} />
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* ══════════ NON-TEACHING ══════════ */}
          {track === 'non_teaching' && (
            <>
              {/* Stats chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
                {[
                  { l: 'Total Staff',    v: ntUsers.length,                      c: C.subtle },
                  { l: 'Submitted',      v: ntUsers.length - ntPending.length,   c: C.green  },
                  { l: 'Not Submitted',  v: ntPending.length,                    c: C.red    },
                  { l: 'Approved',       v: ntCounts['done'] ?? 0,               c: C.accent },
                ].map((s, i) => (
                  <div key={s.l} className="glass card-appear" style={{ padding: '14px 18px', animationDelay: `${i * 45}ms` }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 6 }}>{s.l}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 268px', gap: 14, alignItems: 'start' }}>

                {/* NT Pipeline card */}
                <div className="glass" style={{ padding: '20px 22px' }}>
                  <SectionLabel>Non-Teaching Appraisal Pipeline</SectionLabel>

                  {ntUsers.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                      No non-teaching staff registered
                    </div>
                  ) : (
                    <>
                      <PipelineTimeline
                        stages={NT_STAGES}
                        stgCounts={ntCounts}
                        stageGroups={ntStageGroups}
                        hasFacultyStatus={hasFacultyStatusNT}
                        isDept={false}
                        stageDesc={NT_STAGE_DESC}
                      />

                    </>
                  )}
                </div>

                {/* NT Transparency card */}
                <Card title="Transparency Rules" sub="Score visibility · Non-Teaching" delay={60}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      { k: 'non_teaching_staff', label: 'Staff'        },
                      { k: 'reporting_officer',  label: 'Rep. Officer' },
                      { k: 'registrar',          label: 'Registrar'    },
                    ].map(r => {
                      const col = { non_teaching_staff: C.accent, reporting_officer: '#a78bfa', registrar: C.yellow }[r.k] ?? C.muted;
                      const isAct = ntTransRole === r.k;
                      return (
                        <button key={r.k} onClick={() => setNtTransRole(r.k)} className="act-btn" style={{
                          padding: '4px 10px', borderRadius: 14, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${isAct ? col : 'rgba(255,255,255,.08)'}`,
                          background: isAct ? `${col}14` : 'transparent',
                          color: isAct ? col : C.muted,
                        }}>{r.label}</button>
                      );
                    })}
                  </div>
                  <TransPanel
                    nodes={getNTTransparency(ntTransRole)}
                    role={ntTransRole}
                    school={null}
                    route={
                      ntTransRole === 'non_teaching_staff' ? 'Staff → Reporting Officer → Registrar → VC'
                      : ntTransRole === 'reporting_officer' ? 'Reporting Officer → Registrar → VC'
                      : 'Registrar → VC'
                    }
                  />
                </Card>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
