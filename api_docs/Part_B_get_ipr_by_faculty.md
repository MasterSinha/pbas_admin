# Get IPR Entries by Faculty

**URL Path:** `/api/v1/ipr/faculty/{faculty_id}`

**Method:** `GET`

**Description:** Retrieves all Intellectual Property Rights (IPR) entries for a specific faculty member.

## Request Data
- **Parameters:**
    - `faculty_id` (UUID, path): Unique identifier of the faculty member.
    - `skip` (int, query): Number of records to skip (default: 0).
    - `limit` (int, query): Maximum number of records to return (default: 100).

## Response Data
- **Success (200 OK):** A list of IPR entries.
    - `id` (UUID): Unique identifier of the entry.
    - `title` (str): Title of the patent/IPR.
    - `scope` (str): National or International.
    - `filing_date` (date): Date of filing.
    - `status` (str): Published or Granted.
    - `patent_file_no` (str): Official file number.
    - `research_score_faculty` (float): Points claimed by faculty.
    - `research_score_hod` (float): Points approved by HOD.
    - `research_score_director` (float): Points approved by Director.
    - `document` (str): Link to the uploaded proof.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
