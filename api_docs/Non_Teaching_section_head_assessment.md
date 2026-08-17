# Section Head Assessment (Part B & Section Head Marks)

**URL Path:** `/api/v1/non-teaching/{id}/section-head-assessment`

**Method:** `PATCH`

**Description:** Allows the Section Head (Authority Staff) to assess the staff member across Part B metrics and provide marks for Part A.

## Request Data
- **Type:** `application/json`
- **Parameters:**
    - `id` (UUID, path): Appraisal form ID.
- **Body (JSON):**
    - **Part A (Section Head Marks):**
        - `responsibilities_sh` (float)
        - `contributions_sh` (float)
        - `achievements_sh` (float)
    - **Part B (Professional Competence - 1-5 pts each):**
        - `pc_knowledge_rules`: int
        - `pc_organize_work`: int
        - `pc_additional_assignments`: int
        - `pc_creativity_innovation`: int
        - `pc_learn_new_duties`: int
    - **Part B (Quality of Work - 1-5 pts each):**
        - `qw_maintain_records`: int
        - `qw_accuracy_speed`: int
        - `qw_neatness_tidiness`: int
        - `qw_completion_time`: int
        - `qw_diligence_responsibility`: int
    - **Part B (Personal Characteristics - 1-5 pts each):**
        - `ph_reliability`: int
        - `ph_attitude_respect`: int
        - `ph_discipline`: int
        - `ph_team_work`: int
        - `ph_integrity_behavior`: int
        - `ph_interpersonal_relations`: int
    - **Part B (Regularity - 1-5 pts each):**
        - `rg_attendance_punctuality`: int
        - `rg_leave_discipline`: int
        - `rg_communication`: int
        - `rg_adherence_hours`: int
        - `rg_responsibility_absence`: int
    - **Section Head Final:**
        - `sh_recommendation` (str): Detailed recommendation.
        - `sh_grade` (str): Recommended grade.
        - `sh_signature_date` (date): Date of assessment.

## Response Data
- **Success (200 OK):**
    - `status` (str): `SECTION_HEAD_REVIEWED`
    - `total_part_b_score` (int): Calculated score.
    - `grand_total_sh` (float): Part A (SH) + Part B.

## Access Control
- **Roles:** `section_head`, `admin`.
- **Hierarchy:** Section Head must have authority over the staff member's section/school.
