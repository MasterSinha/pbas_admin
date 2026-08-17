# Get Appraisal Summary

**URL Path:** `/api/v1/appraisal-summary/{faculty_id}`

**Method:** `GET`

**Description:** Retrieves the aggregated appraisal summary for a faculty member, combining scores from Part A and Part B.

## Request Data
- **Parameters:**
    - `faculty_id` (UUID, path): Unique identifier of the faculty member.

## Response Data
- **Success (200 OK):**
    - `faculty_id` (UUID): ID of the faculty.
    - `part_a_summary` (object):
        - `teaching_score`, `feedback_score`, `dept_score`, `university_score`, `social_score`, `industry_score`, `acr_score`, `part_a_total`.
    - `part_b_summary` (object):
        - `journal_score`, `book_score`, `pedagogy_score`, `guidance_score`, `project_score`, `ipr_score`, `award_score`, `conference_score`, `proposal_score`, `product_score`, `self_development_score`, `industrial_training_score`, `part_b_total`.
    - `grand_total_score` (float): Sum of Part A and Part B totals (Max 575).

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
