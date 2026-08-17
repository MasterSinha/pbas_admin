# Create Research Proposal

**Endpoint Name:** Create Research Proposal  
**URL Path:** `/api/v1/part-b/research-proposals`  
**Method:** `POST`

## Description
Adds a new research proposal submitted for funding.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Type:** `multipart/form-data`
- **Fields:**
  - `proposal_title` (str): Title of the research proposal.
  - `duration` (str): Duration of the project.
  - `funding_agency` (str): Agency to which it's submitted.
  - `grant_amount` (float): Amount of grant requested.
  - `department` (str, optional): Faculty's department.
  - `file` (file, optional): PDF proof of submission.

## Response Data
- **Code:** `201 Created`
- **Fields:** Standard Research Proposal fields.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
