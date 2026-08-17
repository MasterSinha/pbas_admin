# Update ACR Entry

**URL Path:** `/api/v1/part-a/acr/{id}`
**HTTP Method:** `PUT`
**Description:** Updates an existing ACR entry. Different roles (HOD, Director) update different fields.

## Request Data
- **Type:** `application/json`
- **Fields (HOD/Admin):**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| api_score_hod | float | Score assigned by HOD |
| department | string | Department name (optional) |

- **Fields (Director):**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| api_score_director | float | Score assigned by Director |
| signature | boolean | Signature status (optional) |

## Response Data
- **Success Status Code:** 200 OK
- **Fields:** ACR object (same as GET).

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
