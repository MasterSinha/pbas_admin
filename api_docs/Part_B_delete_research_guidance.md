# Delete Research Guidance Entry

**URL Path:** `/api/v1/research-guidance/{guidance_id}`

**Method:** `DELETE`

**Description:** Removes a Research Guidance entry from the system.

## Request Data
- **Parameters:**
    - `guidance_id` (UUID, path): Unique identifier of the guidance entry.

## Response Data
- **Success (204 No Content):** Entry successfully deleted.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
