# Project Dashboard API

> Reference for the Project Dashboard REST API.

_Source: https://project-dashboard-m5mk.onrender.com_

## Overview

The Project Dashboard API is a small REST service for managing portfolio projects. Reads are public; writes require an admin bearer token. All responses are JSON and share a consistent envelope so clients can handle success and failure uniformly.

### Base URL

```
https://project-dashboard-m5mk.onrender.com
```

### Response envelope

Every response is wrapped in an envelope with a `status` field. Success responses use `status: "success"` and carry their payload under `data` (list responses additionally include `total` and `count`). Error responses use `status: "error"` and a human-readable `message`.

```json
{
  "success": {
    "status": "success",
    "data": {}
  },
  "error": {
    "status": "error",
    "message": "Project not found"
  }
}
```

## Authentication

Obtain a token from `POST /api/auth/login`, then send it on protected requests using the `Authorization` header. Tokens are valid for 7 days; once expired, log in again.

### Authorization header

```
Authorization: Bearer <token>
```

### Login request

```json
{
  "username": "admin",
  "password": "your-password"
}
```

### Login response

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "665f1c2e9b1e4a0012a3b4c5",
    "username": "admin",
    "email": "admin@example.com",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "fullName": "Ada Lovelace",
    "role": "admin"
  }
}
```

## Endpoints

Reads are public; writes require an admin bearer token.

### Auth

#### POST /api/auth/login

Authenticate an admin by username + password and receive a signed JWT plus the admin profile. The token is valid for 7 days.

**Auth required:** No

**Request body**

```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response example**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "665f1c2e9b1e4a0012a3b4c5",
    "username": "admin",
    "role": "admin"
  }
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Authenticated — token issued |
| 400 | Missing username or password |
| 401 | Invalid username or password |
| 500 | Server error |

#### GET /api/auth/me

Return the profile of the currently authenticated admin. Requires a valid bearer token; used by the client to render the profile menu.

**Auth required:** Yes

**Response example**

```json
{
  "status": "success",
  "admin": {
    "_id": "665f1c2e9b1e4a0012a3b4c5",
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "Ada Lovelace",
    "role": "admin"
  }
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 401 | Missing, invalid, or expired token |
| 404 | Admin no longer exists |
| 500 | Server error |

### Projects

#### GET /api/projects

Fetch all projects. Supports optional filtering, capping, and sorting via query parameters. The response includes `total` (all matches) and `count` (rows returned after the limit).

**Auth required:** No

**Query parameters**

| Name | Type | Description |
| --- | --- | --- |
| status | string | Filter by 'active' or 'completed'. Omit to return all. |
| limit | number | Cap the number of results (default 100). |
| sort | string | Order by creation_time \| -creation_time \| updation_time \| -updation_time (default -creation_time, newest first). |

**Response example**

```json
{
  "status": "success",
  "total": 12,
  "count": 12,
  "data": [
    {
      "_id": "665f1c2e9b1e4a0012a3b4c5",
      "slug": "project-dashboard",
      "title": "Project Dashboard",
      "description": "A themed dashboard for managing portfolio projects.",
      "status": "active",
      "techStack": [
        "React",
        "Express",
        "MongoDB"
      ],
      "tags": [
        "fullstack"
      ],
      "featured": true,
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-06-10T12:30:00.000Z"
    }
  ]
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 500 | Server error |

#### GET /api/projects/:slug

Fetch a single project by its URL slug.

**Auth required:** No

**Path parameters**

| Name | Type | Description |
| --- | --- | --- |
| slug | string | The project's unique URL-facing identifier. |

**Response example**

```json
{
  "status": "success",
  "data": {
    "_id": "665f1c2e9b1e4a0012a3b4c5",
    "slug": "project-dashboard",
    "title": "Project Dashboard",
    "description": "A themed dashboard for managing portfolio projects.",
    "status": "active",
    "techStack": [
      "React",
      "Express",
      "MongoDB"
    ],
    "liveUrl": "https://example.com",
    "repoUrl": "https://github.com/example/project-dashboard",
    "featured": true,
    "tags": [
      "fullstack"
    ],
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-10T12:30:00.000Z"
  }
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 404 | No project with that slug |
| 500 | Server error |

#### POST /api/projects

Create a new project. Requires admin auth. `slug`, `title`, and `description` are required; all other fields are optional.

**Auth required:** Yes

**Request body**

```json
{
  "slug": "new-project",
  "title": "New Project",
  "description": "What this project is about.",
  "status": "active",
  "techStack": [
    "React",
    "Tailwind"
  ],
  "liveUrl": "https://example.com",
  "repoUrl": "https://github.com/example/new-project",
  "featured": false,
  "tags": [
    "frontend"
  ]
}
```

**Response example**

```json
{
  "status": "success",
  "data": {
    "_id": "665f1c2e9b1e4a0012a3b4c6",
    "slug": "new-project",
    "title": "New Project",
    "description": "What this project is about.",
    "status": "active",
    "techStack": [
      "React",
      "Tailwind"
    ],
    "featured": false,
    "tags": [
      "frontend"
    ],
    "createdAt": "2026-06-20T09:00:00.000Z",
    "updatedAt": "2026-06-20T09:00:00.000Z"
  }
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 201 | Created |
| 400 | Validation failed (missing/invalid fields) |
| 401 | Missing, invalid, or expired token |

#### PUT /api/projects/:slug

Update an existing project by slug, returning the updated document. Requires admin auth. Send only the fields you want to change.

**Auth required:** Yes

**Path parameters**

| Name | Type | Description |
| --- | --- | --- |
| slug | string | Slug of the project to update. |

**Request body**

```json
{
  "status": "completed",
  "featured": true
}
```

**Response example**

```json
{
  "status": "success",
  "data": {
    "_id": "665f1c2e9b1e4a0012a3b4c5",
    "slug": "project-dashboard",
    "title": "Project Dashboard",
    "status": "completed",
    "featured": true,
    "updatedAt": "2026-06-20T11:00:00.000Z"
  }
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Updated |
| 400 | Validation failed |
| 401 | Missing, invalid, or expired token |
| 404 | No project with that slug |

#### DELETE /api/projects/:slug

Delete a project by slug. Requires admin auth. Returns a confirmation message rather than a `data` payload.

**Auth required:** Yes

**Path parameters**

| Name | Type | Description |
| --- | --- | --- |
| slug | string | Slug of the project to delete. |

**Response example**

```json
{
  "status": "success",
  "message": "Project deleted successfully"
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Deleted |
| 401 | Missing, invalid, or expired token |
| 404 | No project with that slug |
| 500 | Server error |

### Feedback

#### POST /api/feedback

Submit a contact-form feedback. Public — no auth required. Sent as multipart/form-data so an optional `image` file can ride along; the server uploads it to Cloudinary and stores the resulting URL. Images must be 2 MB or smaller. A unique 16-digit `f_id` and `status: "active"` are assigned automatically.

**Auth required:** No

**Request body**

```json
{
  "title": "Bug on the projects page",
  "name": "Grace Hopper",
  "email": "grace@example.com",
  "phone": "+1 555 0100",
  "message": "The filter tabs overlap on mobile."
}
```

**Response example**

```json
{
  "status": "success",
  "data": {
    "_id": "665f1c2e9b1e4a0012a3b4d0",
    "f_id": "4821093746512083",
    "title": "Bug on the projects page",
    "status": "active",
    "name": "Grace Hopper",
    "email": "grace@example.com",
    "phone": "+1 555 0100",
    "message": "The filter tabs overlap on mobile.",
    "imageUrl": "https://res.cloudinary.com/<cloud>/image/upload/feedback/abc123.png",
    "createdAt": "2026-06-22T08:00:00.000Z",
    "updatedAt": "2026-06-22T08:00:00.000Z"
  }
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 201 | Created |
| 400 | Validation failed or image is larger than 2 MB |

#### GET /api/feedback

List feedback submissions. Requires admin auth. Supports status filtering, sorting, and pagination via query parameters. The response includes `total` (all matches) and `count` (rows on this page).

**Auth required:** Yes

**Query parameters**

| Name | Type | Description |
| --- | --- | --- |
| status | string | Filter by 'active', 'completed', or 'onhold'. Omit to return all. |
| sort | string | Order by creation_time \| -creation_time \| updation_time \| -updation_time (default -creation_time, newest first). |
| page | number | 1-based page number (default 1). |
| limit | number | Page size (default 15). |

**Response example**

```json
{
  "status": "success",
  "total": 23,
  "count": 15,
  "page": 1,
  "limit": 15,
  "data": [
    {
      "_id": "665f1c2e9b1e4a0012a3b4d0",
      "f_id": "4821093746512083",
      "title": "Bug on the projects page",
      "status": "active",
      "name": "Grace Hopper",
      "email": "grace@example.com",
      "message": "The filter tabs overlap on mobile.",
      "imageUrl": "https://res.cloudinary.com/<cloud>/image/upload/feedback/abc123.png",
      "createdAt": "2026-06-22T08:00:00.000Z",
      "updatedAt": "2026-06-22T08:00:00.000Z"
    }
  ]
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 401 | Missing, invalid, or expired token |
| 500 | Server error |

#### GET /api/feedback/:id

Fetch a single feedback by its `f_id`. Requires admin auth. Note the path identifier is the 16-digit `f_id`, not the Mongo `_id`.

**Auth required:** Yes

**Path parameters**

| Name | Type | Description |
| --- | --- | --- |
| id | string | The feedback's f_id (16-digit business id). |

**Response example**

```json
{
  "status": "success",
  "data": {
    "_id": "665f1c2e9b1e4a0012a3b4d0",
    "f_id": "4821093746512083",
    "title": "Bug on the projects page",
    "status": "active",
    "name": "Grace Hopper",
    "email": "grace@example.com",
    "phone": "+1 555 0100",
    "message": "The filter tabs overlap on mobile.",
    "imageUrl": "https://res.cloudinary.com/<cloud>/image/upload/feedback/abc123.png",
    "createdAt": "2026-06-22T08:00:00.000Z",
    "updatedAt": "2026-06-22T08:00:00.000Z"
  }
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 401 | Missing, invalid, or expired token |
| 404 | No feedback with that f_id |
| 500 | Server error |

#### PUT /api/feedback/:id

Update a feedback by its `f_id`, returning the updated document. Requires admin auth. Editable fields: title, name, email, phone, message, status. Send as multipart/form-data with an `image` file to replace the uploaded image (the previous Cloudinary asset is removed). Replacement images must be 2 MB or smaller.

**Auth required:** Yes

**Path parameters**

| Name | Type | Description |
| --- | --- | --- |
| id | string | The feedback's f_id to update. |

**Request body**

```json
{
  "status": "completed"
}
```

**Response example**

```json
{
  "status": "success",
  "data": {
    "_id": "665f1c2e9b1e4a0012a3b4d0",
    "f_id": "4821093746512083",
    "title": "Bug on the projects page",
    "status": "completed",
    "name": "Grace Hopper",
    "email": "grace@example.com",
    "message": "The filter tabs overlap on mobile.",
    "updatedAt": "2026-06-22T10:30:00.000Z"
  }
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Updated |
| 400 | Validation failed or image is larger than 2 MB |
| 401 | Missing, invalid, or expired token |
| 404 | No feedback with that f_id |

#### DELETE /api/feedback/:id

Delete a feedback by its `f_id`. Requires admin auth. Also removes the associated Cloudinary image. Returns a confirmation message rather than a `data` payload.

**Auth required:** Yes

**Path parameters**

| Name | Type | Description |
| --- | --- | --- |
| id | string | The feedback's f_id to delete. |

**Response example**

```json
{
  "status": "success",
  "message": "Feedback deleted successfully"
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Deleted |
| 401 | Missing, invalid, or expired token |
| 404 | No feedback with that f_id |
| 500 | Server error |

### TechStack

#### GET /api/techstacks

List the full tech-stack catalog, sorted by category then name. Public — powers the cascading category → tech picker on the Add/Edit Project forms.

**Auth required:** No

**Response example**

```json
{
  "status": "success",
  "count": 93,
  "data": [
    {
      "_id": "665f1c2e9b1e4a0012a3b4e0",
      "list_id": "4821093746512083",
      "name": "React",
      "category": "frontend",
      "createdAt": "2026-06-24T08:00:00.000Z",
      "updatedAt": "2026-06-24T08:00:00.000Z"
    }
  ]
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 500 | Server error |

#### POST /api/techstacks

Add a tech to the catalog. Requires admin auth. Used by the picker's "add custom" path, which files new entries under "others". Idempotent on (name, category): an existing case-insensitive match is returned as-is with 200 instead of creating a duplicate.

**Auth required:** Yes

**Request body**

```json
{
  "name": "Astro",
  "category": "frontend"
}
```

**Response example**

```json
{
  "status": "success",
  "data": {
    "_id": "665f1c2e9b1e4a0012a3b4e1",
    "list_id": "5930148265913074",
    "name": "Astro",
    "category": "frontend",
    "createdAt": "2026-06-24T09:00:00.000Z",
    "updatedAt": "2026-06-24T09:00:00.000Z"
  }
}
```

**Status codes**

| Code | Meaning |
| --- | --- |
| 201 | Created |
| 200 | Already exists — returns the existing entry |
| 400 | Validation failed (missing name or bad category) |
| 401 | Missing, invalid, or expired token |

## Data Model

Fields of each resource.

### Admin

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| _id | string | No | MongoDB document id, assigned automatically. |
| user_id | string | No | Unique 16-digit business id, generated on create. |
| username | string | Yes | Login identifier; unique, stored lowercased. |
| password | string | Yes | Bcrypt hash set by a pre-save hook — stored only, never returned in any API response. |
| email | string | No | Admin email, stored lowercased. |
| firstName | string | No | Given name, if set. |
| lastName | string | No | Family name, if set. |
| fullName | string | No | Virtual — first + last name, derived (not stored). |
| role | "admin" | No | Account role. Defaults to "admin". |
| createdAt | string (ISO) | No | Creation timestamp, managed by Mongoose. |
| updatedAt | string (ISO) | No | Last-update timestamp, managed by Mongoose. |

### Project

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| _id | string | No | MongoDB document id, assigned automatically. |
| slug | string | Yes | Unique, lowercased URL identifier (used in routes and as the key). |
| title | string | Yes | Display name. |
| description | string | Yes | Full project summary. |
| status | "active" \| "completed" | No | Project state. Defaults to "active". |
| techStack | string[] | No | Technologies used. Defaults to an empty array. |
| liveUrl | string | No | Live demo URL, if any. |
| repoUrl | string | No | Source repository URL, if any. |
| featured | boolean | No | Whether to highlight the project. Defaults to false. |
| imageUrl | string | No | Thumbnail path, if any. |
| tags | string[] | No | Freeform category tags. Defaults to an empty array. |
| createdAt | string (ISO) | No | Creation timestamp, managed by Mongoose. |
| updatedAt | string (ISO) | No | Last-update timestamp, managed by Mongoose. |

### Feedback

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| _id | string | No | MongoDB document id, assigned automatically. |
| f_id | string | No | Unique 16-digit business id, generated on create; used in routes. |
| title | string | Yes | Short subject line; shown in the admin Report list. |
| status | "active" \| "completed" \| "onhold" | No | Triage state. Defaults to "active". |
| name | string | Yes | Sender's name. |
| email | string | Yes | Sender's email (stored lowercased). |
| phone | string | No | Sender's phone, if provided. |
| message | string | Yes | The message body. |
| imageUrl | string | No | Cloudinary secure URL of the uploaded image, if any. |
| imagePublicId | string | No | Cloudinary public_id of the image, used for replace/delete. |
| createdAt | string (ISO) | No | Creation timestamp, managed by Mongoose. |
| updatedAt | string (ISO) | No | Last-update timestamp, managed by Mongoose. |

### Tech Stack

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| _id | string | No | MongoDB document id, assigned automatically. |
| list_id | string | No | Unique 16-digit public id, generated on create. |
| name | string | Yes | Display name of the technology (e.g. "React"). |
| category | "frontend" \| "backend" \| "fullstack" \| "cloud" \| "AI" \| "cybersec" \| "testing" \| "others" | Yes | Group the tech belongs to in the picker. Custom adds use "others". |
| createdAt | string (ISO) | No | Creation timestamp, managed by Mongoose. |
| updatedAt | string (ISO) | No | Last-update timestamp, managed by Mongoose. |

## Status Codes

Conventions used across every endpoint.

| Code | Meaning |
| --- | --- |
| 200 | OK — request succeeded (GET, PUT, DELETE). |
| 201 | Created — a new resource was created (POST). |
| 400 | Bad Request — validation failed or required fields are missing. |
| 401 | Unauthorized — missing/invalid/expired token, or bad credentials. |
| 404 | Not Found — no resource matches the identifier. |
| 500 | Server Error — an unexpected failure occurred. |
