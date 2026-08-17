# Create Research Award

**Endpoint Name:** Create Research Award  
**URL Path:** `/api/v1/part-b/research-awards`  
**Method:** `POST`

## Description
Adds a new research award or recognition received by the faculty.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Type:** `multipart/form-data`
- **Fields:**
  - `award_name` (str): Name of the award.
  - `award_date` (date): Date of receiving the award.
  - `awarding_agency` (str): Organization that gave the award.
  - `level` (str): International/National/State level.
  - `department` (str, optional): Faculty's department.
  - `file` (file, optional): PDF certificate of the award.

## Response Data
- **Code:** `201 Created`
- **Fields:** Standard Research Award fields.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
