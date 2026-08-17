# Journal Publication Score Summary

**Endpoint Name:** Journal Publication Score Summary  
**URL Path:** `/api/v1/part-b/journal-publications/summary/{faculty_id}`  
**Method:** `GET`

## Description
Calculates and retrieves the total aggregated API score for all journal publications for a specific faculty member.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Path Parameters:**
  - `faculty_id` (UUID): The unique identifier of the faculty member.

## Response Data
- **Code:** `200 OK`
- **Fields:**
  - `total_score` (float): The sum of validated scores for all journal publications.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
