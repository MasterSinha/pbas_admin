# Get Non-Teaching Appraisal Detail

**URL Path:** `/api/v1/non-teaching/{staff_id}`

**Method:** `GET`

**Description:** Retrieves the full appraisal details for a specific non-teaching staff member for the current or specified academic year.

## Request Data
- **Parameters:**
    - `staff_id` (UUID, path): Unique identifier of the staff member.
- **Query Parameters:**
    - `academic_year` (str, optional): Academic year to filter.

## Response Data
- **Success (200 OK):** A JSON object containing all sections of the appraisal (General Info, Part A, Part B, Recommendations).

## Access Control
- **Roles:** `staff` (own), `section_head`, `registrar`, `vc`, `admin`.
- **Hierarchy Enforcement:** Verified via the reporting tree.
