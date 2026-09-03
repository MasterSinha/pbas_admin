# Reporting Officer — self‑appraisal routing (`reports_to_registrar`)

**Status:** Admin UI ✅ ready · Appraisal frontend ✅ done (lint/build/`verify:hierarchy` pass) · **Backend ⏳ remaining**.
**Owner of this doc:** Admin UI. **Action needed from:** backend dev.

"Straight to the VC" for a Reporting Officer is currently **inert** until the backend does BOTH:
1. returns `reports_to_registrar: false` on the RO profile from `/auth/login` + `GET /auth/me`, and
2. honours it in server‑side status transitions **and** `/non-teaching/subordinates` queue routing.
Everything defaults to legacy (`RO → Registrar → VC`) until then, so nothing is broken in the meantime.

---

## 1. Background

The Admin panel ("Add User" → Non‑Teaching → **Reporting Officer** → *Approval Path* step)
now lets an admin choose how a Reporting Officer's **own** yearly appraisal is routed:

| Choice in Admin UI | `reports_to_registrar` | `registrar_email` | Intended chain |
|---|---|---|---|
| **Through the Registrar** (default) | `true` | `<selected email>` or `null` | `Reporting Officer → Registrar → VC` |
| **Straight to the VC** | `false` | `null` | `Reporting Officer → VC` |

These are the **same two fields** already used for `non_teaching_staff`.
The Admin UI persists them via `POST /api/v1/admin/users` and `PUT /api/v1/admin/users/{email}`.

**Problem today:** a Reporting Officer's chain is hard‑coded to `RO → Registrar → VC` on the
appraisal frontend, and the flag is dropped at login. A "Straight to the VC" RO still gets a
Registrar step in status, routing, review columns and the fallback timeline. `reports_to_registrar`
branching currently exists **only** for `role === "non_teaching_staff"`.

Goal: a Reporting Officer created with **"Straight to the VC"** must have **no Registrar step
anywhere** in their own appraisal lifecycle; one created with **"Through the Registrar"** routes to
the assigned (or default) Registrar before the VC.

---

## 2. Data contract (all three layers must agree)

- User record carries `reports_to_registrar: boolean` and `registrar_email: string | null`.
- Valid for roles: `non_teaching_staff` **and** `reporting_officer`.
- For `reporting_officer`:
  - `reports_to_registrar = false` ⇒ self‑appraisal chain is `["self", "vc"]`, first pending
    status after self‑submit is `PENDING_VC_REVIEW`, RO must **not** appear in any Registrar queue.
  - `reports_to_registrar = true` ⇒ chain `["self", "registrar", "vc"]`, status
    `PENDING_REGISTRAR_REVIEW`, Registrar is the next reviewer.
  - `registrar_email` non‑null ⇒ that specific user is the Registrar reviewer.
    `registrar_email` null ⇒ fall back to the institution default Registrar.
- **Backfill:** every existing `reporting_officer` row must be treated as
  `reports_to_registrar = true` (preserves current behaviour). Do a data migration or default at
  read time — do not let a missing/`null` flag mean "direct to VC".

---

## 3. Appraisal‑frontend changes — ✅ DONE

Implemented. Summary of what landed (for backend context):

- `roReportsToRegistrar(source)` / `readReportsToRegistrarFlag(source)` in
  `src/constants/nonTeachingHierarchy.js`. **RO default = `true`** (opposite of NTS) so existing ROs
  are never silently re‑routed. Tolerant of nested `profile` / `form` / `payload` / `info` shapes.
- `src/auth/session.js` `storeUserSession` now persists `reports_to_registrar` **and**
  `registrar_email` for `reporting_officer` (was force‑`"false"` unless NTS). NTS logic byte‑for‑byte
  unchanged.
- All 7 call sites branched (`getReviewChain`, `nonTeachingReviewFlow`, `statusAfterSelfSubmit`,
  `submitNonTeachingSelfAppraisal` now calls `statusAfterSelfSubmit`, `canReviewNonTeachingItem`,
  timeline synth, plus `canAuthorityReviewProfile`). Form/queue normalizers compute
  `reports_to_registrar` RO‑aware so downstream reads aren't poisoned by a computed `false`.
- Registrar review column, VC score transparency, and closed‑year self‑report timeline all now
  derive from the chain builders — no phantom Registrar step for a direct‑to‑VC RO.
- `registrar_email` plumbed through session + form normalization for backend use; no name rendering
  exists today so nothing further on the frontend.
- **Not changed** (intentional): `reviewerStatus` / `expectedPendingStatus(es)` — those key on the
  reviewer role for the "RO reviews an NTS" path, not the RO‑as‑subject path.

**Frontend's open dependency on backend:** it cannot verify that `/auth/login` + `GET /auth/me`
return `reports_to_registrar` for a `reporting_officer` — the documented profile shape
(`frontend_api_reference.md`) doesn't list it, and `api-integration-guide.md:106` describes the
bypass for `non_teaching_staff` only.

<details>
<summary>Original implementation prompt (kept for reference)</summary>

> Implementation prompt — hand this to the appraisal‑frontend dev (or an agent working in that repo).

**Task:** make the Reporting Officer's own appraisal chain honour `reports_to_registrar`, exactly
as `non_teaching_staff` already does. Nothing new UI‑wise — the RO does not choose their own path;
the value comes from their profile (set by an admin).

### 3.1 Add a shared helper

Create `roReportsToRegistrar(profile)` next to the existing `nonTeachingReportsToRegistrar`:

```js
// true  => RO self-appraisal goes RO -> Registrar -> VC   (default / legacy)
// false => RO self-appraisal goes RO -> VC directly
export function roReportsToRegistrar(profile) {
  // default TRUE when unknown, to preserve legacy behaviour
  const v = profile?.reports_to_registrar ?? profile?.reportsToRegistrar;
  if (v === undefined || v === null || v === '') return true;
  return v === true || v === 'true' || v === 1 || v === '1';
}
```

Use `profileFromSessionStorage()` (or whatever the NTS path uses) as the profile source so both
roles read the flag the same way.

### 3.2 Fix the login/session stomp — **blocker, do this first**

`session.js` `storeUserSession` (~line 194) forces `reports_to_registrar` to `"false"` unless
`role === "non_teaching_staff"`, so the backend value on an RO profile is discarded at login and
`profileFromSessionStorage()` (`hierarchy.js` ~329) can never see it.

- Persist `reports_to_registrar` (and `registrar_email`) into session for
  `role === "reporting_officer"` too.
- Confirm the login / `GET /auth/me` response actually contains the field for an RO (see §4) —
  if not, this is blocked on backend.

### 3.3 Branch the seven call sites

| # | File / function | Currently | Change to |
|---|---|---|---|
| 1 | `hierarchy.js` `getReviewChain` (~L87) | `if (role === "reporting_officer") return ["registrar", "vc"]` | `return roReportsToRegistrar(profile) ? ["registrar", "vc"] : ["vc"]` |
| 2 | `nonTeachingWorkflow.js` `nonTeachingReviewFlow` (~L707) | `if (subjectRole === "reporting_officer") return ["self", "registrar", "vc"]` | `... ? ["self", "registrar", "vc"] : ["self", "vc"]` |
| 3 | `nonTeachingWorkflow.js` `statusAfterSelfSubmit` (~L585) | RO → `PENDING_REGISTRAR_REVIEW` | `... ? PENDING_REGISTRAR_REVIEW : PENDING_VC_REVIEW` |
| 4 | `nonTeachingWorkflow.js` `reviewerStatus` / `expectedPendingStatus(es)` (~L598, L608) | assume Registrar is next after RO self | conditional on the flag |
| 5 | `nonTeachingWorkflow.js` `submitNonTeachingSelfAppraisal` (~L884) | hard‑codes `status = PENDING_RO_REVIEW` for every role, never calls `statusAfterSelfSubmit` | call `statusAfterSelfSubmit(role, form)` and use its result |
| 6 | `nonTeachingWorkflow.js` `canReviewNonTeachingItem` (~L733‑753) | a Registrar can always review an RO subject | exclude `reports_to_registrar === false` ROs from the Registrar queue |
| 7 | `nonTeachingWorkflow.js` timeline synthesis `nonTeachingWorkflowFor` (~L840+) | when backend returns no steps, synthesizes from `nonTeachingReviewFlow` → Registrar always shown | inherits the fix from #2; verify the synthesized `ApprovalStepCards` timeline drops the Registrar step for direct‑to‑VC ROs |

### 3.4 Labels / columns / transparency that assume `RO → Registrar → VC`

Re‑check after the above — these derive from the chain builders and should follow automatically,
but verify:

- Status string "Pending Registrar Review" is not shown for a direct‑to‑VC RO.
- `visibleNonTeachingReviewRoles("reporting_officer", …)` and the `showRegistrar` review‑table
  column (`NonTeachingStaffDashboard.jsx` ~L1128 / ~L1196) — Registrar column must not render for a
  direct‑to‑VC RO subject.
- `visiblePreviousReviewRoles` / VC score‑transparency slicing (`getReviewChain`) — VC must not
  expect a Registrar score/total for a direct‑to‑VC RO.
- The workflow timeline (`ApprovalStepCards`) fallback — no phantom Registrar step.

### 3.5 `registrar_email`

The appraisal frontend currently never references `registrar_email` (0 hits in `src/`). Per‑subject
registrar selection and default‑registrar fallback are **backend responsibility** (§4). No frontend
change needed unless you display the reviewer's name — in which case read `registrar_email` from the
subject's profile when present.

### 3.6 Acceptance criteria (appraisal frontend)

- [ ] `roReportsToRegistrar(profile)` returns `true` for a legacy RO with no flag.
- [ ] An RO whose profile has `reports_to_registrar: false`:
  - self‑submit sets status `PENDING_VC_REVIEW` (not `PENDING_REGISTRAR_REVIEW`);
  - does not appear in any Registrar review queue;
  - review chain / timeline / transparency show `RO → VC` with **no** Registrar step;
  - VC sees the RO self‑score and can submit final review with no missing‑Registrar error.
- [ ] An RO whose profile has `reports_to_registrar: true` behaves exactly as today.
- [ ] Existing `non_teaching_staff` behaviour is unchanged.

</details>

---

## 4. Backend changes

> Hand this to the backend dev. Non‑teaching self‑submit sends only
> `{academic_year, payload, status}` — routing is computed server‑side — so the RO chain almost
> certainly needs a backend branch too.

### 4.1 Persist the fields for `reporting_officer`

- `POST /api/v1/admin/users` and `PUT /api/v1/admin/users/{email}` must accept and store
  `reports_to_registrar` and `registrar_email` when `appraisal_role == "reporting_officer"`
  (today likely whitelisted only for `non_teaching_staff`). Check the request schema / serializer /
  field allow‑list.
- `GET /api/v1/admin/users` should return both fields for RO rows (Admin UI already reads them).

### 4.2 Expose the flag at auth time

- Login response and `GET /api/v1/auth/me` must include `reports_to_registrar` (and ideally
  `registrar_email`) in the profile object for `reporting_officer` users, not just
  `non_teaching_staff`. Without this the appraisal frontend's §3.2 fix has nothing to read.

### 4.3 Chain computation for RO self‑appraisal

- Wherever the server computes the non‑teaching review chain / next reviewer / pending status for a
  **self‑submitted** appraisal, add the `reporting_officer` case:
  - `reports_to_registrar == true` → `RO(self) → Registrar → VC`, first pending
    `PENDING_REGISTRAR_REVIEW`.
  - `reports_to_registrar == false` → `RO(self) → VC`, first pending `PENDING_VC_REVIEW`,
    **no Registrar transition** is ever valid for this appraisal.
- The Registrar‑review endpoints must reject / not surface a direct‑to‑VC RO's appraisal.
- The VC final‑review step must accept an RO appraisal that has no Registrar review recorded when
  `reports_to_registrar == false`.

### 4.4 `registrar_email` resolution

- When `registrar_email` is set on the RO's profile, that user is the Registrar reviewer for their
  self‑appraisal.
- When it is `null`/blank, fall back to the institution's default Registrar.
  **Confirm a default‑Registrar concept exists** — the Admin UI hint says "Leave blank to use the
  institution's default Registrar." If there is no default, either make `registrar_email` required
  for the "Through the Registrar" choice (tell Admin UI) or define the default.

### 4.5 Migration

- Backfill existing `reporting_officer` rows with `reports_to_registrar = true` (or default at read
  time). A missing value must never be interpreted as "direct to VC".

### 4.6 Acceptance criteria (backend)

- [ ] Creating/updating an RO via the admin endpoints round‑trips both fields.
- [ ] `/auth/login` and `/auth/me` return `reports_to_registrar` (and `registrar_email`) for an RO.
- [ ] Server‑computed chain for a `reports_to_registrar=false` RO self‑appraisal never includes a
      Registrar step or `PENDING_REGISTRAR_REVIEW` status.
- [ ] `/non-teaching/subordinates` (Registrar's queue) does not surface a direct‑to‑VC RO's appraisal;
      the VC's queue picks it up straight after self‑submit.
- [ ] `registrar_email` (when set) selects that Registrar; blank falls back to default.
- [ ] Existing RO appraisals (pre‑migration) keep the Registrar step.

### 4.7 Implementation prompt (paste into the backend repo)

```
TASK: Honour `reports_to_registrar` for the `reporting_officer` role in non-teaching
appraisal routing — today it only works for `non_teaching_staff`.

MEANING
  reporting_officer, reports_to_registrar = true  (or missing) -> RO(self) -> Registrar -> VC   [legacy]
  reporting_officer, reports_to_registrar = false              -> RO(self) -> VC directly (NO Registrar)
`registrar_email` (nullable str) on the RO profile names the specific Registrar; blank = default.

The admin panel already sends `reports_to_registrar` + `registrar_email` on
POST/PUT /api/v1/admin/users for reporting_officer. The appraisal frontend already branches on
the flag and defaults unknown -> true. Backend is the last gap.

1. PERSIST — POST/PUT /api/v1/admin/users and GET /api/v1/admin/users must accept/return
   `reports_to_registrar` (bool) and `registrar_email` (str|null) when
   appraisal_role == "reporting_officer". Check the pydantic model / serializer field allow-list —
   it's likely gated to non_teaching_staff.

2. AUTH — include `reports_to_registrar` and `registrar_email` in the profile object returned by
   /api/v1/auth/login and /api/v1/auth/me for reporting_officer users (not just NTS).

3. CHAIN / STATUS — wherever the server computes the non-teaching review chain, next reviewer, or
   pending status for a SELF-submitted appraisal, add the reporting_officer branch:
     reports_to_registrar == true  -> chain RO->Registrar->VC, first status PENDING_REGISTRAR_REVIEW
     reports_to_registrar == false -> chain RO->VC,            first status PENDING_VC_REVIEW,
                                      and NO Registrar transition is ever valid for that appraisal
   Registrar-review endpoints must 403/skip a direct-to-VC RO appraisal.
   VC final-review must accept an RO appraisal with no Registrar review recorded when the flag is false.

4. QUEUE ROUTING — /api/v1/non-teaching/subordinates (Registrar's pending queue) must exclude
   reporting_officer subjects whose reports_to_registrar == false. The VC's queue must include them
   immediately after self-submit.

5. registrar_email — when set, that user is the Registrar reviewer for the RO's self-appraisal.
   When null/blank, fall back to the institution default Registrar. CONFIRM a default-Registrar
   concept exists; if not, reply so the admin UI can make the field required for the
   "Through the Registrar" choice.

6. MIGRATION — backfill existing reporting_officer rows with reports_to_registrar = true (or default
   at read time). A missing/null value must NEVER mean "direct to VC".

CONSTRAINTS
  - Do not change non_teaching_staff behaviour.
  - Unknown/missing flag => treat as true (legacy).

ACCEPTANCE
  [ ] Admin create/update of an RO round-trips both fields
  [ ] /auth/login + /auth/me return reports_to_registrar for an RO
  [ ] reports_to_registrar=false RO self-submit -> PENDING_VC_REVIEW, never PENDING_REGISTRAR_REVIEW
  [ ] direct-to-VC RO absent from /non-teaching/subordinates, present in VC queue
  [ ] registrar_email selects that Registrar; blank -> default
  [ ] pre-migration RO appraisals keep the Registrar step
```

---

## 5. Admin UI — current state (reference, no action)

- `AddFacultyPage.jsx` → `RO_PATH_PRESETS`, `roViaRegistrar` state.
- Payload for `reporting_officer`:
  ```js
  {
    ...form,
    reports_to_registrar: roViaRegistrar,          // true | false
    reporting_officer_email: null,
    registrar_email: roViaRegistrar ? (form.registrar_email || null) : null,
  }
  ```
- `registrar_email` is optional in the Admin UI (blank ⇒ backend default — see §4.4).
- Right‑panel "Appraisal Journey" and the summary/receipt already reflect the chosen RO path.
- No further Admin UI change is required once §3 and §4 land. If the backend cannot support a
  default Registrar, tell Admin UI and the field will be made required for the "Through the
  Registrar" option.
