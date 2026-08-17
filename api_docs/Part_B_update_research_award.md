# Update Research Award

**Endpoint Name:** Update Research Award  
**URL Path:** `/api/v1/part-b/research-awards/{award_id}`  
**Method:** `PUT`

## Description
Updates an existing research award record.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Type:** `application/json`
- **Path Parameters:**
  - `award_id` (UUID).
- **Body (JSON):**
  - `award_name`, `award_date`, `awarding_agency`, `level`, `research_score_hod`, `research_score_director`.

## Response Data
- **Code:** `200 OK`

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
