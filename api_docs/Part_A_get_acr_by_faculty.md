# Get ACR by Faculty

**URL Path:** `/api/v1/part-a/acr/faculty/{faculty_id}`
**HTTP Method:** `GET`
**Description:** Retrieves all ACR entries for a specific faculty member.

## Request Data
- **Type:** N/A (Path Parameter)
- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| faculty_id | UUID | ID of the faculty member |

## Response Data
- **Success Status Code:** 200 OK
- **Fields:** List of ACR objects.

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique ID of the entry |
| faculty_id | UUID | ID of the faculty member |
| sr_no | integer | Serial number |
| subject | string | Subject/Title |
| department | string | Department |
| document | string | Path to the uploaded document |
| api_score_hod | float | Score assigned by HOD |
| api_score_director | float | Score assigned by Director |
| signature | boolean | Signature status |

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
