# Update Research Project

**URL Path:** `/api/v1/research-projects/{project_id}`

**Method:** `PUT`

**Description:** Updates an existing Research Project entry. Supports role-based updates for project details and authority scores.

## Request Data
- **Type:** `application/json`
- **Parameters:**
    - `project_id` (UUID, path): Unique identifier of the project.
- **Body (JSON):**
    - **Faculty Update:** `project_name`, `funding_agency`, `date_of_sanction`, `funding_amount`, `role`, `project_status`.
    - **HOD Update:** `api_score_hod` (float).
    - **Director Update:** `api_score_director` (float).

## Response Data
- **Success (200 OK):** The updated project object.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
