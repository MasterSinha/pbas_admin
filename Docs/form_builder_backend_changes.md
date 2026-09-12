# Form Builder — admin-managed appraisal form structure

**Status:** Admin UI ✅ built (Dynamic Form → Form Builder screen, against a proposed contract,
persisted to the admin's browser only) · **Backend ⏳ nothing below exists yet**.
**Owner of this doc:** Admin UI. **Action needed from:** backend dev, then appraisal-frontend dev.

## Table creation and optional column maximums (September 2026)

### Optional column placeholders

Each column now supports `placeholder`, an optional string, for example
`{ "name": "Title", "type": "text", "placeholder": "Enter publication title" }`.
Preserve it through schema save/read responses. Missing or empty values retain
the existing default prompt. Placeholders are display-only, never default
answers, and must not satisfy required-cell or complete-row validation.
The preview uses them in text, long text, numeric, date, dropdown and Yes/No
inputs. Conditional dropdowns use the placeholder for their initial choice.
Document and computed columns display the text as a hint beside their control,
since those controls cannot accept native placeholder text.

Backend contract for placeholders:

- Store `placeholder` within each column definition at
  `sections[].fields[].columns[].placeholder` in the current admin payload.
  No separate database column or new table is needed if schemas use JSON/JSONB.
- Accept a string or an omitted value. Normalize legacy null/missing values to
  an empty string when returning a canonical schema; reject other value types.
- Preserve supplied text in create/update and subsequent list/detail/read
  responses, including the faculty-facing schema response. An explicit empty
  string clears an existing placeholder; do not replace it with the old value.
- For partial updates, an omitted property leaves the saved value unchanged.
  For full replacement schemas, an omitted property means no custom placeholder.
- Preserve placeholders when reordering columns or changing their data type.
  Render them as plain text, never as HTML.
- Placeholder text must not become a cell value, a dropdown option, an uploaded
  document reference, a scoring input, or a computed result. Existing numeric
  and date validation rules still apply independently of the displayed text.

Example table field in a schema request/response:

```json
{
  "id": "table_publications",
  "type": "table",
  "label": "Publications",
  "requireCompleteRows": true,
  "columns": [
    {
      "name": "Publication title",
      "type": "text",
      "placeholder": "Enter publication title",
      "maxMarks": null
    },
    {
      "name": "Marks",
      "type": "number",
      "placeholder": "Enter marks earned",
      "maxMarks": 10
    },
    {
      "name": "Category",
      "type": "dropdown",
      "placeholder": "Choose a category",
      "options": ["Journal", "Conference"],
      "maxMarks": null
    }
  ]
}
```

Required backend tests: create/read round-trip, update and explicit clearing,
legacy schemas without placeholders, type changes and reordering, invalid
placeholder value types, and a blank required cell that remains invalid despite
having a configured placeholder. These are backend implementation requirements;
the current admin builder still saves locally in the browser.

### Part creation, deletion, and sequence

**Updated UI hierarchy: Parts -> Tables.** The admin no longer creates or
manages sections. Create Table adds a table directly under the selected part;
each part supports multiple tables. Preview displays one part per page with all
of its active tables together.

For compatibility, existing `sections[].fields[]` storage is retained internally.
The UI flattens these fields within their owning part, preserving IDs, core
flags, validation settings, and existing standalone fields. New tables use one
internal wrapper each. This is not a destructive schema migration.

Optional form-level `tableOrder` is an ordered array of field IDs used to reorder
items without moving them between legacy storage owners. Preserve it on save and
read. Missing IDs follow the explicitly ordered IDs in stable existing order.
Render within each part in this order; do not treat the wrappers as preview pages.
Existing records without `tableOrder` retain their current field order.

The parts editor now uses an inline name input, rejects empty and duplicate
names (case-insensitive), and provides up/down controls for the ordered `parts`
array. Save and reload must preserve that array's order. Preview groups sections
in part order, preserving the existing relative section order within each part.
Moving a part must not rename it, change section IDs, or change section ownership.

Deletion retains existing confirmation and semantics: remove custom sections,
retire core sections without erasing their historical data, and keep at least one
part. Deleting or moving in the editor changes the draft until saved.
Backend schema persistence must honor this order and the same deletion policy;
do not implement part reordering by changing scoring or review routing.

### Updated column types and complete-row validation

The separate "Other field types" selector has been removed. Create Table is the
section creation action. Column Data type now includes text, long text, decimal,
integer, date, dropdown, dropdown with conditional text, checkbox, computed, and
document. Existing standalone fields remain editable.

Persist dropdown column `options` and, for conditional text, `triggerValue`
and `extraLabel`. In the current preview, conditional cells use
`{ "choice": "Other", "extra": "Details" }`. Checkbox cells distinguish an
unanswered value from explicit Yes/No (`true`/`false`).

Tables now have an optional `requireCompleteRows` boolean, default false for
new and legacy tables. The admin checkbox is labeled "Require complete rows".
When true, a row with any user-entered value requires all editable, active
columns in that row. Ignore completely empty rows, auto-generated serial numbers,
computed columns, and inactive columns. Zero and explicit false are valid
answers. Whitespace-only text is empty. A conditional "Other" answer requires
its extra text. Document columns require a valid uploaded attachment reference
in production, not merely a supplied filename or the preview's blob URL.

The admin preview flags incomplete rows and provides Validate rows across all
sections, including rows outside the currently displayed section. This does not
submit faculty appraisals. Backend and faculty renderer work remains required:

- Round-trip `requireCompleteRows` (or explicitly mapped `require_complete_rows`).
- On final submission, load the authoritative schema version for that appraisal
  and reject incomplete started rows with 422 and structured table/row/column
  errors. Never trust a client-supplied disabled flag.
- Enforce this before status changes in the submission transaction. Permit draft
  saves with partial rows. Do not bypass existing required-table, scoring, or
  workflow validation.
- The faculty UI must block final submission and display the same errors. This
  repository's local admin preview cannot enforce the faculty submit endpoint.
- Test flag-off/legacy behavior, empty rows, partial and completed rows, zero,
  false, conditional extra text, missing attachments, and multiple tables/sections.

Admin UI now provides a primary **Create Table** action in each section. Other
field types are available in the column Data type menu. This creates the existing
`type: "table"` field; it does not create a physical database table.

Each column editor has a labeled column name, data type, and reorder/remove
controls. **Max marks (optional)** is visible only for `number` (decimal) and
`integer` (whole number) columns. A blank maximum is stored as `null`, not zero.
Changing a numeric column to a nonnumeric type clears its maximum to `null`.
Changing between numeric types preserves its configured maximum.

Example of the current browser schema:

```json
{
  "type": "table",
  "label": "Publications",
  "autoSerial": true,
  "maxMarks": null,
  "columns": [
    { "name": "Publication title", "type": "text", "maxMarks": null },
    { "name": "Count", "type": "integer", "maxMarks": null },
    { "name": "Marks", "type": "number", "maxMarks": 10 }
  ]
}
```

Backend implementation requirements when schema persistence is added:

- Preserve column order, names, supported types, and optional numeric maximums
  through save, list, and detail responses.
- Accept missing or null column `maxMarks` as no configured maximum. Preserve
  explicit zero. A supplied numeric maximum must be finite and nonnegative.
- Normalize nonnumeric column maximums to null. For existing legacy schemas,
  tolerate stale nonnumeric maximums without rejecting the entire saved form.
- Do not require every numeric column to have marks. Do not infer scoring
  formulas, change appraisal scoring, or apply column maximums to table totals.
  Table-level `maxMarks` remains a separate existing setting.
- If the backend uses snake_case, explicitly map `maxMarks` to `max_marks`
  at the API boundary and return the value without losing null or zero.
- Add round-trip coverage for an unbounded numeric column, a configured numeric
  maximum, explicit zero, numeric-to-text changes, and existing table schemas.

The admin preview now wraps long column headings, displays each column's type,
shows maximums only for numeric columns with a configured value, and provides
horizontal scrolling for wide tables. Row addition/removal and typed cell inputs
remain available. This is an admin preview update, not a change to faculty
rendering or a claim that backend schema persistence is already implemented.

This is the "visual form builder" that [`Schools.md`](./Schools.md) §5 explicitly deferred as
"large, own project." It's now been built as a prototype (sidebar → *Dynamic Form → Form Builder*)
so it can be reviewed and speced properly instead of guessed at. The screen is fully functional
today, but everything it edits lives in `localStorage` — nothing here is live until a backend
developer adds the pieces below.

---

## 1. Why

Every section and field of the Standard and Creative School appraisal forms is currently hardcoded
in the appraisal-frontend repo (`StandardMyAppraisal.jsx`, `CreativeSchoolAppraisalForm.jsx`, plus
the `src/components/appraisal/PartA-D/*.jsx` reviewer views). Adding a field, hiding one, or adding
a whole new section today means a frontend code change and a deploy — the admin has no way to do
it. This doc specs the backend side of letting an admin manage that structure at runtime, without
ever running a SQL migration by hand and without ever destroying already-submitted data.

## 2. Data model

Table `public.form_section_definitions` (already exists — see the appraisal-frontend repo's
`schema.sql:66-78`) needs **one new column**:

```
field_schema   jsonb not null default '[]'::jsonb
active         boolean not null default true
```

`fields` (the existing plain array-of-strings column) stays as-is, untouched — `field_schema` is
additive, not a replacement. Shape of each entry:

```
{
  key:          string   // wire field name — immutable after first save (see §4)
  label:        string   // shown to faculty/reviewer
  type:         "text" | "number" | "date" | "select" | "yesNo" | "conditionalText"
              | "computed" | "file" | "checkbox"          // closed enum, do not extend
  required:     boolean
  options:      string[] // only meaningful for select / yesNo / conditionalText
  triggerValue: string   // conditionalText only — which option reveals the extra text box
  extraLabel:   string   // conditionalText only — label for that extra text box
  rowMax:       number | null   // per-row score cap, if this section scores per row
  isCustom:     boolean  // true = admin-added, lives in custom_fields jsonb (see below)
                          // false = a real SQL column on storageTable — never delete, only hide
  active:       boolean  // false = hidden from rendering; the SQL column/data is untouched
}
```

Order in the array **is** the render order — no separate `sortOrder` field.

`part` (already a column on `form_section_definitions`) should **not** be treated as a closed
`"A"|"B"|"C"|"D"|"E"` enum — the admin screen lets an admin add as many parts as they want, named
freely (e.g. "Part F", "Bonus Section"), and reassign any section to any part at any time. Store it
as plain `text`; the only real constraint is that a form always has at least one part.

Each physical section table (`teaching_process`, `journal_publications`, ...) needs one new column:

```
custom_fields  jsonb not null default '{}'::jsonb
```

A field entry with `isCustom: true` reads/writes `row.custom_fields[key]`. A field entry with
`isCustom: false` reads/writes the row's real SQL column directly — `key` must match an existing
column name in that case. **Do not mix these** — core fields (`title`, `score`, `hod_score`, etc.)
stay real typed SQL columns so existing scoring/reporting code keeps working unmodified; only
admin-added fields go through the jsonb side-channel.

A brand-new section (created from the admin screen, nothing has ever been saved for it) has
`storage_table = NULL` and every field defaults to `isCustom: true`. Persist its rows through one
generic table shared across all such sections, rather than a new physical table per section:

```
create table public.custom_section_rows (
  id               uuid primary key default gen_random_uuid(),
  faculty_email    text not null,
  academic_year    text not null,
  section_key      text not null,
  row_no           int not null,
  data             jsonb not null default '{}'::jsonb,
  score            numeric,
  hod_score        numeric,
  director_score   numeric,
  dean_score       numeric,
  vc_score         numeric
);
```

Only promote a heavily-used custom section to its own real physical table later, as a deliberate
backend migration — never automatically from the admin screen.

## 3. Delete semantics (read carefully before implementing)

- **Deleting a custom field** (`isCustom: true`): remove its entry from `field_schema`. Existing
  rows keep the old value sitting unused inside `custom_fields` — don't strip it out of historical
  rows, that's write amplification for no benefit.
- **"Deleting" a core field** (`isCustom: false`): not a delete. Set `active: false` on its
  `field_schema` entry. The form-rendering engine skips inactive fields; the SQL column and its
  data are untouched. The admin screen already explains this distinction in its UI.
- **Deleting/retiring a whole section**: never physically drop rows. Set `active: false` on the
  `form_section_definitions` row. Inactive sections stop appearing for new submissions but remain
  fully readable for any academic year that already has data in them (past reports, closed-cycle
  views, print reports must still work).
- **Deleting a whole part** (e.g. "delete Part A"): a part is just a tag on sections, not its own
  row, so "deleting" it is really deleting/retiring everything tagged with it, per the two rules
  above — custom sections under that part get deleted outright, core sections get retired
  (`active: false`) and left with their old `part` value (the admin screen shows these as
  "Unassigned" and lets the admin move them to a different part later; it never invents a new part
  name for them). A form must always keep at least one part — reject/ignore a request that would
  leave it with zero.

## 4. Field `key` is locked after first save

The prototype (`src/utils/dynamicFormRegistry.js`) identifies fields by an internal random `id`,
not a stable wire `key` — it never lets a core field be deleted (only hidden), but it does not yet
model or enforce key-locking, since the merged builder UI doesn't expose a `key` concept at all.
Whoever wires this up for real needs to derive a stable `key` per field (e.g. slugify the label at
creation time, same as section codes are derived today) and have the backend reject a `PUT` that
changes an existing field's `key`, since that would orphan whatever data already sits under the old
key.

## 5. Endpoints needed (new, additive — do not change existing `/appraisal/*` endpoints)

```
GET  /api/v1/admin/form-schema?form_family=&part=      list sections + their field_schema
PUT  /api/v1/admin/form-schema/{code}                   update title / max_marks / active
PUT  /api/v1/admin/form-schema/{code}/fields            replace the whole field_schema array
                                                         (send the full reordered/edited array —
                                                         simpler and safer than per-field PATCH)
POST /api/v1/admin/form-schema                          create a new section (custom, no
                                                         storage_table)
```

All admin-only. Gate the same way other admin endpoints are gated (JWT + `appraisal_role`).

**Read path for the actual appraisal form** — this is what makes an admin's edit take effect for
faculty without a frontend deploy, don't skip it:

```
GET  /api/v1/appraisal/form-schema?form_family=&academic_year=
```

Faculty-facing, filtered server-side to `active: true` sections and `active: true` fields only. The
appraisal-frontend's form renderer should read from this instead of importing the hardcoded JS
section constants — see §6.

## 6. Appraisal-frontend changes (once the endpoints exist)

The appraisal-frontend repo does **not** currently have a schema-driven rendering engine — forms
are still fully hand-coded (`StandardMyAppraisal.jsx`, `CreativeSchoolAppraisalForm.jsx`, and the
separate `src/components/appraisal/PartA-D/*.jsx` reviewer-view components). Wiring this up is a
separate, larger effort: build one schema-driven render component that reads `field_schema` and
replaces all of the above, rather than trying to bolt a read call onto the existing hand-coded
forms. Until that exists, an admin's edits in the Form Builder change what's *stored* as the
intended structure, but not yet what faculty actually see.

## 7. Out of scope (tell nobody to build these yet)

- No raw DDL from the admin UI, ever — no `ALTER TABLE` / `DROP COLUMN`, directly or indirectly.
  All flexibility comes from `field_schema` + `custom_fields` jsonb, not real column changes.
- No renaming or deleting a field's `key` once saved — only label/type/options/required/order/
  active are editable after creation (see §4).
- Not a fully generic EAV system — `title`, `score`, `hod_score`, etc. stay real typed SQL columns.
  Only admin-added fields go through the jsonb side-channel. Mixing the two is what keeps existing
  scoring/reporting code working unmodified.
- Real server-side role gating for these endpoints depends on an actual `admin` role existing end
  to end in the appraisal-frontend session model — it doesn't yet (see that repo's
  `RoleDashboard.jsx`, which has no `admin` case). Until then, treat the admin-only endpoints above
  as needing the same interim gating this admin UI itself uses.

## 8. Admin UI — what's built (reference)

This lives inside the same **Dynamic Form** tool the admin uses to design brand-new forms — not a
separate screen — since a core PBAS section and an admin-added custom section are edited with the
same UI, just with different delete semantics (§3).

- `src/data/pbasFormSeed.js` — the real current Standard/Creative section & field structure,
  hand-extracted from the appraisal-frontend repo's form files. `storageTable` values are a
  best-effort match against that repo's `schema.sql`; several sections have no obvious physical
  table and are left `null`.
- `src/utils/dynamicFormRegistry.js` — the persistence layer. On first-ever load it seeds two forms
  ("Standard Appraisal Form", "Creative School Appraisal Form") built from `pbasFormSeed.js`, with
  every seeded section flagged `isCore:true` and every seeded field `isCustom:false`. Its functions
  (`saveDynamicForm` / `setPublished` / `deleteDynamicForm`, etc.) are shaped closely enough to §5's
  future API that swapping the body of each for a real `api.*` call is a one-file change.
- `src/pages/forms/DynamicFormPage.jsx` — the screen itself: a form picker, sections grouped into
  **Parts** (tabs, with "Add Part"/"Delete Part" — see §3's part-delete semantics — and a per-section
  Part dropdown to reassign it), a section editor with reorder, hide/delete per §3's core-vs-custom
  semantics, an "Add Field" / "Add Section" flow (table fields also support Excel-import and
  left/right column reorder), and a live preview — paginated one section per page like the real
  form — including document-upload fields, viewable in-preview via a local blob URL (no backend
  storage exists yet, so uploaded files don't persist past the browser session).
