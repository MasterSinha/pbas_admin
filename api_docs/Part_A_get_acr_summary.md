# Get ACR Summary

**URL Path:** `/api/v1/part-a/acr/summary/{faculty_id}`
**HTTP Method:** `GET`
**Description:** Calculates the total ACR score for a faculty member, capped at 25 points.

## Request Data
- **Type:** N/A (Path Parameter)
- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| faculty_id | UUID | ID of the faculty member |

## Response Data
- **Success Status Code:** 200 OK
- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| totalScore | float | Aggregated ACR score (max 25) |

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
