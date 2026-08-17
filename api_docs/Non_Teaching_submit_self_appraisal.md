# Submit Non-Teaching Self-Appraisal (Part A)

**URL Path:** `/api/v1/non-teaching/{id}/self-appraisal`

**Method:** `PATCH`

**Description:** Allows the staff member to submit their self-appraisal details (Part A) and finalize their section of the form.

## Request Data
- **Type:** `application/json`
- **Parameters:**
    - `id` (UUID, path): Appraisal form ID.
- **Body (JSON):**
    - `responsibilities_staff` (float): Marks claimed for Current Responsibilities.
    - `contributions_staff` (float): Marks claimed for Other Useful Contributions.
    - `achievements_staff` (float): Marks claimed for Achievements.
    - `staff_signature_date` (date): Date of digital signature.

## Response Data
- **Success (200 OK):**
    - `status` (str): `SUBMITTED`
    - `total_part_a_staff` (float): Total claimed score.

## Access Control
- **Roles:** `staff` (own data).
- **Hierarchy:** Only the owner of the appraisal can call this.
