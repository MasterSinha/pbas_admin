# Registrar Review (Part A & Registrar Marks)

**URL Path:** `/api/v1/non-teaching/{id}/registrar-review`

**Method:** `PATCH`

**Description:** Allows the Registrar to provide the final institutional audit marks for Part A and their overall recommendation.

## Request Data
- **Type:** `application/json`
- **Parameters:**
    - `id` (UUID, path): Appraisal form ID.
- **Body (JSON):**
    - **Part A (Registrar Marks):**
        - `responsibilities_registrar` (float)
        - `contributions_registrar` (float)
        - `achievements_registrar` (float)
    - **Registrar Final:**
        - `registrar_recommendation` (str): Audit remarks.
        - `registrar_grade` (str): Audited grade.
        - `registrar_signature_date` (date): Date of review.

## Response Data
- **Success (200 OK):**
    - `status` (str): `REGISTRAR_REVIEWED`
    - `grand_total_registrar` (float): Part A (Registrar) + Part B.

## Access Control
- **Roles:** `registrar`, `admin`.
- **Hierarchy:** Registrar has university-wide authority over non-teaching staff.
