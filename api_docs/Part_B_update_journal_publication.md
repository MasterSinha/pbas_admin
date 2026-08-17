# Update Journal Publication

**Endpoint Name:** Update Journal Publication  
**URL Path:** `/api/v1/part-b/journal-publications/{publication_id}`  
**Method:** `PUT`

## Description
Updates an existing journal publication record. The allowed updates depend on the role of the user.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Request Data
- **Type:** `application/json`
- **Path Parameters:**
  - `publication_id` (UUID): The unique identifier of the publication record.
- **Body (JSON):**
  - **Faculty Fields:** `sr_no`, `title_with_page_nos`, `journal_details`, `issn_isbn_no`, `indexing`, `department`.
  - **HOD Fields:** `api_score_hod`.
  - **Director Fields:** `api_score_director`.

## Response Data
- **Code:** `200 OK`
- **Fields:** Updated Journal Publication object.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
