# Retrieve All Journal Publications

**Endpoint Name:** Retrieve All Journal Publications  
**URL Path:** `/api/v1/part-b/journal-publications`  
**Method:** `GET`

## Description
Retrieves all journal publication records across the entire institution. Primarily for administrative or university-level oversight.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Query Parameters:**
  - `skip` (int, optional): Number of records to skip (default: 0).
  - `limit` (int, optional): Maximum number of records to return (default: 100).

## Response Data
- **Code:** `200 OK`
- **Fields (List of Objects):**
  - Standard Journal Publication response fields (see `Retrieve Journal Publications by Faculty`).

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
