# Project Dashboard

[![Client version](https://img.shields.io/badge/client-v1.0.1-blue.svg)](https://github.com/tejash098/Project-Dashboard) [![Server version](https://img.shields.io/badge/server-v1.0.0-green.svg)](https://github.com/tejash098/Project-Dashboard) [![License](https://img.shields.io/badge/license-ISC-lightgrey.svg)](https://github.com/tejash098/Project-Dashboard)

A full-stack project portfolio dashboard for publishing projects, tracking GitHub insights, and managing visitor feedback from one place.

## Tech Stack

### Frontend

- React 19 and React DOM
- Vite
- React Router
- Material UI, Emotion, Tailwind CSS, and Lucide React
- Axios
- Recharts
- Swagger UI React
- Cloudinary React SDK
- EmailJS

### Backend

- Node.js and Express 5
- MongoDB with Mongoose
- Redis for optional GitHub statistics caching
- JWT and bcryptjs for administrator authentication
- Cloudinary and Multer for feedback image uploads
- CORS, dotenv, and Nodemon

## Features

- Dashboard with project metrics and GitHub language statistics
- Public project catalogue and project detail pages
- Admin authentication with JWT-protected management routes
- Create, update, and delete projects
- Technology stack catalogue and project technology picker
- Public contact and feedback form
- Optional feedback image uploads through Cloudinary
- Protected feedback reporting and status management
- Interactive Swagger API reference
- Markdown API documentation endpoint
- Redis-backed GitHub statistics caching with direct-fetch fallback
- Per-IP API rate limiting
- Responsive interface with theme and sidebar controls

## Prerequisites

- Node.js 18 or later
- npm
- MongoDB or a MongoDB Atlas cluster
- Cloudinary account and API credentials
- Redis instance (optional; used to cache GitHub language statistics)
- EmailJS account (optional; used for client-side email delivery)

## Installation and Setup

Clone the repository and install dependencies for both applications:

```bash
git clone https://github.com/tejash098/Project-Dashboard.git
cd Project-Dashboard

cd server
npm install

cd ../client
npm install
```

### Configure the server

From the repository root, copy the server environment template.

Windows Command Prompt:

```bat
copy server\.env.example server\.env
```

macOS, Linux, or Git Bash:

```bash
cp server/.env.example server/.env
```

Set the required values in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>
JWT_SECRET=replace-with-a-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Optional settings include `ADMIN_USERNAME` and `ADMIN_PASSWORD` for bootstrap admin creation, Redis connection values, `GITHUB_USERNAME`, and rate-limit values. See `server/.env.example` for the complete list.

### Configure the client

Windows Command Prompt:

```bat
copy client\.env.example client\.env
```

macOS, Linux, or Git Bash:

```bash
cp client/.env.example client/.env
```

Set the backend URL in `client/.env`:

```env
SERVER_BASE_URL=http://localhost:5000/api
```

EmailJS can be enabled with the public values below:

```env
VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_TEMPLATE_ID=your-template-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key
```

Never expose server-only secrets, including the Cloudinary API secret, in client environment variables.

### Seed technology stacks

```bash
cd server
npm run seed:techstacks
```

## Usage

Run the backend and frontend in separate terminals.

Start the API:

```bash
cd server
npm run dev
```

The API listens on `http://localhost:5000` by default. Start the frontend:

```bash
cd client
npm run dev
```

The Vite development server is normally available at `http://localhost:5173`.

### Application routes

| Path              | Description                               |
| ----------------- | ----------------------------------------- |
| `/`               | Dashboard overview                        |
| `/about`          | About page                                |
| `/projects`       | Public project catalogue                  |
| `/projects/:slug` | Project details                           |
| `/github`         | GitHub profile and repository information |
| `/docs`           | API documentation                         |
| `/docs/swagger`   | Interactive Swagger UI                    |
| `/contact`        | Contact and feedback form                 |
| `/projects/new`   | Protected project creation form           |
| `/report`         | Protected feedback report                 |

### API examples

The API base path is `/api`. Check the health endpoint:

```bash
curl http://localhost:5000/api/status
```

List public projects:

```bash
curl http://localhost:5000/api/projects
```

Authenticate an administrator:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin-username","password":"admin-password"}'
```

Protected endpoints require the returned token:

```http
Authorization: Bearer <token>
```

The API includes project, authentication, feedback, technology stack, GitHub statistics, status, and documentation endpoints. The feedback upload endpoint accepts an optional `image` field and limits images to 2 MB.

### Available scripts

Client scripts:

```bash
cd client
npm run dev
npm run build
npm run preview
npm run lint
npm run generate:docs-md
```

Server scripts:

```bash
cd server
npm run dev
npm start
npm run seed:techstacks
```

## Folder Structure

```text
project-dashboard/
├── client/
│   ├── public/              Static assets and web manifest
│   ├── scripts/             Documentation generation scripts
│   └── src/
│       ├── components/      Reusable UI and navigation components
│       ├── config/          Client configuration and constants
│       ├── context/         Authentication, theme, sidebar, and toast state
│       ├── data/             Static application and API documentation data
│       ├── hooks/            Custom React hooks
│       ├── layouts/          Shared application layouts
│       ├── lib/              Formatting and domain utilities
│       ├── pages/            Route-level page components
│       ├── services/         Backend API service modules
│       ├── styles/           Design tokens and shared styles
│       └── utils/            Documentation and OpenAPI helpers
├── server/
│   └── src/
│       ├── config/           Environment, database, Redis, and seed setup
│       ├── controllers/      Request handlers and business logic
│       ├── docs/             Generated API documentation
│       ├── middleware/       Authentication and rate limiting
│       ├── models/           Mongoose data models
│       ├── routes/           Express route definitions
│       ├── scripts/          Data seeding scripts
│       └── utils/            Server utilities
└── README.md
```

## Contributing

1. Create a focused branch for your change.
2. Install dependencies in both `client` and `server`.
3. Run `npm run lint` and `npm run build` from `client` before opening a pull request.
4. Update this README when routes, scripts, configuration, or user-facing behavior changes.
5. Never commit `.env` files, credentials, private keys, or generated secrets.

## License

This project is licensed under the ISC License, as declared in `server/package.json`.
