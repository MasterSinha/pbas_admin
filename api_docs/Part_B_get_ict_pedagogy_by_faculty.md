# Retrieve ICT Pedagogy by Faculty

**Endpoint Name:** Retrieve ICT Pedagogy by Faculty  
**URL Path:** `/api/v1/part-b/pedagogy/faculty/{faculty_id}`  
**Method:** `GET`

## Description
Retrieves all ICT-enabled pedagogy resources developed by a specific faculty member.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Path Parameters:**
  - `faculty_id` (UUID).

## Response Data
- **Code:** `200 OK`
- **Fields (List of Objects):**
  - `id`, `title`, `description`, `pedagogy_type`, `quadrants`, `document`, `api_score_faculty`, `api_score_hod`, `api_score_director`, `faculty_id`.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
