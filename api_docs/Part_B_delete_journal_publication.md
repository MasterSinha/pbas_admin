# Delete Journal Publication

**Endpoint Name:** Delete Journal Publication  
**URL Path:** `/api/v1/part-b/journal-publications/{publication_id}`  
**Method:** `DELETE`

## Description
Deletes a specific journal publication record and its associated data.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Path Parameters:**
  - `publication_id` (UUID): The unique identifier of the publication record.

## Response Data
- **Code:** `204 No Content`
- **Fields:** None.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
