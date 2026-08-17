# Create University Activity

**URL Path:** `/api/v1/part-a/university-activities`
**HTTP Method:** `POST`
**Description:** Creates a new university activity entry.

## Request Data
- **Type:** `multipart/form-data`
- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| activity | string | Activity name |
| nature_of_activity | string | Nature |
| sr_no | integer | Serial number (optional) |
| department | string | Department (optional) |
| file | file (PDF) | Proof document (optional) |

## Response Data
- **Success Status Code:** 201 Created

- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier |
| faculty_id | UUID | ID of the faculty owner |
| activity | string/mixed | As per request |
| nature_of_activity | string/mixed | As per request |
| sr_no | string/mixed | As per request |
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
