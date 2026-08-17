# Submit Appraisal

**URL Path:** `/api/v1/appraisal-summary/submit`

**Method:** `POST`

**Description:** Finalizes the appraisal for the current academic year and changes its status to `SUBMITTED`.

## Request Data
- **Type:** `multipart/form-data`
- **Body (JSON):**
    - `academic_year` (str): The year of appraisal (e.g., "2025-26").

## Response Data
- **Success (200 OK):**
    - `faculty_id` (UUID): ID of the submitting faculty.
    - `status` (str): "SUBMITTED".
    - `overall_score` (float): The final score at the time of submission.
    - `academic_year` (str): The academic year.
    - `message` (str): "Appraisal submitted successfully".

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
