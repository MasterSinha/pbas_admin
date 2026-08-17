# Update IPR Entry

**URL Path:** `/api/v1/ipr/{ipr_id}`

**Method:** `PUT`

**Description:** Updates an existing Intellectual Property Rights (IPR) entry. Supports role-based updates for faculty information and authority scores.

## Request Data
- **Type:** `application/json`
- **Parameters:**
    - `ipr_id` (UUID, path): Unique identifier of the IPR entry.
- **Body (JSON):**
    - **Faculty Update:** `title`, `scope`, `filing_date`, `status`, `patent_file_no`.
    - **HOD Update:** `research_score_hod` (float).
    - **Director Update:** `research_score_director` (float).

## Response Data
- **Success (200 OK):** The updated IPR entry object.
- **Error (404 Not Found):** If the IPR entry does not exist.
- **Error (403 Forbidden):** If the user is not authorized to update this entry or specific fields.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
