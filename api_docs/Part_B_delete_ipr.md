# Delete IPR Entry

**URL Path:** `/api/v1/ipr/{ipr_id}`

**Method:** `DELETE`

**Description:** Removes an Intellectual Property Rights (IPR) entry from the system.

## Request Data
- **Parameters:**
    - `ipr_id` (UUID, path): Unique identifier of the IPR entry.

## Response Data
- **Success (204 No Content):** Entry successfully deleted.
- **Error (404 Not Found):** If the IPR entry does not exist.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
