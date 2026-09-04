# Dynamic Schools — admin-managed school catalog

**Status:** Admin UI ✅ phase 1 built (list + create + edit, against a proposed contract) · **Backend ⏳ endpoint doesn't exist yet**.
**Owner of this doc:** Admin UI. **Action needed from:** backend dev, then appraisal‑frontend dev.

The Admin UI ships a fully working **Schools** page today (sidebar → *Schools*), but it calls
`/api/v1/admin/schools`, which doesn't exist yet. Until it's deployed, the page shows a
"backend endpoint not deployed" state plus a read‑only view of the current hardcoded list, exactly
like `Designations` did before its endpoint landed.

---

## 1. Why

Schools were a hardcoded array (`src/constants/schools.js`) baked into the appraisal flow logic —
adding a school meant a code change. Every school in this institution is either **Engineering** or
**Non‑Engineering**, and each routes to one Dean per track — so the fix is a **dynamic school list**
with a **per‑school ordered approval chain**, not a fully custom workflow engine. See the discussion
that led here for the full reasoning (options considered: fixed 3 routing patterns vs. free‑form
chains — landed on: dynamic list + ordered chain builder from a **fixed role catalog**).

**Update:** Standard Appraisal and Creative Form already exist as real, built forms in the appraisal
frontend today — this is not a form‑builder problem. What's actually needed is much smaller: let the
admin **assign which of the two existing forms** a school uses, and have the appraisal frontend
**read that assignment** instead of whatever hardcoded rule currently decides it. That's now **in
scope** for phase 1 — see §2's `default_form` field and §6a. Only the **visual form builder** (admin
creating brand‑new form types with their own fields) stays out of scope — see §5.

---

## 2. Data model

```
School {
  code            string    "SoXX" — unique, immutable after creation
  full_name       string    "School of ..."
  track           "engineering" | "non_engineering"
  has_hod         bool      school has an HOD layer between Faculty and Director/Dean
  has_director    bool      school has a Director layer between HOD/Faculty and Dean
  approval_chain  string[]  ORDERED list of catalog keys — see §3. Admin-composed, not derived
                            purely from has_hod/has_director (those just seed a sensible default;
                            the admin can reorder/remove any non-locked step).
  departments     string[]  optional — used for HOD assignment / faculty dept picker
  default_form    "standard" | "creative"   which of the two EXISTING appraisal forms this
                            school's faculty fill out. Not a form builder — both forms already
                            exist in the appraisal frontend; this just says which one applies.
                            Treat as an enum that may grow (a 3rd form later is a new enum value,
                            not a new concept) — see §6a.
  active          bool      inactive schools are hidden from pickers, kept for history
  order           int       optional — display order (backend may auto-assign)
}
```

### Chain catalog (fixed — admin cannot invent new step types in phase 1)

| key | label | notes |
|---|---|---|
| `hod` | HOD | only offered when `has_hod = true` |
| `director` | Director | only offered when `has_director = true` |
| `dean` | Dean | **resolves at read time** to "Dean of Engineering" or "Dean of Non‑Engineering" based on `track` — there is one Dean per track, not per school |
| `vc` | VC | **locked** — always present, always the last step, cannot be removed or reordered |

Example chains the admin can produce:
- `["hod","director","dean","vc"]` — full layer school
- `["director","dean","vc"]` — no HOD
- `["hod","dean","vc"]` — no Director (HOD reviews go straight to the Dean)
- `["dean","vc"]` — no HOD, no Director (Faculty → Dean → VC)

The **admin UI enforces** VC as locked/last and only offers `hod`/`director` as addable when their
matching toggle is on, **and keeps `has_hod`/`has_director` in sync if the admin removes that step
directly from the chain** (removing "HOD" from the chain list also flips `has_hod` off, not just the
other way round — a real bug caught in review, fixed in the UI). Backend should validate the same,
**bidirectionally**, on write (defense in depth):
- every `approval_chain` must end in `"vc"`
- `"hod"` present in `approval_chain` ⇔ `has_hod == true` (not just "allowed when true" — must be
  present when true, and absent when false)
- `"director"` present in `approval_chain` ⇔ `has_director == true`, same rule

Without the ⇔ direction, a client could send `has_hod: true` with no `"hod"` step in the chain and
the record would look internally inconsistent to anything reading `has_hod` as a shortcut instead of
inspecting the chain (e.g. a future "schools with an HOD layer" report).

---

## 3. Endpoints needed

| Method | Path | Body / Notes |
|---|---|---|
| `GET` | `/api/v1/admin/schools` | list all schools (the Admin UI's list page + eventually every school picker across the app) |
| `POST` | `/api/v1/admin/schools` | create — full `School` object minus generated fields |
| `PUT` | `/api/v1/admin/schools/{code}` | update — same shape; `code` itself is immutable (send the rest) |
| `DELETE` | `/api/v1/admin/schools/{code}` | delete — should fail (409) if faculty/users currently reference this `code` as their `school`, same pattern as designation delete guarding template usage |

Validation on write:
- `code` unique, non‑empty, immutable after create. **Normalize case** (the admin UI always
  uppercases what it sends, but validate/store consistently so `"SoD"` and `"sod"` can't become two
  different schools).
- `track` ∈ `{engineering, non_engineering}`.
- `approval_chain` ends with `"vc"`; `"hod"` present **iff** `has_hod`; `"director"` present **iff**
  `has_director` (bidirectional — see §2); no duplicate keys.
- `full_name` required.

**Auth:** `POST`/`PUT`/`DELETE` require the same admin/super_admin Bearer‑token auth as every other
`/admin/*` endpoint in this API. **`GET` needs a decision**, not an assumption — the appraisal
frontend (used by faculty/RO/Dean/VC, none of whom hold an admin token) also needs to read school
data per §6/§6a. Pick one before building:
1. `GET /api/v1/admin/schools` stays admin‑only, and a **separate non‑admin‑scoped read path** is
   added for the appraisal frontend (mirrors how `/non-teaching/workflow-template` already exposes
   resolved NT config without requiring admin auth).
2. `GET /api/v1/admin/schools` is readable by **any authenticated user**, not just admins (simplest,
   if school data isn't considered sensitive).
3. Resolved school config (track/chain/`default_form`) is **embedded directly in the user's own
   profile/login response** server‑side, so the appraisal frontend never calls a schools endpoint at
   all — it already has what it needs for that one user.
Whichever is chosen, tell the appraisal‑frontend dev before they start §6/§6a — their implementation
depends on it.

**Deactivate vs. delete — different rules:**
- **`active: false`** (via `PUT`) must be **allowed even if faculty currently reference this school**
  — it only hides the school from *new* assignments; existing faculty keep working normally. Do not
  block this the way delete is blocked below.
- **`DELETE`** must still 409 if any user references the code, as already stated.

---

## 4. Migration — seed the existing 10 hardcoded schools

Backfill from `src/constants/schools.js` so nothing breaks on cutover. **`default_form` values below
are a guess (School of Design → creative, everything else → standard)** — do NOT trust this table for
that column; §6a Step 1 requires actually finding today's real rule in the appraisal frontend and
using that instead, so no faculty member's form changes silently.

| code | full_name | track | has_hod | has_director | approval_chain | departments | default_form (verify!) |
|---|---|---|---|---|---|---|---|
| SoCSEA | School of Computer Science & Applications | engineering | false | true | `[director,dean,vc]` | — | standard |
| SoBB | School of Bio‑Engineering & Bio Science | engineering | false | true | `[director,dean,vc]` | — | standard |
| SoCE | School of Continual Education | engineering | false | true | `[director,dean,vc]` | — | standard |
| SoEMR | School of Engineering, Management & Research | engineering | **true** | true | `[hod,director,dean,vc]` | Mechanical Engineering, Civil Engineering, Chemical Engineering, Semiconductor Engineering | standard |
| SoCM | School of Commerce & Management | non_engineering | false | true | `[director,dean,vc]` | — | standard |
| SoMCS | School of Media & Communication Studies | non_engineering | false | true | `[director,dean,vc]` | — | standard |
| SoHSS | School of Humanities and Social Sciences | non_engineering | false | true | `[director,dean,vc]` | — | standard |
| SoD | School of Design | non_engineering | false | true | `[director,dean,vc]` | — | **creative (guess — verify!)** |
| SoAA | School of Applied Arts | non_engineering | false | true | `[director,dean,vc]` | — | **creative? (guess — verify!)** |
| CISR | Center for Interdisciplinary Studies & Research | *(legacy — see below)* | false | false | `[vc]` via Center Head | — | standard |

**CISR is a special case** — it's a "Center", not a school on either track, and today routes
`Faculty (CISR) → Center Head → VC` (its own dean‑equivalent role, "Center Head", not a track Dean).
It does **not** fit the `engineering`/`non_engineering` + `dean` model cleanly. Recommend: keep CISR
as a **legacy hardcoded exception** (the appraisal frontend already special‑cases `track === 'cisr'`
in `computeFlow`) rather than forcing it into the new model — don't let it block shipping schools 1‑9
as clean, dynamic, track‑based rows. Revisit CISR's shape only if more Center‑type entries are
needed later.

---

## 5. Out of scope for this phase (tell nobody to build these yet)

- **Visual form builder** (admin defines fields/sections/scoring for a brand‑new form type) — large,
  own project; the `developer/sandbox/FormBuilderTab` experiment is a starting point, not a plan.
- **Per‑role form overrides** (e.g. SoD faculty get Creative but SoD directors get Standard) — the
  admin UI only sets one `default_form` per school right now. Add per‑role overrides later if a real
  case needs it; don't build it speculatively.
- Free‑form/custom chain steps beyond the 4‑item catalog — not needed since every school is
  Engineering or Non‑Engineering with the same 4 possible layers.

---

## 6. Appraisal‑frontend changes (once the endpoint exists)

- Replace hardcoded school lists / `dean`‑track branching with a fetch from whichever read path
  backend settles on for §3's auth question (admin‑only `GET /api/v1/admin/schools` won't work for
  faculty/RO/Dean/VC sessions — confirm the actual path with backend before wiring this up).
- `computeFlow`‑equivalent logic should read `has_hod`, `has_director`, `approval_chain`, `track`
  per school instead of hardcoded `if (school === 'SoEMR')` branches.
- CISR stays hardcoded per §4 unless/until it's modeled properly.

---

## 6a. Wiring up the existing Standard / Creative forms

Both forms already exist and render correctly — the only missing piece is **what currently decides
which one a faculty member sees**, and replacing that with a read of the school's `default_form`.
Nobody on this side of the project knows how that decision is made today (a hardcoded school‑code
check? a field on the user? a route per form?), so this needs to start as an investigation, not a
blind implementation.

**Likely today:** something like `if (user.school === 'SoD') renderCreativeForm()` — a hardcoded
school‑code check somewhere in the appraisal frontend (form‑loading logic, a router, or a
`getFormType(user)`‑style helper). Find it and see exactly which schools currently get Creative vs
Standard, then match §4's migration so nobody's form silently changes when this ships.

### Implementation prompt (paste into the appraisal‑frontend repo)

```
TASK: Replace the hardcoded Standard-vs-Creative form selection with a read of the school's
`default_form` field, once schools are served from an API.

BACKGROUND
Two appraisal forms already exist and work today: "Standard Appraisal" and "Creative Form".
Something in this codebase currently decides which one a faculty member sees — likely a hardcoded
check on school code (e.g. School of Design gets Creative, everything else gets Standard). The admin
panel now lets an admin assign `default_form: "standard" | "creative"` per school via
POST/PUT /api/v1/admin/schools, and (once deployed) schools will be readable from
GET /api/v1/admin/schools. The goal is for that admin assignment to be what actually decides the
form, not a hardcoded rule.

STEP 1 — FIND IT
Grep this repo for however the current selection is made — search for "creative", "standard",
"formType", "appraisalForm", school codes like "SoD", or wherever the appraisal form component is
chosen/rendered/routed. Report back exactly what you find: the file(s), the current rule, and which
schools currently resolve to which form. Do this before changing anything.

STEP 2 — REPLACE
Once GET /api/v1/admin/schools (or a non-admin equivalent, confirm auth scope with backend) is live:
  - Fetch the faculty member's school record (by their `school` code).
  - Read `default_form` from it: "standard" -> Standard Appraisal, "creative" -> Creative Form.
  - Replace the old hardcoded rule at the exact location(s) found in Step 1 with this read.
  - If `default_form` is missing/unknown on a school record, default to "standard" (never break an
    existing faculty member's form by defaulting to something they've never seen).

STEP 3 — VERIFY NO SILENT CHANGES
Cross-check the schools admin will migrate with §4 of Docs/Schools.md (admin-ui repo) — confirm each
school's currently-hardcoded form assignment matches what gets migrated. If School of Design
currently renders Creative and the migration doesn't set default_form="creative" for SoD, flag that
back to admin before this ships — a faculty member's form must not change without the admin choosing
that.

CONSTRAINTS
  - Don't build anything for a 3rd form type — `default_form` is just "standard" | "creative" today.
  - Don't build per-role overrides (a school's Director seeing a different form than its Faculty) —
    not needed yet.
  - Unknown/missing default_form -> "standard" (safe default).

ACCEPTANCE
  [ ] Documented exactly where/how form selection currently works (Step 1 findings)
  [ ] Form selection reads default_form from the school record once the API is live
  [ ] Every currently-Creative school still resolves to Creative after the change (verified against
      the migration values, not assumed)
  [ ] Missing/unknown default_form falls back to Standard, not an error
```

---

## 7. Admin UI — what's built (reference)

- **Nav:** Sidebar → *Schools* → *All Schools* (`/schools`) / *Add School* (`/schools/add`).
- **`src/api/client.js`** → `api.schools.{list,create,update,remove}` against `/admin/schools`.
- **`src/constants/schoolRoles.js`** → the fixed chain catalog + track list + `defaultChainFor()`.
- **`src/components/schools/SchoolForm.jsx`** → identity, track picker, HOD/Director toggles,
  ordered chain builder (add/remove/reorder, VC locked last), department tag editor,
  **`FormPicker`** (Standard Appraisal / Creative Form, extensible), active toggle. The default
  export is the full scrolling form (used by the Edit modal); `SL`, `TrackPicker`, `ToggleRow`,
  `ChainBuilder`, `DepartmentEditor`, `FormPicker` are also named exports reused by the wizard.
- **`src/constants/schoolRoles.js`** also has `SCHOOL_FORMS` (the 2 existing forms) and
  `suggestSchoolCode(fullName)` — auto-generates a short code as the admin types the school name.
- **`src/pages/schools/AddSchoolPage.jsx`** → **4-step wizard** (Identity → Structure → Chain →
  Form & Status), matching `AddFacultyPage`'s stepper pattern, with live Summary + Appraisal Journey
  panels throughout.
- **`src/pages/schools/SchoolsListPage.jsx`** → list with edit‑in‑modal, delete, and a graceful
  "not deployed" fallback that shows the current hardcoded list read‑only (`LegacyPreview`).
- **Not yet done (needs the live endpoint to build against real data):** rewiring the 11 files that
  still import `src/constants/schools.js` (`AddFacultyPage`, `FacultyListPage`,
  `PendingFacultyPage`, `FacultyMarksPage`, `PendingReviewsPage`, `ExportReportPage`,
  `AppraisalCyclePage`, `OverviewPage`, `AnnouncementsPage`, `normalizers.js`) to read from
  `api.schools.list()` instead of the static constant. That refactor is next once §3 is deployed and
  §4's migration has run — flip the switch school by school, keeping the static file as a fallback
  during transition.

### Implementation prompt (paste into the backend repo)

```
TASK: Add a Schools CRUD API so schools are admin-managed instead of hardcoded.

ENDPOINTS
  GET    /api/v1/admin/schools
  POST   /api/v1/admin/schools
  PUT    /api/v1/admin/schools/{code}
  DELETE /api/v1/admin/schools/{code}   (409 if any user.school == code)

SCHEMA
  code            str, unique, immutable after create
  full_name       str, required
  track           enum: "engineering" | "non_engineering"
  has_hod         bool
  has_director    bool
  approval_chain  string[]  ordered catalog keys from {"hod","director","dean","vc"}
                  - must end with "vc"
                  - "hod" present IFF has_hod == true (bidirectional, not one-directional)
                  - "director" present IFF has_director == true (bidirectional)
                  - no duplicates
  departments     string[]  optional
  default_form    enum: "standard" | "creative"  — which of the two EXISTING appraisal forms
                  (both already built in the appraisal frontend) this school's faculty use.
                  Not a form builder. Default "standard" if omitted.
  active          bool
  order           int       optional, for display sort

"dean" in approval_chain is NOT a literal role — at read time (or on the consuming frontend) it
resolves to "Dean of Engineering" or "Dean of Non-Engineering" based on `track`. There is one Dean
per track, not one per school.

AUTH
  POST/PUT/DELETE: same admin/super_admin Bearer-token auth as every other /admin/* endpoint here.
  GET: DECIDE, don't assume — the appraisal frontend (faculty/RO/Dean/VC, no admin token) also needs
  to read this data (see this repo's Docs/Schools.md §3 for 3 concrete options: separate non-admin
  read endpoint / any-authenticated-user read / embed resolved school config in the user's own
  profile response). Confirm with the appraisal-frontend dev before finalizing.

DEACTIVATE VS DELETE
  PUT with active:false must succeed even if faculty reference this school code — it only hides the
  school from new assignments, existing faculty keep working. Only DELETE is blocked (409) by
  existing references.

code normalization: normalize/validate case so "SoD" and "sod" can't become two different schools.

MIGRATION
  Seed the 10 existing hardcoded schools (see Docs/Schools.md §4 in the admin-ui repo for the exact
  per-school values). CISR is a special case — keep it as a legacy exception, do not force it into
  track/dean; it already has its own "Center Head" role in the appraisal frontend.
  IMPORTANT on default_form: do not guess it from the table in §4 (it's marked unverified there).
  Get the real current Standard-vs-Creative assignment per school from whoever/whatever decides it
  today in the appraisal frontend (see that repo's Docs/Schools.md §6a) before setting this column,
  so no faculty member's form changes as a side effect of this migration.

ACCEPTANCE
  [ ] CRUD round-trips all fields including default_form
  [ ] validation rejects: a chain not ending in "vc"; has_hod/has_director not matching whether
      "hod"/"director" are actually present in the chain (bidirectional); duplicate codes differing
      only in case
  [ ] delete is blocked (409) while any user references the school code
  [ ] deactivating (active:false) an in-use school SUCCEEDS, doesn't 409
  [ ] a read path exists for the appraisal frontend that doesn't require an admin token (whichever
      of the 3 options was chosen)
  [ ] the 10 legacy schools exist after migration with the values in Docs/Schools.md §4, and
      default_form matches each school's VERIFIED current form, not a guess
```
