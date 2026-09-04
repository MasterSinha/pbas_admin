import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SCHOOLS as LEGACY_SCHOOLS, SOEMR_DEPTS } from '../constants/schools';

// Normalizes a live /admin/schools row into the shape every school picker in
// this app consumes: { code, full, track, hasHod, hasDirector, departments, active }
function normalizeLive(s) {
  return {
    code: s.code,
    full: s.full_name,
    track: s.track, // 'engineering' | 'non_engineering'
    hasHod: !!s.has_hod,
    hasDirector: s.has_director !== false,
    departments: Array.isArray(s.departments) ? s.departments : [],
    defaultForm: s.default_form ?? 'standard',
    active: s.active !== false,
  };
}

// Same shape, derived from the hardcoded constants/schools.js fallback — kept
// byte-for-byte equivalent to today's behaviour (only SoEMR has HOD + depts).
function normalizeLegacy(s) {
  return {
    code: s.code,
    full: s.full,
    track: s.dean, // 'engineering' | 'non_engineering' | 'cisr'
    hasHod: !!s.hod,
    hasDirector: true,
    departments: s.code === 'SoEMR' ? SOEMR_DEPTS : [],
    defaultForm: 'standard',
    active: true,
  };
}

/**
 * Live-schools-with-graceful-fallback hook.
 *
 * Tries GET /admin/schools first (the dynamic Schools feature). If that
 * endpoint isn't deployed yet (404/500/network error) or simply has no rows,
 * falls back to the hardcoded constants/schools.js list — so every school
 * picker in the app keeps working exactly as before until the backend ships,
 * and switches over automatically the moment it does. No error is surfaced
 * to the user either way.
 */
export function useSchools() {
  const [live, setLive] = useState(null); // null = not resolved yet; [] | array = resolved
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.schools.list()
      .then(data => { if (!cancelled) setLive(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setLive(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const usingLive = Array.isArray(live) && live.length > 0;
  const schools = usingLive
    ? live.map(normalizeLive).filter(s => s.active)
    : LEGACY_SCHOOLS.map(normalizeLegacy);

  return {
    schools,
    loading,
    source: usingLive ? 'live' : 'legacy',
    engineering: schools.filter(s => s.track === 'engineering'),
    nonEngineering: schools.filter(s => s.track === 'non_engineering'),
    byCode: code => schools.find(s => s.code === code),
  };
}
