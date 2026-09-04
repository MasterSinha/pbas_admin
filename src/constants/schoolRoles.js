// Fixed catalog of reviewer steps a school's approval chain can be built from.
// The admin composes an ORDERED chain per school by adding/removing/reordering
// these — VC is always the final, locked step (every appraisal ends at the VC).
//
// 'dean' auto-resolves at runtime to "Dean of Engineering" / "Dean of Non-Engineering"
// based on the school's track — there is one Dean per track, not per school.

import { I } from '../components/icons';

export const SCHOOL_CHAIN_CATALOG = [
  { key: 'hod',      label: 'HOD',      icon: I.users,  color: '#a78bfa', locked: false, requires: 'has_hod' },
  { key: 'director', label: 'Director', icon: I.key,    color: '#fbbf24', locked: false, requires: 'has_director' },
  { key: 'dean',     label: 'Dean',     icon: I.star,   color: '#34d399', locked: false, requires: null },
  { key: 'vc',       label: 'VC',       icon: I.shield, color: '#f472b6', locked: true,  requires: null },
];

export const SCHOOL_CHAIN_MAP = Object.fromEntries(SCHOOL_CHAIN_CATALOG.map(s => [s.key, s]));

export function deanLabelForTrack(track) {
  return track === 'engineering' ? 'Dean (Engineering)' : 'Dean (Non-Engineering)';
}

// Sensible starting chain derived from the two toggles — admin can still
// reorder or remove any non-locked step afterwards.
export function defaultChainFor(hasHod, hasDirector) {
  const chain = [];
  if (hasHod) chain.push('hod');
  if (hasDirector) chain.push('director');
  chain.push('dean');
  chain.push('vc');
  return chain;
}

export const SCHOOL_TRACKS = [
  { value: 'engineering',     label: 'Engineering',     icon: I.bldg,   color: '#3b82f6', desc: 'Routes to the Dean of Engineering' },
  { value: 'non_engineering', label: 'Non-Engineering', icon: I.school, color: '#34d399', desc: 'Routes to the Dean of Non-Engineering' },
];

// Appraisal forms a school can be assigned. This list is expected to grow — treat
// it as the seed of a future forms registry, not a hardcoded final set.
export const SCHOOL_FORMS = [
  { key: 'standard', label: 'Standard Appraisal', icon: I.doc,  color: '#3b82f6', desc: 'The default PBAS-style appraisal form used across most schools.' },
  { key: 'creative', label: 'Creative Form',       icon: I.idea, color: '#f472b6', desc: 'Alternate form for design / creative disciplines (e.g. School of Design).' },
];

// ── Auto-suggest a short code from a full school name ──────────────────────────
// e.g. "School of Bio-Engineering & Bio Science" -> "SoBES". Purely a starting
// point — the admin can always type over it; auto-fill stops as soon as they do.
const CODE_STOPWORDS = new Set(['school', 'of', 'the', 'and', 'for', 'in', 'a', 'an']);

export function suggestSchoolCode(fullName) {
  if (!fullName?.trim()) return '';
  const words = fullName
    .replace(/&/g, ' ')
    .split(/[\s,/-]+/)
    .map(w => w.replace(/[^a-zA-Z]/g, ''))
    .filter(Boolean);
  if (!words.length) return '';

  const lower = words.map(w => w.toLowerCase());
  const isSchoolOf = lower[0] === 'school' && lower[1] === 'of';
  const rest = (isSchoolOf ? words.slice(2) : words).filter(w => !CODE_STOPWORDS.has(w.toLowerCase()));
  const source = rest.length ? rest : words.filter(w => !CODE_STOPWORDS.has(w.toLowerCase()));
  const initials = (source.length ? source : words).map(w => w[0].toUpperCase()).join('');

  return isSchoolOf ? `So${initials}` : initials;
}
