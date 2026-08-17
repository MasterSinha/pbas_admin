# Create or Update Declaration

**URL Path:** `/api/v1/declaration`

**Method:** `POST`

**Description:** Creates or updates the final declaration (Place and Designation) for the appraisal.

## Request Data
- **Type:** `multipart/form-data`
- **Body (JSON):**
    - `place` (str): Location of signing.
    - `designation` (str): Current designation.

## Response Data
- **Success (200 OK):**
    - `id` (UUID): Unique identifier of the declaration.
    - `faculty_id` (UUID): ID of the faculty owner.
    - `place` (str): The provided place.
    - `designation` (str): The provided designation.
    - `submission_date` (date): Date when the declaration was recorded.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
