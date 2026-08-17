# Create Enclosure

**URL Path:** `/api/v1/enclosures`

**Method:** `POST`

**Description:** Adds a new enclosure (document or text) to the appraisal. Supports file uploads for supporting evidence.

## Request Data
- **Type:** `multipart/form-data`
- **Body (Form Data):**
    - `enclosure_text` (str): Description or text of the enclosure.
    - `file` (UploadFile, optional): PDF document of the enclosure.

## Response Data
- **Success (201 Created):**
    - `id` (UUID): Unique identifier of the enclosure.
    - `faculty_id` (UUID): ID of the faculty owner.
    - `enclosure_text` (str): The provided text.
    - `document` (str): Path to the uploaded file. 
        - *Supabase Mode:* Relative path (e.g., `id/uuid_name.pdf`).
        - *Local Mode:* Static URL path (e.g., `/uploads/id/uuid_name.pdf`).

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
