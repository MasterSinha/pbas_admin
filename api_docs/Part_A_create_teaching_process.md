# Create Teaching Process

**URL Path:** `/api/v1/part-a/teaching-process`
**HTTP Method:** `POST`
**Description:** Creates a new teaching process entry (Lectures/Practicals).

## Request Data
- **Type:** `multipart/form-data`
- **Fields (Form-Data):**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| semester | string | Academic semester |
| course_code_name | string | Course identifier |
| planned_classes | integer | Classes planned |
| conducted_classes | integer | Classes conducted |
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
| semester | string | Academic semester |
| course_code_name | string | Course identifier |
| planned_classes | integer | Classes planned |
| conducted_classes | integer | Classes conducted |
| api_score_faculty | float | Self-assigned score |
| api_score_hod | float | HoD-assigned score |
| department | string | Department name |
| document | string | Path to uploaded document |

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
