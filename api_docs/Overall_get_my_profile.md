# Get My Profile

**URL Path:** `/api/v1/profile`

**Method:** `GET`

**Description:** Retrieves the profile details of the currently logged-in user.

## Response Data
- **Success (200 OK):**
    - `id` (UUID): User ID.
    - `email` (str): User email.
    - `role` (str): User role.
    - `employee_id` (str): Official employee ID.
    - `name` (str): Full name.
    - `designation` (str): Job title.
    - `qualification` (str): Educational qualification.
    - `department` (str): Assigned department.
    - `experience` (int): Total years of experience.
    - `phone` (str): Contact number.
    - `school_id` (UUID): ID of the school.

## Access Control
- **Roles:** `faculty` (own data), `hod`, `director`, `dean`, `vc`, `admin`.
- **Hierarchy:** `Faculty (Own Data) < HoD (Dept/School) < Director (School) < Dean (Division) < VC (All)`.
- Higher authorities can see/manage data of subordinates; same-level users are isolated from each other.

## Troubleshooting & Common Errors
- **403 Forbidden**: User lacks the correct role or is trying to access someone outside their jurisdiction (Department/School/Division).
- **500 Internal Server Error (ForeignKeyViolation)**: This error occurs if you try to create data for a `faculty_id` that does not already have a profile in the `faculty` table. **A faculty profile MUST be created first.**
- **500 Internal Server Error (UndefinedColumn)**: Indicates a database schema mismatch.
