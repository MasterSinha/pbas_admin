# Admin UI — API Integration Documentation

> **Base URL (local dev):** `http://localhost:8000`  
> **Base URL (production):** GCP Cloud Run URL (set in `.env` as `APP_URL`)  
> **All paths prefixed with:** `/api/v1/`  
> **Dev proxy:** Vite forwards `/api/*` → `http://localhost:8000` automatically  
> **Auth header:** `Authorization: Bearer <token>` on every protected route

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Admin — Users](#2-admin--users)
3. [Admin — Stats](#3-admin--stats)
4. [Admin — Appraisal Config](#4-admin--appraisal-config)
5. [Admin — Pending Faculty](#5-admin--pending-faculty)
6. [Admin — Env Config](#6-admin--env-config)
7. [Feedback](#7-feedback)
8. [Announcements](#8-announcements)
9. [Analytics Export](#9-analytics-export)
10. [Role & School Reference](#10-role--school-reference)
11. [Error Response Format](#11-error-response-format)
12. [Frontend API Client Reference](#12-frontend-api-client-reference)
13. [Normalizer Mapping Tables](#13-normalizer-mapping-tables)
14. [Endpoint Summary](#14-endpoint-summary)

---

## 1. Authentication

### `POST /api/v1/auth/login`

Authenticates a user and returns a JWT. Admin UI only accepts `appraisal_role = "admin"`.

#### Request body

| Field      | Type      | Required | Constraints          |
|------------|-----------|----------|----------------------|
| `email`    | `string`  | Yes      | Valid email format   |
| `password` | `string`  | Yes      | Plain text; bcrypt-verified server-side |

```json
{
  "email": "admin@dypiu.edu",
  "password": "YourPassword123"
}
```

#### Response `200 OK`

| Field                     | Type      | Description                                    |
|---------------------------|-----------|------------------------------------------------|
| `token`                   | `string`  | JWT — store in `localStorage` as `admin_token` |
| `profile.email`           | `string`  | User's email address                           |
| `profile.full_name`       | `string`  | Display name                                   |
| `profile.appraisal_role`  | `string`  | Must be `"admin"` for dashboard access         |
| `profile.department`      | `string \| null` | Department name                        |
| `profile.school`          | `string \| null` | School code (see §10)                  |
| `profile.employee_id`     | `string \| null` | Staff ID                               |
| `profile.designation`     | `string \| null` | Job title                              |
| `profile.qualification`   | `string \| null` | Academic qualification                 |
| `profile.teaching_experience` | `string \| null` | e.g. `"10 years"`              |
| `profile.phone`           | `string \| null` | Contact number                         |
| `profile.avatar`          | `string \| null` | URL to profile image                   |

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "profile": {
    "email": "admin@dypiu.edu",
    "full_name": "Admin User",
    "appraisal_role": "admin",
    "department": null,
    "school": null,
    "employee_id": null,
    "designation": "System Administrator",
    "qualification": null,
    "teaching_experience": null,
    "phone": null,
    "avatar": null
  }
}
```

#### Error responses

| Status | When                                    |
|--------|-----------------------------------------|
| `401`  | Email not found or password mismatch    |
| `403`  | Account found but `is_verified = false` |

> **Note:** The `api/client.js` login function also throws locally if `appraisal_role !== "admin"`, even if the server returned 200.

---

### `GET /api/v1/auth/me`

Returns the currently logged-in user's profile. Requires valid token.

**Response `200`:** Same shape as `profile` object in login response.

---

### `PUT /api/v1/auth/me`

Updates the logged-in user's own profile fields.

#### Request body (all optional)

| Field                 | Type             | Description             |
|-----------------------|------------------|-------------------------|
| `full_name`           | `string \| null` | Display name            |
| `employee_id`         | `string \| null` | Staff ID                |
| `qualification`       | `string \| null` | Academic qualification  |
| `designation`         | `string \| null` | Job title               |
| `department`          | `string \| null` | Department              |
| `school`              | `string \| null` | School code             |
| `teaching_experience` | `string \| null` | Years / description     |
| `phone`               | `string \| null` | Contact number          |
| `avatar`              | `string \| null` | URL to profile image    |

---

### `POST /api/v1/auth/forgot-password`

Sends a password reset link to the given email. Always returns `200` (no email enumeration).

```json
{ "email": "faculty@dypiu.edu" }
```

---

### `POST /api/v1/auth/reset-password`

Resets a password using the token from the reset email.

| Field          | Type     | Required |
|----------------|----------|----------|
| `token`        | `string` | Yes      |
| `new_password` | `string` | Yes      |

---

## 2. Admin — Users

All endpoints require admin JWT.

---

### `GET /api/v1/admin/users`

Returns all registered users, ordered by school then name.

#### Query parameters

| Param    | Type     | Description                                    |
|----------|----------|------------------------------------------------|
| `school` | `string` | Filter by exact school code (e.g. `SoCSEA`)   |
| `role`   | `string` | Filter by `appraisal_role` (e.g. `faculty`)   |
| `search` | `string` | Case-insensitive match on `email` or `full_name` |

#### Response `200` — array of user objects

| Field                 | Type              | Description                                        |
|-----------------------|-------------------|----------------------------------------------------|
| `email`               | `string`          | **Primary key.** Unique login email                |
| `full_name`           | `string`          | Display name                                       |
| `appraisal_role`      | `string`          | One of the roles in §10                            |
| `school`              | `string \| null`  | School code from §10                               |
| `department`          | `string \| null`  | Department within the school                       |
| `designation`         | `string \| null`  | Job title / designation                            |
| `employee_id`         | `string \| null`  | Staff / employee ID                                |
| `phone`               | `string \| null`  | Contact number                                     |
| `qualification`       | `string \| null`  | Highest academic qualification                     |
| `teaching_experience` | `string \| null`  | Teaching experience description                    |
| `is_verified`         | `boolean`         | `false` = email not yet verified (unverified user) |
| `created_at`          | `string`          | ISO 8601 datetime — account creation timestamp     |

```json
[
  {
    "email": "john.doe@dypiu.edu",
    "full_name": "Dr. John Doe",
    "appraisal_role": "faculty",
    "school": "SoCSEA",
    "department": "Computer Science",
    "designation": "Assistant Professor",
    "employee_id": "EMP-0042",
    "phone": "+91-9876543210",
    "qualification": "Ph.D",
    "teaching_experience": "8 years",
    "is_verified": true,
    "created_at": "2023-08-01T09:00:00Z"
  }
]
```

> **Important:** There is **no** `id` (UUID) or `has_submitted` field in this response. `email` is the unique identifier. Submission status must be derived from `/admin/stats`.

---

### `POST /api/v1/admin/users`

Creates a new user. Admin-created accounts skip email verification (`is_verified = true` by default).

#### Request body

| Field                 | Type      | Required | Constraints                              |
|-----------------------|-----------|----------|------------------------------------------|
| `email`               | `string`  | Yes      | Valid email; must be unique              |
| `password`            | `string`  | Yes      | Plain text — hashed server-side (bcrypt) |
| `full_name`           | `string`  | Yes      | Display name                             |
| `appraisal_role`      | `string`  | No       | Default: `"faculty"`. See valid roles §10 |
| `school`              | `string`  | No       | School code from §10                     |
| `department`          | `string`  | No       | Department name                          |
| `designation`         | `string`  | No       | Job title                                |
| `employee_id`         | `string`  | No       | Staff ID                                 |
| `phone`               | `string`  | No       | Contact number                           |
| `qualification`       | `string`  | No       | e.g. `"Ph.D"`                            |
| `teaching_experience` | `string`  | No       | e.g. `"5 years"`                         |
| `is_verified`         | `boolean` | No       | Default: `true` for admin-created users  |

```json
{
  "email": "jane.smith@dypiu.edu",
  "password": "Welcome@2025",
  "full_name": "Dr. Jane Smith",
  "appraisal_role": "faculty",
  "school": "SoBB",
  "department": "Biotechnology",
  "designation": "Associate Professor",
  "employee_id": "EMP-0099",
  "qualification": "Ph.D"
}
```

#### Response `201 Created`

```json
{
  "message": "User created",
  "email": "jane.smith@dypiu.edu",
  "role": "faculty"
}
```

#### Errors

| Status | When                               |
|--------|------------------------------------|
| `400`  | Invalid `appraisal_role` value     |
| `400`  | Email already registered           |

---

### `PUT /api/v1/admin/users/{email}`

Updates an existing user. Only supply fields you want to change.

**Path param:** `email` — URL-encode the email (client does this automatically).

#### Request body (all optional)

| Field                 | Type              | Description                                       |
|-----------------------|-------------------|---------------------------------------------------|
| `full_name`           | `string \| null`  | New display name                                  |
| `appraisal_role`      | `string \| null`  | New role — must be a valid role from §10          |
| `school`              | `string \| null`  | New school assignment                             |
| `department`          | `string \| null`  | New department                                    |
| `designation`         | `string \| null`  | New job title                                     |
| `employee_id`         | `string \| null`  | New staff ID                                      |
| `phone`               | `string \| null`  | New contact number                                |
| `qualification`       | `string \| null`  | New qualification                                 |
| `teaching_experience` | `string \| null`  | New experience description                        |
| `is_verified`         | `boolean \| null` | Set `false` to block login                        |
| `password`            | `string \| null`  | If provided, resets the user's password           |

```json
{ "is_verified": false }
```

#### Response `200`

```json
{
  "message": "User updated",
  "email": "jane.smith@dypiu.edu",
  "role": "faculty"
}
```

---

### `DELETE /api/v1/admin/users/{email}`

Permanently deletes a user and all associated data.

**Path param:** `email` — URL-encoded.

#### Response `200`

```json
{ "message": "User jane.smith@dypiu.edu deleted" }
```

| Status | When            |
|--------|-----------------|
| `404`  | User not found  |

---

## 3. Admin — Stats

### `GET /api/v1/admin/stats`

Central stats endpoint. Powers Overview, Appraisal Cycle, Submission Status, School Statistics, and Analytics pages.

#### Query parameters

| Param           | Type     | Description                                                    |
|-----------------|----------|----------------------------------------------------------------|
| `academic_year` | `string` | e.g. `"2024-25"`. Defaults to most recent year if omitted.     |

#### Response `200`

| Field                         | Type                   | Description                                                     |
|-------------------------------|------------------------|-----------------------------------------------------------------|
| `academic_year`               | `string \| null`       | The year data is filtered to                                    |
| `available_years`             | `string[]`             | All years with any declaration data, newest first               |
| `total_registered`            | `integer`              | Total users in the system (all roles)                           |
| `by_role`                     | `object`               | `{ "faculty": 120, "hod": 15, ... }` — count per role          |
| `by_school_registered`        | `object`               | `{ "SoCSEA": 55, "SoBB": 40 }` — registered count per school   |
| `teaching_submission_pipeline`| `object`               | `{ "Pending Review": 30, "Approved": 90 }` — declaration status counts |
| `by_school_submitted`         | `object`               | Per-school submission status breakdown (see below)              |
| `by_department_submitted`     | `object`               | Per-department submission status breakdown                      |
| `non_teaching_pipeline`       | `object`               | `{ "draft": 5, "submitted": 15 }` — non-teaching appraisal counts |

**`by_school_submitted` shape:**
```json
{
  "SoCSEA": { "Pending Review": 10, "Approved": 45 },
  "SoBB":   { "Approved": 28, "Pending Review": 12 }
}
```

**Full response example:**
```json
{
  "academic_year": "2024-25",
  "available_years": ["2024-25", "2023-24"],
  "total_registered": 183,
  "by_role": {
    "faculty": 120,
    "hod": 18,
    "director": 9,
    "dean": 5,
    "non_teaching_staff": 31
  },
  "by_school_registered": {
    "SoCSEA": 55,
    "SoBB": 40,
    "SoCE": 26,
    "SoEMR": 22,
    "SoC": 18
  },
  "teaching_submission_pipeline": {
    "Pending Review": 30,
    "Approved": 90,
    "Rejected": 5
  },
  "by_school_submitted": {
    "SoCSEA": { "Pending Review": 8, "Approved": 42 },
    "SoBB":   { "Approved": 28, "Pending Review": 10 }
  },
  "by_department_submitted": {
    "Computer Science": { "Approved": 20, "Pending Review": 4 }
  },
  "non_teaching_pipeline": {
    "draft": 5,
    "submitted": 15,
    "approved": 11
  }
}
```

#### How the frontend normalizer converts this

| Raw field                     | Normalizer output | Calculation                                               |
|-------------------------------|-------------------|-----------------------------------------------------------|
| `total_registered`            | `total`           | Direct                                                    |
| `teaching_submission_pipeline`| `submitted`       | Sum of all status values                                  |
| —                             | `pending`         | `total - submitted`                                       |
| `by_school_submitted` + `by_school_registered` | `bySchool[]` | Per school: `sub` = sum of status values, `pend` = registered − sub |

---

## 4. Admin — Appraisal Config

Controls whether the submission window is open for a given academic year.

---

### `GET /api/v1/admin/appraisal-config`

Lists all appraisal cycle configurations.

#### Response `200` — array

| Field              | Type               | Description                                     |
|--------------------|--------------------|-------------------------------------------------|
| `id`               | `integer`          | Primary key                                     |
| `academic_year`    | `string`           | e.g. `"2024-25"` — unique per row               |
| `is_open`          | `boolean`          | `true` = submission window currently open       |
| `submission_start` | `string \| null`   | ISO 8601 datetime — window opens at this time   |
| `submission_end`   | `string \| null`   | ISO 8601 datetime — window closes at this time  |
| `updated_at`       | `string`           | ISO 8601 datetime — last modified               |

```json
[
  {
    "id": 1,
    "academic_year": "2024-25",
    "is_open": true,
    "submission_start": "2025-01-01T00:00:00",
    "submission_end":   "2025-06-30T23:59:59",
    "updated_at": "2025-04-10T08:30:00"
  }
]
```

---

### `POST /api/v1/admin/appraisal-config`

Creates a new cycle config. One row per academic year.

#### Request body

| Field              | Type               | Required | Description                       |
|--------------------|--------------------|----------|-----------------------------------|
| `academic_year`    | `string`           | Yes      | e.g. `"2025-26"` — must be unique |
| `is_open`          | `boolean`          | No       | Default: `false`                  |
| `submission_start` | `string \| null`   | No       | ISO 8601 datetime                 |
| `submission_end`   | `string \| null`   | No       | ISO 8601 datetime                 |

```json
{
  "academic_year": "2025-26",
  "is_open": false,
  "submission_start": "2026-01-01T00:00:00",
  "submission_end":   "2026-06-30T23:59:59"
}
```

#### Response `201`

```json
{
  "message": "Appraisal config created",
  "academic_year": "2025-26",
  "is_open": false
}
```

---

### `PUT /api/v1/admin/appraisal-config/{academic_year}`

Updates an existing cycle. All fields optional.

**Path param:** `academic_year` — e.g. `2024-25` (URL-encode the hyphen if needed).

#### Request body (all optional)

| Field              | Type               | Description                  |
|--------------------|--------------------|------------------------------|
| `is_open`          | `boolean \| null`  | Toggle the submission window |
| `submission_start` | `string \| null`   | ISO 8601 datetime            |
| `submission_end`   | `string \| null`   | ISO 8601 datetime            |

```json
{ "is_open": true }
```

---

### `DELETE /api/v1/admin/appraisal-config/{academic_year}`

Deletes the config for the given year.

**Response `200`:** `{ "message": "Config for '2024-25' deleted" }`

---

## 5. Admin — Pending Faculty

### `GET /api/v1/admin/pending-faculty`

Returns faculty who have **not** submitted a declaration for the given year. More efficient than filtering `/admin/users` client-side.

#### Query parameters

| Param           | Type     | Required | Description                             |
|-----------------|----------|----------|-----------------------------------------|
| `academic_year` | `string` | Yes      | e.g. `"2024-25"`                        |
| `school`        | `string` | No       | Filter by school code                   |

#### Response `200` — array

| Field            | Type             | Description                  |
|------------------|------------------|------------------------------|
| `email`          | `string`         | User email (primary key)     |
| `full_name`      | `string`         | Display name                 |
| `appraisal_role` | `string`         | Their role                   |
| `school`         | `string \| null` | School code                  |
| `department`     | `string \| null` | Department                   |

```json
[
  {
    "email": "pending.prof@dypiu.edu",
    "full_name": "Prof. Pending",
    "appraisal_role": "faculty",
    "school": "SoCE",
    "department": "Civil Engineering"
  }
]
```

> Only includes roles: `faculty`, `hod`, `director`, `dean` — other roles are excluded.

---

## 6. Admin — Env Config

Reads and writes server `.env` variables. Only a safe subset of keys is exposed.

### `GET /api/v1/admin/config`

#### Response `200` — object of editable keys

| Key                  | Type     | Description                               |
|----------------------|----------|-------------------------------------------|
| `APP_URL`            | `string` | Backend public URL (no trailing slash)    |
| `FRONTEND_URL`       | `string` | Frontend public URL (no trailing slash)   |
| `MAIL_USERNAME`      | `string` | SMTP username                             |
| `MAIL_PASSWORD`      | `string` | SMTP password                             |
| `MAIL_FROM`          | `string` | Sender email address                      |
| `MAIL_PORT`          | `string` | SMTP port (e.g. `"587"`)                  |
| `MAIL_SERVER`        | `string` | SMTP host (e.g. `"smtp.gmail.com"`)       |
| `MAIL_TLS`           | `string` | `"true"` or `"false"`                     |
| `MAIL_SSL`           | `string` | `"true"` or `"false"`                     |
| `ALLOW_MOCK_USER`    | `string` | `"true"` bypasses login (dev only)        |
| `USE_LOCAL_STORAGE`  | `string` | `"true"` = local disk, `"false"` = GCS   |
| `GCP_STORAGE_BUCKET` | `string` | GCS bucket name                           |

```json
{
  "APP_URL": "https://faculty-appraisal-git-xxx.asia-south1.run.app",
  "FRONTEND_URL": "https://dypfacultyappraisal.netlify.app",
  "MAIL_SERVER": "smtp.gmail.com",
  "MAIL_PORT": "587",
  "MAIL_TLS": "true",
  "USE_LOCAL_STORAGE": "false",
  "GCP_STORAGE_BUCKET": "faculty-appraisal-bucket"
}
```

> Keys not in the allowed list (`DATABASE_URL`, `JWT_SECRET_KEY`, etc.) are **never** returned or writable via this endpoint.

---

### `PUT /api/v1/admin/config`

Updates one or more `.env` keys. Changes to `APP_URL`/`FRONTEND_URL`/mail settings apply immediately. Storage and auth settings require a server restart.

#### Request body

Send any subset of the keys listed in the GET response.

```json
{
  "FRONTEND_URL": "https://new-app.netlify.app",
  "MAIL_SERVER": "smtp.gmail.com"
}
```

#### Response `200`

```json
{
  "message": "Config updated. Changes to email/URL settings take effect immediately. Storage and auth settings require a server restart.",
  "updated": ["FRONTEND_URL", "MAIL_SERVER"]
}
```

| Status | When                                     |
|--------|------------------------------------------|
| `400`  | A key is not in the allowed set          |

---

## 7. Feedback

### `POST /api/v1/feedback`

Public endpoint — any user (no token required) can submit feedback.

#### Request body

| Field      | Type     | Required | Constraints                                          |
|------------|----------|----------|------------------------------------------------------|
| `email`    | `string` | Yes      | Valid email, max 254 chars                           |
| `category` | `string` | Yes      | One of: `query`, `feedback`, `bug`, `suggestion`, `other` |
| `subject`  | `string` | Yes      | Max 120 chars                                        |
| `message`  | `string` | Yes      | Max 5000 chars                                       |
| `name`     | `string` | No       | Submitter name, max 80 chars                         |

```json
{
  "email": "faculty@dypiu.edu",
  "name": "Dr. Sharma",
  "category": "bug",
  "subject": "Form not saving",
  "message": "The appraisal form loses data when I click Submit."
}
```

#### Response `200`

```json
{
  "success": true,
  "message": "Feedback saved.",
  "feedback": {
    "id": "uuid-string",
    "status": "open",
    "submitted_at": "2025-05-10T14:22:00Z"
  }
}
```

---

### `GET /api/v1/feedback`

Admin only. Returns feedback items newest-first.

#### Query parameters

| Param      | Type      | Description                                                  |
|------------|-----------|--------------------------------------------------------------|
| `category` | `string`  | Filter: `query`, `feedback`, `bug`, `suggestion`, `other`    |
| `status`   | `string`  | Filter: `open`, `in_review`, `resolved`                      |
| `limit`    | `integer` | Max records returned. Default: `50`, max: `100`              |

#### Response `200` — array

| Field          | Type             | Description                                           |
|----------------|------------------|-------------------------------------------------------|
| `id`           | `string`         | UUID                                                  |
| `name`         | `string \| null` | Submitter's name (optional at submission time)        |
| `email`        | `string`         | Submitter's email                                     |
| `category`     | `string`         | `query`, `feedback`, `bug`, `suggestion`, or `other`  |
| `subject`      | `string`         | Short description                                     |
| `message`      | `string`         | Full message text                                     |
| `status`       | `string`         | `open`, `in_review`, or `resolved`                    |
| `ip_address`   | `string \| null` | Submitter's IP (admin visibility only)                |
| `submitted_at` | `string`         | ISO 8601 datetime                                     |

```json
[
  {
    "id": "abc-123",
    "name": "Dr. Sharma",
    "email": "sharma@dypiu.edu",
    "category": "bug",
    "subject": "Form not saving",
    "message": "The appraisal form loses data on submit.",
    "status": "open",
    "ip_address": "103.x.x.x",
    "submitted_at": "2025-05-08T10:30:00Z"
  }
]
```

---

### `GET /api/v1/feedback/{feedback_id}`

Returns a single feedback entry (admin only). Same shape as list item, plus `user_agent` field.

| Extra field  | Type     | Description                        |
|--------------|----------|------------------------------------|
| `user_agent` | `string` | Browser user-agent string (admin)  |

---

## 8. Announcements

Admin-only. Stores broadcast notices displayed on faculty dashboards and the login page.

---

### `GET /api/v1/admin/announcements`

Returns all announcements, newest first. Requires admin JWT.

#### Query parameters

| Param       | Type      | Description                                              |
|-------------|-----------|----------------------------------------------------------|
| `is_active` | `boolean` | If `true`, return only active notices. Omit for all.     |
| `limit`     | `integer` | Max records returned. Default: `50`, max: `200`          |

#### Response `200` — array

| Field        | Type      | Description                                                        |
|--------------|-----------|--------------------------------------------------------------------|
| `id`         | `integer` | Primary key (auto-increment)                                       |
| `title`      | `string`  | Short headline, max 200 chars                                      |
| `body`       | `string`  | Full message text, max 5000 chars                                  |
| `audience`   | `string`  | Target group — see valid values below                              |
| `is_active`  | `boolean` | `true` = visible on faculty dashboards; `false` = archived         |
| `created_by` | `string`  | Email of the admin who created the notice                          |
| `created_at` | `string`  | ISO 8601 datetime                                                  |

```json
[
  {
    "id": 1,
    "title": "Submission window extended",
    "body": "The appraisal submission deadline has been extended to 30 June 2025.",
    "audience": "all",
    "is_active": true,
    "created_by": "admin@dypiu.edu",
    "created_at": "2025-05-01T09:00:00Z"
  }
]
```

**Valid `audience` values:**

| Value                | Visible to                                    |
|----------------------|-----------------------------------------------|
| `all`                | Every logged-in user                          |
| `faculty`            | Teaching faculty only                         |
| `hod`                | Heads of Department only                      |
| `dean`               | Deans only                                    |
| `non_teaching_staff` | Non-teaching staff only                       |

---

### `POST /api/v1/admin/announcements`

Creates and optionally publishes a new announcement. Requires admin JWT.

#### Request body

| Field       | Type      | Required | Constraints                                              |
|-------------|-----------|----------|----------------------------------------------------------|
| `title`     | `string`  | Yes      | Max 200 chars                                            |
| `body`      | `string`  | Yes      | Max 5000 chars                                           |
| `audience`  | `string`  | No       | Default: `"all"`. See valid values above                 |
| `is_active` | `boolean` | No       | Default: `true`. Set `false` to save as a draft          |

```json
{
  "title": "Submission window extended",
  "body": "The appraisal submission deadline has been extended to 30 June 2025. Please submit your appraisal at the earliest.",
  "audience": "all",
  "is_active": true
}
```

#### Response `201 Created`

```json
{
  "message": "Announcement created",
  "id": 1,
  "title": "Submission window extended",
  "is_active": true
}
```

| Status | When                         |
|--------|------------------------------|
| `400`  | `title` or `body` missing    |
| `400`  | Invalid `audience` value     |
| `400`  | Invalid `channel` value      |

---

### `PUT /api/v1/admin/announcements/{id}`

Updates an existing announcement. All fields optional. Requires admin JWT.

**Path param:** `id` — integer primary key.

#### Request body (all optional)

| Field       | Type               | Description                                          |
|-------------|--------------------|------------------------------------------------------|
| `title`     | `string \| null`   | Updated headline                                     |
| `body`      | `string \| null`   | Updated message text                                 |
| `audience`  | `string \| null`   | Updated audience scope                               |
| `is_active` | `boolean \| null`  | Set `false` to deactivate / archive the notice       |

```json
{ "is_active": false }
```

#### Response `200`

```json
{ "message": "Announcement updated", "id": 1 }
```

| Status | When                   |
|--------|------------------------|
| `404`  | Announcement not found |

---

### `DELETE /api/v1/admin/announcements/{id}`

Permanently deletes an announcement. Requires admin JWT.

**Path param:** `id` — integer primary key.

#### Response `200`

```json
{ "message": "Announcement 1 deleted" }
```

| Status | When                   |
|--------|------------------------|
| `404`  | Announcement not found |

---

## 9. Analytics Export

Download submission and faculty data for any cycle. Responses are binary file downloads.

> **Frontend usage:** Trigger with `window.open('/api/v1/admin/export/...')` so the browser handles the file save, or fetch as a Blob and call `URL.createObjectURL`. The request must still include the `Authorization` header — use the Blob approach for authenticated downloads.

---

### `GET /api/v1/admin/export/submissions`

Exports submission data for the given academic year. Requires admin JWT.

#### Query parameters

| Param           | Type     | Required | Description                                               |
|-----------------|----------|----------|-----------------------------------------------------------|
| `academic_year` | `string` | Yes      | e.g. `"2024-25"`                                          |
| `format`        | `string` | No       | `"csv"` (default) or `"pdf"`                              |
| `school`        | `string` | No       | Filter by school code — export one school only            |

#### Response

Binary file download.

| Format | Content-Type      | Filename                             |
|--------|-------------------|--------------------------------------|
| `csv`  | `text/csv`        | `submissions_2024-25.csv`            |
| `pdf`  | `application/pdf` | `submission_summary_2024-25.pdf`     |

**CSV columns:**

| Column              | Type             | Description                      |
|---------------------|------------------|----------------------------------|
| `email`             | `string`         | Faculty email                    |
| `full_name`         | `string`         | Faculty display name             |
| `school`            | `string`         | School code                      |
| `department`        | `string`         | Department                       |
| `designation`       | `string`         | Job title                        |
| `submission_status` | `string`         | e.g. `"Approved"`, `"Pending Review"` |
| `submitted_at`      | `string \| null` | ISO 8601 datetime or empty       |
| `part_a_total`      | `number \| null` | Self-assessed Part A score       |
| `part_b_total`      | `number \| null` | Self-assessed Part B score       |
| `grand_total`       | `number \| null` | Combined self-assessed score     |

| Status | When                            |
|--------|---------------------------------|
| `400`  | `academic_year` not provided    |
| `404`  | No data found for the given year |

---

### `GET /api/v1/admin/export/faculty`

Exports the complete faculty registry. Requires admin JWT.

#### Query parameters

| Param    | Type     | Required | Description                          |
|----------|----------|----------|--------------------------------------|
| `format` | `string` | No       | `"csv"` (default)                    |
| `school` | `string` | No       | Filter by school code                |
| `role`   | `string` | No       | Filter by `appraisal_role`           |

#### Response

Binary CSV download.

**Filename:** `faculty_registry.csv`

**CSV columns:**

| Column                | Type      | Description                             |
|-----------------------|-----------|-----------------------------------------|
| `email`               | `string`  | Login email (primary key)               |
| `full_name`           | `string`  | Display name                            |
| `appraisal_role`      | `string`  | Role in the system                      |
| `school`              | `string`  | School code                             |
| `department`          | `string`  | Department                              |
| `designation`         | `string`  | Job title                               |
| `employee_id`         | `string`  | Staff ID                                |
| `phone`               | `string`  | Contact number                          |
| `qualification`       | `string`  | Highest qualification                   |
| `teaching_experience` | `string`  | Experience description                  |
| `is_verified`         | `boolean` | Account status                          |
| `created_at`          | `string`  | ISO 8601 account creation datetime      |

---

## 10. Role & School Reference

### Valid `appraisal_role` values

| Value                | Display Name          | Hierarchy Level |
|----------------------|-----------------------|-----------------|
| `faculty`            | Faculty               | 0               |
| `hod`                | Head of Department    | 1               |
| `director`           | Director              | 2               |
| `dean`               | Dean                  | 3               |
| `registrar`          | Registrar             | 3.5             |
| `vc`                 | Vice Chancellor       | 4               |
| `admin`              | Admin                 | 5 — dashboard access only |
| `non_teaching_staff` | Non-teaching Staff    | —               |
| `staff`              | Staff                 | —               |
| `reporting_officer`  | Reporting Officer     | —               |
| `section_head`       | Section Head          | —               |
| `center_head`        | Centre Head           | —               |

> Sending any value not in this list to `POST/PUT /admin/users` returns `400`.

### Valid school codes

| Code     | Full Name                                         | Appraisal Form |
|----------|---------------------------------------------------|----------------|
| `SoCSEA` | School of Computer Science, Engineering & Allied  | Standard       |
| `SoBB`   | School of Bioscience & Biotechnology              | Standard       |
| `SoCE`   | School of Civil Engineering                       | Standard       |
| `SoEMR`  | School of Electronics, Mechatronics & Robotics    | Standard †     |
| `SoC`    | School of Commerce                                | Standard       |
| `CISR`   | Centre for Interdisciplinary Studies & Research   | Standard       |
| `SoMCS`  | School of Media & Communication Studies           | Media          |
| `CioD`   | Centre of Innovation and Design                   | Design         |
| `SoAA`   | School of Applied Arts                            | Design         |

> † `SoEMR` uses the standard form but the HOD score column is visible in the review dashboard. All other standard schools hide the HOD score.

---

## 11. Error Response Format

All API errors return a JSON body. Always display `user_message` in the UI — never `detail`.

```json
{
  "user_message": "Email already registered.",
  "detail": "UNIQUE constraint failed: faculty_profile.email"
}
```

| HTTP Status | Meaning                                           |
|-------------|---------------------------------------------------|
| `400`       | Bad request — missing field, invalid value, duplicate |
| `401`       | Token missing or expired                          |
| `403`       | Valid token but insufficient role                 |
| `404`       | Resource not found                                |
| `422`       | Pydantic validation error — field type mismatch   |
| `500`       | Unexpected server error                           |

`api/client.js` extracts `user_message` automatically into `err.message`, so components just catch and display:

```js
try {
  await api.users.create(formData)
} catch (err) {
  setError(err.message) // already the user_message string
}
```

---

## 12. Frontend API Client Reference

All calls go through `src/api/client.js`. Never write raw `fetch` in components.

```js
import { api } from '../api/client'

// ── Auth ────────────────────────────────────────────────────────────────────
await api.login(email, password)       // POST /auth/login
api.logout()                            // clears localStorage (no request)
api.getProfile()                        // reads localStorage (no request)

// ── Users ───────────────────────────────────────────────────────────────────
await api.users.list({ school, role, search })          // GET  /admin/users
await api.users.create({ email, password, full_name, appraisal_role, school, ... })
                                                         // POST /admin/users
await api.users.update(email, { full_name, is_verified, password, ... })
                                                         // PUT  /admin/users/{email}
await api.users.remove(email)                            // DELETE /admin/users/{email}

// ── Stats ────────────────────────────────────────────────────────────────────
await api.stats.get(academic_year)     // GET  /admin/stats?academic_year=...

// ── Appraisal cycle config ───────────────────────────────────────────────────
await api.cycle.list()                                   // GET    /admin/appraisal-config
await api.cycle.create({ academic_year, is_open, submission_start, submission_end })
                                                         // POST   /admin/appraisal-config
await api.cycle.update(academic_year, { is_open, submission_start, submission_end })
                                                         // PUT    /admin/appraisal-config/{year}
await api.cycle.remove(academic_year)                    // DELETE /admin/appraisal-config/{year}

// ── Pending faculty (dedicated endpoint) ────────────────────────────────────
await api.pending.list({ academic_year, school })        // GET  /admin/pending-faculty

// ── Env config ───────────────────────────────────────────────────────────────
await api.config.get()                                   // GET  /admin/config
await api.config.update({ APP_URL, FRONTEND_URL, MAIL_SERVER, ... })
                                                         // PUT  /admin/config

// ── Feedback (admin read) ────────────────────────────────────────────────────
await api.feedback.list({ category, status, limit })     // GET  /feedback
await api.feedback.get(id)                               // GET  /feedback/{id}

// ── Announcements ────────────────────────────────────────────────────────────
await api.announcements.list({ is_active, limit })       // GET    /admin/announcements
await api.announcements.create({ title, body, audience, is_active })
                                                         // POST   /admin/announcements
await api.announcements.update(id, { title, body, audience, is_active })
                                                         // PUT    /admin/announcements/{id}
await api.announcements.remove(id)                       // DELETE /admin/announcements/{id}

// ── Analytics Export (file downloads) ───────────────────────────────────────
await api.export.submissions({ academic_year, format, school })
                                                         // GET  /admin/export/submissions
await api.export.faculty({ format, school, role })       // GET  /admin/export/faculty
```

---

## 13. Normalizer Mapping Tables

Normalizers live in `src/api/normalizers.js`. They convert exact backend shapes into simpler frontend objects.

### `normalizeStats(raw)` output

| Output key         | Source                                      | Type       |
|--------------------|---------------------------------------------|------------|
| `total`            | `raw.total_registered`                      | `number`   |
| `submitted`        | Sum of all values in `raw.teaching_submission_pipeline` | `number` |
| `pending`          | `total - submitted`                         | `number`   |
| `bySchool[].name`  | Key from `raw.by_school_submitted`          | `string`   |
| `bySchool[].sub`   | Sum of status values for that school        | `number`   |
| `bySchool[].pend`  | `raw.by_school_registered[school] - sub`    | `number`   |
| `bySchool[].total` | `raw.by_school_registered[school]`          | `number`   |
| `availableYears`   | `raw.available_years`                       | `string[]` |
| `academicYear`     | `raw.academic_year`                         | `string`   |
| `byRole`           | `raw.by_role`                               | `object`   |
| `pipeline`         | `raw.teaching_submission_pipeline`          | `object`   |
| `nonTeachingPipeline` | `raw.non_teaching_pipeline`            | `object`   |

### `normalizeUsers(raw)` output

| Output key          | Source field           | Type      | Notes                             |
|---------------------|------------------------|-----------|-----------------------------------|
| `id`                | `email`                | `string`  | email is the PK — no UUID exposed |
| `name`              | `full_name`            | `string`  |                                   |
| `email`             | `email`                | `string`  |                                   |
| `dept`              | `department`           | `string`  | `"—"` if null                     |
| `school`            | `school`               | `string`  | `"—"` if null                     |
| `role`              | `appraisal_role`       | `string`  |                                   |
| `designation`       | `designation`          | `string`  | `"—"` if null                     |
| `employeeId`        | `employee_id`          | `string`  | `"—"` if null                     |
| `phone`             | `phone`                | `string`  | `"—"` if null                     |
| `qualification`     | `qualification`        | `string`  | `"—"` if null                     |
| `teachingExperience`| `teaching_experience`  | `string`  | `"—"` if null                     |
| `status`            | `is_verified`          | `string`  | `false` → `"Unverified"`, else `"Active"` |
| `yr`                | `created_at` (year)    | `string`  |                                   |
| `sub`               | —                       | `boolean` | Always `false` — not in response  |

### `normalizeFeedback(raw)` output

| Output key | Source field                  | Type     | Notes                                    |
|------------|-------------------------------|----------|------------------------------------------|
| `id`       | `id`                          | `string` | UUID                                     |
| `user`     | `name` or `email`             | `string` |                                          |
| `av`       | initials from `name`/`email`  | `string` | max 2 chars, uppercase                   |
| `subject`  | `subject`                     | `string` |                                          |
| `msg`      | `message`                     | `string` |                                          |
| `cat`      | `category`                    | `string` | `"bug"` → `"Bug"`, all others → `"Query"` |
| `date`     | `submitted_at`                | `string` | Formatted as `"May 8"`                   |
| `status`   | `status`                      | `string` | Title-cased, underscores → spaces        |

### `normalizeAnnouncements(raw)` output

| Output key   | Source field  | Type      | Notes                                          |
|--------------|---------------|-----------|------------------------------------------------|
| `id`         | `id`          | `number`  | Integer PK                                     |
| `title`      | `title`       | `string`  |                                                |
| `body`       | `body`        | `string`  |                                                |
| `audience`   | `audience`    | `string`  | Raw value e.g. `"all"`, `"faculty"`            |
| `isActive`   | `is_active`   | `boolean` |                                                |
| `createdBy`  | `created_by`  | `string`  | Admin email                                    |
| `date`       | `created_at`  | `string`  | Formatted as `"May 8"`                         |

---

## 14. Endpoint Summary

| Method     | Path                                        | Auth  | Used by page(s)                              |
|------------|---------------------------------------------|-------|----------------------------------------------|
| `POST`     | `/api/v1/auth/login`                        | No    | Login                                        |
| `GET`      | `/api/v1/auth/me`                           | Yes   | Profile display in sidebar                   |
| `PUT`      | `/api/v1/auth/me`                           | Yes   | Profile edit                                 |
| `POST`     | `/api/v1/auth/forgot-password`              | No    | Reset password flow                          |
| `POST`     | `/api/v1/auth/reset-password`               | No    | Reset password flow                          |
| `GET`      | `/api/v1/admin/users`                       | Yes   | Faculty List, Faculty Status                 |
| `POST`     | `/api/v1/admin/users`                       | Yes   | Add Faculty, Credentials → Generate          |
| `PUT`      | `/api/v1/admin/users/{email}`               | Yes   | Faculty List Edit, Activate/Deactivate, Password Reset |
| `DELETE`   | `/api/v1/admin/users/{email}`               | Yes   | Faculty List Remove                          |
| `GET`      | `/api/v1/admin/stats`                       | Yes   | Overview, Appraisal Cycle, Submission Status, School Statistics, Analytics |
| `GET`      | `/api/v1/admin/appraisal-config`            | Yes   | Section Controls, Submission Window          |
| `POST`     | `/api/v1/admin/appraisal-config`            | Yes   | Submission Window → create cycle             |
| `PUT`      | `/api/v1/admin/appraisal-config/{year}`     | Yes   | Section Controls → open/close, Submission Window |
| `DELETE`   | `/api/v1/admin/appraisal-config/{year}`     | Yes   | Submission Window → delete cycle             |
| `GET`      | `/api/v1/admin/pending-faculty`             | Yes   | Pending Faculty page                         |
| `GET`      | `/api/v1/admin/config`                      | Yes   | Settings → System Configuration             |
| `PUT`      | `/api/v1/admin/config`                      | Yes   | Settings → Save Changes                      |
| `POST`     | `/api/v1/feedback`                          | No    | (submitted by faculty — not admin UI)        |
| `GET`      | `/api/v1/feedback`                          | Yes   | Feedback & Support                           |
| `GET`      | `/api/v1/feedback/{id}`                     | Yes   | Feedback detail view                         |
| `GET`      | `/api/v1/admin/announcements`               | Yes   | Announcements → Past Notices list            |
| `POST`     | `/api/v1/admin/announcements`               | Yes   | Announcements → Publish Notice               |
| `PUT`      | `/api/v1/admin/announcements/{id}`          | Yes   | Announcements → Edit / Deactivate            |
| `DELETE`   | `/api/v1/admin/announcements/{id}`          | Yes   | Announcements → Remove                       |
| `GET`      | `/api/v1/admin/export/submissions`          | Yes   | Analytics → Download Submission Summary      |
| `GET`      | `/api/v1/admin/export/faculty`              | Yes   | Analytics → Download Faculty Registry        |

---

*Generated from live backend source — `src/api/v1/admin.py`, `src/api/v1/auth.py`, `src/api/v1/feedback.py`, `src/schema/core.py`*  
*Sections §8 (Announcements) and §9 (Analytics Export) are planned endpoints — implement in `src/api/v1/admin.py`.*
