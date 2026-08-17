# Update HOD Remarks

**URL Path:** `/api/v1/appraisal-remarks/hod/{faculty_id}`

**Method:** `PUT`

**Description:** Creates or updates the HOD's remarks and approved score for a faculty member.

## Request Data
- **Type:** `application/json`
- **Parameters:**
    - `faculty_id` (UUID, path): Unique identifier of the faculty member.
- **Body (JSON):**
    - `hod_remark` (str), `hod_approved_score` (float), `hod_signature` (str).

## Response Data
- **Success (200 OK):** The updated HOD remarks object.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
