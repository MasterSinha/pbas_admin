# Update Course File Entry

**URL Path:** `/api/v1/part-a/course-files/{id}`
**HTTP Method:** `PUT`
**Description:** Updates an existing course file entry. Faculty can update content; HOD can update scores.

## Request Data
- **Type:** `application/json`
- **Fields (Faculty):**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| course_paper | string | Course/Paper name |
| title | string | Title |
| details_proof | boolean | Proof status |
| department | string | Department |

- **Fields (HOD):**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| api_score_hod | float | Score assigned by HOD |
| signature | boolean | Signature status |

## Response Data
- **Success Status Code:** 200 OK
- **Fields:** Course File object.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
