# Create Popular Writing Entry

**URL Path:** `/api/v1/part-b/popular-writings`
**HTTP Method:** `POST`
**Description:** Creates a new popular writing, film, or documentary entry. (Primarily for SOMCS/Type 2)

## Request Data
- **Type:** `multipart/form-data`
- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| title | string | Title of the work |
| writing_type | string | Popular Writing / Film / Documentary |
| date | date | Date of publication/release |
| publisher_agency | string | Publisher or Agency (optional) |
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
| title | string/mixed | As per request |
| writing_type | string/mixed | As per request |
| date | string/mixed | As per request |
| publisher_agency | string/mixed | As per request |
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
