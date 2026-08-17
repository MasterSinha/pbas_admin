# Create Departmental Activity

**URL Path:** `/api/v1/part-a/department-activities`
**HTTP Method:** `POST`
**Description:** Creates a new departmental activity entry.

## Request Data
- **Type:** `multipart/form-data`
- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| activity | string | Activity name |
| nature_of_activity | string | Nature of activity |
| sr_no | integer | Serial number (optional) |
| department | string | Department (optional) |
| file | file (PDF) | Proof document (optional) |

## Response Data
- **Success Status Code:** 201 Created
- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique ID |
| faculty_id | UUID | Faculty ID |
| sr_no | integer | Serial number |
| activity | string | Activity name |
| nature_of_activity | string | Nature |
| department | string | Department |
| document | string | Path to document |
| api_score_faculty | float | Faculty score |
| api_score_hod | float | HOD score |
| api_score_director | float | Director score |

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
