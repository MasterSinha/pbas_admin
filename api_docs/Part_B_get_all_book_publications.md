# Retrieve All Book Publications

**Endpoint Name:** Retrieve All Book Publications  
**URL Path:** `/api/v1/part-b/book-publications`  
**Method:** `GET`

## Description
Retrieves all book publication records across the institution.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Query Parameters:**
  - `skip` (int, optional): Number of records to skip.
  - `limit` (int, optional): Maximum number of records.

## Response Data
- **Code:** `200 OK`
- Standard Book Publication fields.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
