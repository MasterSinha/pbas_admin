# Create Conference Paper

**Endpoint Name:** Create Conference Paper  
**URL Path:** `/api/v1/part-b/conferences`  
**Method:** `POST`

## Description
Adds a new record for a paper presented in a conference or seminar.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Type:** `multipart/form-data`
- **Fields:**
  - `event_title` (str): Title of the conference/seminar.
  - `event_date` (date): Date of the event.
  - `activity_type` (str): Type of presentation (Oral/Poster, etc.).
  - `hosting_organization` (str): Name of the host institution.
  - `event_level` (str): International/National/State level.
  - `department` (str, optional): Faculty's department.
  - `file` (file, optional): PDF proof of presentation.

## Response Data
- **Code:** `201 Created`
- **Fields:**
  - `id` (UUID): Created record ID.
  - `api_score_faculty` (float): Automatically calculated score.
  - ... (other fields)

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
