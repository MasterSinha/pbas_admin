# Get Subordinates Status (Dashboard)

**URL Path:** `/api/v1/dashboard/subordinates`

**Method:** `GET`

**Description:** Returns a list of all faculties reporting to the current user along with their appraisal submission status. Used for authority dashboards.

## Response Data
- **Success (200 OK):** A list of subordinate status objects.
    - `faculty_id` (UUID): ID of the subordinate.
    - `name` (str): Name of the subordinate.
    - `status` (str): DRAFT / SUBMITTED / APPROVED / etc.
    - `overall_score` (float): Current aggregated score.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
