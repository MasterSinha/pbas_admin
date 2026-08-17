# Add Appraisal Remarks

**URL Path:** `/api/v1/appraisal-remarks/{faculty_id}`

**Method:** `POST`

**Description:** Adds a general appraisal remark for a faculty member. Used by authorities during the review process.

## Request Data
- **Type:** `multipart/form-data`
- **Parameters:**
    - `faculty_id` (UUID, path): Unique identifier of the faculty member.
- **Body (JSON):**
    - `remarks` (str): Content of the remark.

## Response Data
- **Success (200 OK):** The created remark object.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
