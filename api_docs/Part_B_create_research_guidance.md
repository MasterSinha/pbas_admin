# Create Research Guidance

**URL Path:** `/api/v1/research-guidance`
**HTTP Method:** `POST`
**Description:** Creates a new research guidance entry (ME/PhD).

## Request Data
- **Type:** `multipart/form-data`
- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| degree | string | ME / PhD |
| student_name | string | Name of student |
| submission_status | string | Submitted / Awarded |
| award_date | date | Date of award (optional) |
| department | string | Department (optional) |
| file | file (PDF) | Proof document (optional) |

## Response Data
- **Success Status Code:** 201 Created

- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier |
| faculty_id | UUID | ID of the faculty owner |
| degree | string/mixed | As per request |
| student_name | string/mixed | As per request |
| submission_status | string/mixed | As per request |
| award_date | string/mixed | As per request |
| department | string | Faculty department |
| document | string | Path to uploaded PDF |
## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
