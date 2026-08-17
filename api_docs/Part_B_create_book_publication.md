# Create Book Publication

**URL Path:** `/api/v1/book-publications`
**HTTP Method:** `POST`
**Description:** Creates a new book or chapter publication entry.

## Request Data
- **Type:** `multipart/form-data`
- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| title_and_pages | string | Title and pages |
| book_title_editor | string | Book title and editor |
| issn_isbn | string | ISSN/ISBN |
| publisher_type | string | National/International |
| co_authors_count | integer | Number of co-authors |
| is_first_author | boolean | Is first author |
| department | string | Department (optional) |
| file | file (PDF) | Proof document (optional) |

## Response Data
- **Success Status Code:** 201 Created

- **Fields:**

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| id | UUID | Unique identifier |
| faculty_id | UUID | ID of the faculty owner |
| title_and_pages | string/mixed | As per request |
| book_title_editor | string/mixed | As per request |
| issn_isbn | string/mixed | As per request |
| publisher_type | string/mixed | As per request |
| co_authors_count | string/mixed | As per request |
| is_first_author | string/mixed | As per request |
| department | string | Faculty department |
| document | string | Path to uploaded PDF |
## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
