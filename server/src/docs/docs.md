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

## Data Model

Fields of the Project resource.

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
