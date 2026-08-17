import { useState, useEffect } from 'react';
import { api } from '../api/client';

// Fallback templates — used only when the API endpoint is unavailable.
// These are NOT business logic — they are a graceful degradation safety net.
// Once the backend workflow-template endpoint is deployed, these are never used.
const FALLBACK = {
  non_teaching_staff: {
    standard: [
      { stepNo: 1, designation: 'Reporting Officer', status: 'WAITING' },
      { stepNo: 2, designation: 'Registrar',         status: 'WAITING' },
      { stepNo: 3, designation: 'VC',                status: 'WAITING' },
    ],
    direct: [
      { stepNo: 1, designation: 'Registrar', status: 'WAITING' },
      { stepNo: 2, designation: 'VC',        status: 'WAITING' },
    ],
  },
  reporting_officer: [
    { stepNo: 1, designation: 'Registrar', status: 'WAITING' },
    { stepNo: 2, designation: 'VC',        status: 'WAITING' },
  ],
  registrar: [
    { stepNo: 1, designation: 'VC', status: 'WAITING' },
  ],
};

function getFallbackSteps(ntRole, reportsDirectly) {
  const fb = FALLBACK[ntRole];
  if (!fb) return [];
  if (ntRole === 'non_teaching_staff') return reportsDirectly ? fb.direct : fb.standard;
  return fb;
}

/**
 * Fetches the approval workflow template for an NT role.
 * Returns { steps, loading } where steps is an array of:
 *   { stepNo: number, designation: string, status: 'WAITING'|'PENDING'|'APPROVED'|'REJECTED' }
 *
 * Falls back to a static default when the API is unavailable — no error is surfaced to the user.
 */
export function useWorkflowTemplate(ntRole, reportsDirectly = false) {
  const [steps,   setSteps]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ntRole) { setSteps([]); return; }

    let cancelled = false;
    setLoading(true);

    api.workflow.getTemplate(ntRole, reportsDirectly)
      .then(data => {
        if (cancelled) return;
        const s = Array.isArray(data?.steps) ? data.steps : [];
        setSteps(s.length > 0 ? s : getFallbackSteps(ntRole, reportsDirectly));
      })
      .catch(() => {
        if (!cancelled) setSteps(getFallbackSteps(ntRole, reportsDirectly));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [ntRole, reportsDirectly]);

  return { steps, loading };
}
