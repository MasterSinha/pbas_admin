# Create Self-Development FDP

**Endpoint Name:** Create Self-Development FDP  
**URL Path:** `/api/v1/part-b/self-development`  
**Method:** `POST`

## Description
Adds a new record for a Faculty Development Program (FDP) attended by the faculty member.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Type:** `multipart/form-data`
- **Fields:**
  - `program_name` (str): Name of the FDP/STTP/Training.
  - `duration_days` (int): Duration in days.
  - `organizer` (str): Name of the organizing institution.
  - `department` (str, optional): Faculty's department.
  - `file` (file, optional): PDF certificate of participation.

## Response Data
- **Code:** `201 Created`
- **Fields:** Standard Self-Development FDP fields.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
