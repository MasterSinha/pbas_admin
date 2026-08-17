# Remaining APIs Needed to Fully Connect Admin UI

These are the only endpoints missing. Everything else is already wired.

---

## 1. `GET /admin/export/submissions`

**Page:** Analytics → Submission Report download button

| Query Param | Type | Required |
|---|---|---|
| `academic_year` | string | optional — defaults to latest |
| `school` | string | optional |

**Response:** `text/csv` file download

```
Content-Disposition: attachment; filename="submissions-2025-26.csv"

faculty_email, full_name, school, department, appraisal_role, designation,
academic_year, status, submitted_at, part_a_total, part_b_total, grand_total
```

---

## 2. `GET /admin/export/faculty`

**Page:** Analytics → Faculty Export download button

| Query Param | Type | Required |
|---|---|---|
| `school` | string | optional |
| `role` | string | optional |

**Response:** `text/csv` file download

```
Content-Disposition: attachment; filename="faculty-export.csv"

email, full_name, appraisal_role, school, department, designation,
phone, qualification, teaching_experience, employee_id, is_verified, created_at
```

---

## 3. `GET /admin/trends`

**Page:** Overview → Submission Trend chart, Analytics → Submission Trends chart
(both currently show hardcoded placeholder data)

| Query Param | Type | Required |
|---|---|---|
| `academic_year` | string | optional — defaults to latest |

**Response:**
```json
{
  "academic_year": "2025-26",
  "monthly": [
    { "month": "Jan", "submitted": 12, "pending": 88 },
    { "month": "Feb", "submitted": 34, "pending": 66 },
    { "month": "Mar", "submitted": 67, "pending": 33 }
  ]
}
```

> `submitted` and `pending` are cumulative counts at end of that month.

---

## 4. Add Feature Flag Keys to `/admin/config`

**Page:** Settings → Feature Flags card (7 toggles are UI-only, not saved)

No new endpoint needed. Just add these keys to `EDITABLE_ENV_KEYS` in `src/api/v1/admin.py`:

```python
"MAINTENANCE_MODE",       # "true" / "false"
"ALLOW_REGISTRATIONS",    # "true" / "false"
"EMAIL_NOTIFICATIONS",    # "true" / "false"
"DEBUG_LOGGING",          # "true" / "false"
"TWO_FACTOR_AUTH",        # "true" / "false"
"SESSION_TIMEOUT",        # "true" / "false"
"AUDIT_LOGGING",          # "true" / "false"
```

Frontend already calls `GET /admin/config` and `PUT /admin/config` — no frontend changes needed.

---

## 5. `GET /admin/module-config` + `PUT /admin/module-config`

**Page:** Appraisal → Section Controls (3 toggles are UI-only, not saved)

#### `GET /admin/module-config`
- Auth: admin
- Response:
```json
{
  "appraisal_module_enabled": true,
  "self_appraisal_enabled": true,
  "peer_review_enabled": false
}
```

#### `PUT /admin/module-config`
- Auth: admin
- Body (all optional):
```json
{
  "appraisal_module_enabled": true,
  "self_appraisal_enabled": true,
  "peer_review_enabled": false
}
```
- Response: `{ "message": "Updated" }`

---

## Priority

| # | Endpoint | Impact |
|---|---|---|
| 1 | `GET /admin/export/submissions` | CSV download works |
| 2 | `GET /admin/export/faculty` | CSV download works |
| 3 | `GET /admin/trends` | Live trend charts |
| 4 | Feature flags in `/admin/config` | Settings toggles persist |
| 5 | `/admin/module-config` | Section control toggles persist |
