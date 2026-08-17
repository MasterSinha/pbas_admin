# Create or Initialize Non-Teaching Appraisal

**URL Path:** `/api/v1/non-teaching`

**Method:** `POST`

**Description:** Initializes a new appraisal form for a non-teaching staff member. Typically called by the staff member at the start of the appraisal cycle.

## Request Data
- **Type:** `application/json`
- **Body (JSON):**
    - `academic_year` (str): e.g., "2025-26"
    - `joining_date` (date): Date of joining the university.
    - `designation` (str): Current designation.
    - `department_section` (str): Department or Section.
    - `experience_dypiu` (float): Years of experience at DYPIU.
    - `total_experience` (float): Total years of work experience.
    - `current_qualifications` (str): Current educational qualifications.
    - `new_qualifications` (str, optional): Qualifications acquired during the current year.
    - `reporting_head` (str): Name/Designation of the reporting head.
    - `other_info` (str, optional): Any other relevant information.

## Response Data
- **Success (201 Created):**
    - `id` (UUID): Unique identifier of the appraisal form.
    - `staff_id` (UUID): ID of the staff member.
    - `status` (str): `DRAFT`
    - ... (all submitted fields)

## Access Control
- **Roles:** `staff`, `admin`.
- **Note:** Only the staff member themselves or an admin can initialize the form.
